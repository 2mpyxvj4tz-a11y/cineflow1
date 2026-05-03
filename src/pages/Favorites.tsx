import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

export default function Favorites() {
  const { user, loading } = useAuth();
  useEffect(() => { document.title = "Phim yêu thích - CineFlow"; }, []);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("favorites").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading) return <div className="px-4 py-20 md:px-12">Đang tải...</div>;
  if (!user) return <Navigate to="/auth" replace />;

  const remove = async (slug: string) => {
    const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("movie_slug", slug);
    if (error) toast.error(error.message);
    else { toast.success("Đã xoá"); refetch(); }
  };

  return (
    <div className="px-4 py-6 md:px-12">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Phim yêu thích</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : !data?.length ? (
        <p className="text-muted-foreground">Bạn chưa có phim yêu thích nào. <Link to="/" className="text-primary hover:underline">Khám phá ngay</Link></p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.map((f) => (
            <div key={f.id} className="group relative overflow-hidden rounded-md bg-muted">
              <Link to={`/phim/${f.movie_slug}`} className="block">
                <div className="aspect-[2/3]">
                  <img src={f.poster_url || "/placeholder.svg"} alt={f.movie_name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 to-transparent p-2">
                  <p className="line-clamp-1 text-sm font-medium text-white">{f.movie_name}</p>
                </div>
              </Link>
              <button onClick={() => remove(f.movie_slug)} aria-label="Xoá" className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
