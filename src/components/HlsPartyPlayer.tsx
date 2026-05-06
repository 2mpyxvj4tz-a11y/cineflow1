import { useEffect, useRef } from "react";
import Hls from "hls.js";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { RotateCcw, RotateCw } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  isHost: boolean;
  channel: RealtimeChannel | null;
  onBroadcast: (s: { type: "play" | "pause" | "seek"; time: number }) => void;
}

export function HlsPartyPlayer({ src, poster, isHost, channel, onBroadcast }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const ignoreNext = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    let hls: Hls | null = null;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(v);
    } else if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = src;
    }
    return () => { hls?.destroy(); };
  }, [src]);

  // Host emits, guests receive
  useEffect(() => {
    const v = ref.current;
    if (!v) return;

    if (isHost) {
      const onPlay = () => onBroadcast({ type: "play", time: v.currentTime });
      const onPause = () => onBroadcast({ type: "pause", time: v.currentTime });
      const onSeek = () => onBroadcast({ type: "seek", time: v.currentTime });
      v.addEventListener("play", onPlay);
      v.addEventListener("pause", onPause);
      v.addEventListener("seeked", onSeek);
      return () => {
        v.removeEventListener("play", onPlay);
        v.removeEventListener("pause", onPause);
        v.removeEventListener("seeked", onSeek);
      };
    }
  }, [isHost, onBroadcast]);

  useEffect(() => {
    if (!channel || isHost) return;
    const handler = ({ payload }: any) => {
      const v = ref.current;
      if (!v) return;
      ignoreNext.current = true;
      if (Math.abs(v.currentTime - payload.time) > 1) v.currentTime = payload.time;
      if (payload.type === "play") v.play().catch(() => {});
      else if (payload.type === "pause") v.pause();
    };
    channel.on("broadcast", { event: "video-sync" }, handler);
  }, [channel, isHost]);

  const seekBy = (sec: number) => {
    const v = ref.current;
    if (!v) return;
    if (!isHost) return;
    v.currentTime = Math.max(0, v.currentTime + sec);
  };

  return (
    <div className="relative h-full w-full bg-black group">
      <video ref={ref} controls={isHost} autoPlay poster={poster} className="h-full w-full bg-black" playsInline />
      {isHost && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => seekBy(-5)} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80" aria-label="Lùi 5s">
            <RotateCcw className="h-5 w-5" />
          </button>
          <button onClick={() => seekBy(5)} className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80" aria-label="Tới 5s">
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
      )}
      {!isHost && (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          Đồng bộ với chủ phòng
        </div>
      )}
    </div>
  );
}
