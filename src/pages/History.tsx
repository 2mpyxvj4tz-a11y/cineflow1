import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { useEffect } from "react";

export default function History() {
  const { user, loading } = useAuth();
  useEffect(() => { document.title = "Lịch sử xem - CineFlow"; }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("watch_history").select("*").eq("user_id", user.id).order("watched_at", { ascending: false }).limit(60);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading) return <div className="px-4 py-20 md:px-12">Đang tải...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="px-4 py-6 md:px-12">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Lịch sử xem</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : !data?.length ? (
        <p className="text-muted-foreground">Chưa có lịch sử xem.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.map((h) => (
            <Link
              key={h.id}
              to={h.episode_slug ? `/xem/${h.movie_slug}/${h.episode_slug}` : `/phim/${h.movie_slug}`}
              className="group block overflow-hidden rounded-md bg-muted"
            >
              <div className="aspect-[2/3]">
                <img src={h.poster_url || "/placeholder.svg"} alt={h.movie_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
              </div>
              <div className="p-2">
                <p className="line-clamp-1 text-sm font-medium">{h.movie_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(h.watched_at).toLocaleString("vi-VN")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
