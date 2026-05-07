import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { fetchMovieDetail, fixImg } from "@/lib/phim-api";
import { useQuery } from "@tanstack/react-query";
import { HlsPartyPlayer } from "@/components/HlsPartyPlayer";
import { Mic, MicOff, Send, Users, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface Message {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface Participant {
  id: string;
  user_id: string;
  display_name: string;
  mic_enabled: boolean;
  mic_muted: boolean;
}

export default function WatchParty() {
  const { code = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [muted, setMuted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  const { data: detail } = useQuery({
    queryKey: ["movie", room?.movie_slug],
    queryFn: () => fetchMovieDetail(room.movie_slug),
    enabled: !!room?.movie_slug,
  });

  // Load room + verify password from sessionStorage
  useEffect(() => {
    if (!user) {
      toast.error("Vui lòng đăng nhập");
      navigate("/auth");
      return;
    }
    (async () => {
      const { data } = await supabase.from("watch_rooms").select("*").eq("room_code", code).maybeSingle();
      if (!data) {
        toast.error("Phòng không tồn tại");
        navigate("/");
        return;
      }
      const stored = sessionStorage.getItem(`room-pw-${code}`);
      if (!stored) {
        toast.error("Vui lòng vào phòng qua dialog");
        navigate(`/phim/${data.movie_slug}`);
        return;
      }
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(stored));
      const hash = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
      if (hash !== data.password_hash) {
        toast.error("Sai mật khẩu");
        navigate("/");
        return;
      }
      setRoom(data);

      // Check capacity
      const { count } = await supabase.from("room_participants").select("*", { count: "exact", head: true }).eq("room_id", data.id);
      if ((count ?? 0) >= data.max_users) {
        toast.error("Phòng đã đầy (40 người)");
        navigate("/");
        return;
      }

      // Join
      const display_name = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
      await supabase.from("room_participants").upsert(
        { room_id: data.id, user_id: user.id, display_name, mic_enabled: false, mic_muted: false },
        { onConflict: "room_id,user_id" }
      );
      setAuthorized(true);
    })();

    return () => {
      // Leave on unmount
      (async () => {
        if (room && user) {
          await supabase.from("room_participants").delete().eq("room_id", room.id).eq("user_id", user.id);
        }
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user]);

  // Realtime channel: chat, participants, video sync, WebRTC signaling
  useEffect(() => {
    if (!authorized || !room || !user) return;

    const ch = supabase.channel(`room:${room.id}`, { config: { presence: { key: user.id } } });
    channelRef.current = ch;

    ch.on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` }, (payload) => {
      setMessages((m) => [...m, payload.new as Message]);
    });
    ch.on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${room.id}` }, async () => {
      const { data } = await supabase.from("room_participants").select("*").eq("room_id", room.id);
      setParticipants((data ?? []) as Participant[]);
    });

    // WebRTC signaling broadcast
    ch.on("broadcast", { event: "webrtc-offer" }, async ({ payload }) => {
      if (payload.to !== user.id) return;
      await handleOffer(payload.from, payload.sdp);
    });
    ch.on("broadcast", { event: "webrtc-answer" }, async ({ payload }) => {
      if (payload.to !== user.id) return;
      const pc = peersRef.current.get(payload.from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
    });
    ch.on("broadcast", { event: "webrtc-ice" }, async ({ payload }) => {
      if (payload.to !== user.id) return;
      const pc = peersRef.current.get(payload.from);
      if (pc && payload.candidate) await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    });

    // Host moderation
    ch.on("broadcast", { event: "host-force-mic-off" }, () => {
      if (user.id === room.host_id) return;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        peersRef.current.forEach((pc) => pc.close());
        peersRef.current.clear();
        setMicOn(false);
        supabase.from("room_participants").update({ mic_enabled: false }).eq("room_id", room.id).eq("user_id", user.id);
        toast.info("Chủ phòng đã tắt mic của bạn");
      }
    });
    ch.on("broadcast", { event: "host-mute-all" }, ({ payload }) => {
      if (user.id === room.host_id) return;
      const next = !!payload?.muted;
      setMuted(next);
      audioElsRef.current.forEach((a) => (a.muted = next));
      toast.info(next ? "Chủ phòng đã tắt âm phòng" : "Chủ phòng đã bật âm phòng");
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        // Initial loads
        const [{ data: msgs }, { data: parts }] = await Promise.all([
          supabase.from("room_messages").select("*").eq("room_id", room.id).order("created_at"),
          supabase.from("room_participants").select("*").eq("room_id", room.id),
        ]);
        setMessages((msgs ?? []) as Message[]);
        setParticipants((parts ?? []) as Participant[]);
      }
    });

    return () => {
      ch.unsubscribe();
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      audioElsRef.current.forEach((a) => a.remove());
      audioElsRef.current.clear();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorized, room?.id, user?.id]);

  // Auto scroll chat
  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ==== WebRTC ====
  const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  function createPeer(remoteId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current.set(remoteId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({ type: "broadcast", event: "webrtc-ice", payload: { from: user!.id, to: remoteId, candidate: e.candidate.toJSON() } });
      }
    };
    pc.ontrack = (e) => {
      let audio = audioElsRef.current.get(remoteId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioElsRef.current.set(remoteId, audio);
      }
      audio.srcObject = e.streams[0];
      audio.muted = muted;
    };
    return pc;
  }

  async function handleOffer(from: string, sdp: RTCSessionDescriptionInit) {
    const pc = createPeer(from);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    channelRef.current?.send({ type: "broadcast", event: "webrtc-answer", payload: { from: user!.id, to: from, sdp: answer } });
  }

  const toggleMic = async () => {
    if (micOn) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      peersRef.current.forEach((pc) => pc.close());
      peersRef.current.clear();
      setMicOn(false);
      await supabase.from("room_participants").update({ mic_enabled: false }).eq("room_id", room.id).eq("user_id", user!.id);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setMicOn(true);
      await supabase.from("room_participants").update({ mic_enabled: true }).eq("room_id", room.id).eq("user_id", user!.id);

      // Initiate calls to all other participants
      for (const p of participants) {
        if (p.user_id === user!.id) continue;
        const pc = createPeer(p.user_id);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        channelRef.current?.send({ type: "broadcast", event: "webrtc-offer", payload: { from: user!.id, to: p.user_id, sdp: offer } });
      }
    } catch (e: any) {
      toast.error("Không truy cập được mic: " + e.message);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audioElsRef.current.forEach((a) => (a.muted = next));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !room || !user) return;
    const display_name = user.user_metadata?.display_name || user.email?.split("@")[0] || "User";
    const content = chatInput.trim().slice(0, 500);
    setChatInput("");
    await supabase.from("room_messages").insert({ room_id: room.id, user_id: user.id, display_name, content });
  };

  const broadcastVideoState = (state: { type: "play" | "pause" | "seek"; time: number }) => {
    if (!room || user?.id !== room.host_id) return;
    channelRef.current?.send({ type: "broadcast", event: "video-sync", payload: state });
  };

  const hostForceMicOffAll = () => {
    if (!room || user?.id !== room.host_id) return;
    channelRef.current?.send({ type: "broadcast", event: "host-force-mic-off", payload: {} });
    toast.success("Đã tắt mic toàn bộ thành viên");
  };

  const hostMuteAll = () => {
    if (!room || user?.id !== room.host_id) return;
    const next = !muted;
    setMuted(next);
    audioElsRef.current.forEach((a) => (a.muted = next));
    channelRef.current?.send({ type: "broadcast", event: "host-mute-all", payload: { muted: next } });
    toast.success(next ? "Đã tắt âm cho cả phòng" : "Đã bật lại âm cho cả phòng");
  };

  const copyInvite = async () => {
    if (!room) return;
    const pw = sessionStorage.getItem(`room-pw-${room.room_code}`) || "";
    const text = `Cùng xem "${room.movie_name}" trên CineFlow nhé!\nMã phòng: ${room.room_code}${pw ? `\nMật khẩu: ${pw}` : ""}\nLink: ${window.location.origin}/phong/${room.room_code}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã copy lời mời, gửi cho bạn bè ngay!");
    } catch {
      toast.error("Không thể copy");
    }
  };

  if (!room || !authorized) {
    return <div className="flex h-[60vh] items-center justify-center">Đang vào phòng...</div>;
  }

  const movie = detail?.movie;
  const episodes = detail?.episodes ?? movie?.episodes ?? [];
  const ep = episodes.flatMap((s) => s.server_data).find((e) => e.slug === room.episode_slug) ?? episodes[0]?.server_data?.[0];
  const isHost = user?.id === room.host_id;

  return (
    <div className="px-4 py-6 md:px-12">
      <Link to={`/phim/${room.movie_slug}`} className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Rời phòng
      </Link>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div>
          <h1 className="text-xl font-bold">{room.movie_name}</h1>
          <p className="text-sm text-muted-foreground">
            Mã phòng: <span className="font-mono font-bold text-primary">{room.room_code}</span> · {participants.length}/{room.max_users} người · {isHost ? "Bạn là chủ phòng" : "Bạn là khách"}
          </p>
        </div>
        <button
          onClick={copyInvite}
          className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold hover:bg-accent"
        >
          <Users className="h-4 w-4" /> Copy lời mời
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
            {ep ? (
              <HlsPartyPlayer
                src={ep.link_m3u8}
                poster={fixImg(movie?.thumb_url || movie?.poster_url)}
                isHost={isHost}
                channel={channelRef.current}
                onBroadcast={broadcastVideoState}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Đang tải video...</div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleMic}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold ${micOn ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}
            >
              {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              {micOn ? "Đang phát mic" : "Bật mic"}
            </button>
            <button
              onClick={toggleMute}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-2 font-semibold text-secondary-foreground"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {muted ? "Bật âm" : "Tắt âm tất cả"}
            </button>

            {isHost && (
              <>
                <div className="mx-2 h-6 w-px bg-border" />
                <button
                  onClick={hostMuteAll}
                  className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
                  title="Tắt/bật âm cho toàn bộ thành viên"
                >
                  <VolumeX className="h-4 w-4" /> Mute cả phòng
                </button>
                <button
                  onClick={hostForceMicOffAll}
                  className="inline-flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20"
                  title="Buộc tắt mic của mọi người"
                >
                  <MicOff className="h-4 w-4" /> Tắt mic mọi người
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4" /> Thành viên ({participants.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs">
                  {p.mic_enabled ? <Mic className="h-3 w-3 text-primary" /> : <MicOff className="h-3 w-3 text-muted-foreground" />}
                  <span>{p.display_name}</span>
                  {p.user_id === room.host_id && <span className="text-primary">★</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-1 flex-col rounded-lg border border-border bg-card">
            <div ref={chatBoxRef} className="h-[400px] flex-1 overflow-y-auto p-3 space-y-2">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">Chưa có tin nhắn nào</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex flex-col ${m.user_id === user?.id ? "items-end" : "items-start"}`}>
                    <span className="text-xs text-muted-foreground">{m.display_name}</span>
                    <span className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${m.user_id === user?.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {m.content}
                    </span>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-border p-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                maxLength={500}
                className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-md bg-primary px-3 py-2 text-primary-foreground">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
