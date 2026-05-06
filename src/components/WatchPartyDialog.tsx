import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, LogIn } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  movieSlug: string;
  movieName: string;
  posterUrl: string;
  episodeSlug: string;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function WatchPartyDialog({ movieSlug, movieName, posterUrl, episodeSlug }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const requireAuth = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để dùng tính năng xem chung");
      navigate("/auth");
      return false;
    }
    return true;
  };

  const onCreate = async () => {
    if (!requireAuth()) return;
    if (!password || password.length < 3) return toast.error("Mật khẩu tối thiểu 3 ký tự");
    setBusy(true);
    const room_code = randomCode();
    const password_hash = await sha256(password);
    const { error } = await supabase.from("watch_rooms").insert({
      room_code,
      password_hash,
      host_id: user!.id,
      movie_slug: movieSlug,
      movie_name: movieName,
      episode_slug: episodeSlug,
      poster_url: posterUrl,
    });
    setBusy(false);
    if (error) return toast.error("Tạo phòng thất bại: " + error.message);
    sessionStorage.setItem(`room-pw-${room_code}`, password);
    setOpen(false);
    navigate(`/phong/${room_code}`);
  };

  const onJoin = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    const codeUp = code.trim().toUpperCase();
    const { data: room } = await supabase
      .from("watch_rooms")
      .select("*")
      .eq("room_code", codeUp)
      .maybeSingle();
    if (!room) {
      setBusy(false);
      return toast.error("Không tìm thấy phòng");
    }
    const hash = await sha256(password);
    if (hash !== room.password_hash) {
      setBusy(false);
      return toast.error("Sai mật khẩu");
    }
    sessionStorage.setItem(`room-pw-${codeUp}`, password);
    setBusy(false);
    setOpen(false);
    navigate(`/phong/${codeUp}`);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-secondary px-4 py-3 font-semibold text-secondary-foreground hover:bg-accent"
      >
        <Users className="h-5 w-5" /> Xem chung
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-xl font-bold">Phòng xem chung</h3>

            {mode === "choose" && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMode("create")}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-6 hover:border-primary"
                >
                  <Plus className="h-8 w-8 text-primary" />
                  <span className="font-semibold">Tạo phòng</span>
                </button>
                <button
                  onClick={() => setMode("join")}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-6 hover:border-primary"
                >
                  <LogIn className="h-8 w-8 text-primary" />
                  <span className="font-semibold">Vào phòng</span>
                </button>
              </div>
            )}

            {mode === "create" && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Mật khẩu phòng</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 3 ký tự"
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
                <p className="text-xs text-muted-foreground">Tối đa 40 người. Hệ thống sẽ tự sinh mã phòng.</p>
                <div className="flex gap-2">
                  <button onClick={() => setMode("choose")} className="flex-1 rounded-md border border-border px-3 py-2 text-sm">Quay lại</button>
                  <button onClick={onCreate} disabled={busy} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                    {busy ? "Đang tạo..." : "Tạo phòng"}
                  </button>
                </div>
              </div>
            )}

            {mode === "join" && (
              <div className="space-y-3">
                <label className="block text-sm font-medium">Mã phòng</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 uppercase tracking-widest"
                />
                <label className="block text-sm font-medium">Mật khẩu</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2"
                />
                <div className="flex gap-2">
                  <button onClick={() => setMode("choose")} className="flex-1 rounded-md border border-border px-3 py-2 text-sm">Quay lại</button>
                  <button onClick={onJoin} disabled={busy} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                    {busy ? "Đang vào..." : "Vào phòng"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
