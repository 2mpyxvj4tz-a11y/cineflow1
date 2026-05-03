import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { z } from "zod";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  rating: number | null;
  created_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
}

const schema = z.object({
  content: z.string().trim().min(1, "Nội dung không được trống").max(1000, "Tối đa 1000 ký tự"),
  rating: z.number().min(1).max(5).nullable(),
});

export function Comments({ movieSlug }: { movieSlug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});
  const [content, setContent] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("movie_slug", movieSlug)
      .order("created_at", { ascending: false });
    if (error) return;
    setComments(data || []);
    const ids = Array.from(new Set((data || []).map((c) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", ids);
      const map: Record<string, any> = {};
      (profs || []).forEach((p) => (map[p.id] = p));
      setProfilesMap(map);
    }
  };

  useEffect(() => {
    load();
  }, [movieSlug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.info("Đăng nhập để bình luận"); return; }
    const parsed = schema.safeParse({ content, rating: rating || null });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      user_id: user.id, movie_slug: movieSlug, content: parsed.data.content, rating: parsed.data.rating,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else { setContent(""); setRating(0); toast.success("Đã đăng bình luận"); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Đã xoá"); load(); }
  };

  const avg = comments.filter((c) => c.rating).reduce((s, c) => s + (c.rating || 0), 0) / Math.max(1, comments.filter((c) => c.rating).length);

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">Bình luận & Đánh giá</h2>
        {comments.some((c) => c.rating) && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            <span className="font-semibold">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">({comments.filter((c) => c.rating).length} đánh giá)</span>
          </div>
        )}
      </div>

      {user ? (
        <form onSubmit={submit} className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-1">
            <span className="mr-2 text-sm text-muted-foreground">Đánh giá:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)}>
                <Star className={`h-6 w-6 ${n <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nhận về phim..."
            rows={3}
            maxLength={1000}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <div className="mt-3 flex justify-end">
            <button type="submit" disabled={loading} className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {loading ? "Đang gửi..." : "Đăng bình luận"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-border bg-card p-4 text-center text-sm">
          <Link to="/auth" className="text-primary hover:underline">Đăng nhập</Link> để bình luận và đánh giá phim.
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">Chưa có bình luận. Hãy là người đầu tiên!</p>}
        {comments.map((c) => {
          const prof = profilesMap[c.user_id];
          const name = prof?.display_name || "Người dùng";
          return (
            <div key={c.id} className="flex gap-3 rounded-lg border border-border bg-card p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {prof?.avatar_url ? <img src={prof.avatar_url} alt={name} className="h-full w-full rounded-full object-cover" /> : name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{name}</span>
                    {c.rating && (
                      <span className="flex items-center gap-0.5 text-xs">
                        {Array.from({ length: c.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        ))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("vi-VN")}</span>
                    {user?.id === c.user_id && (
                      <button onClick={() => remove(c.id)} aria-label="Xoá" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{c.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
