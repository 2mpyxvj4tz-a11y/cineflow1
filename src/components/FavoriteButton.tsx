import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Props {
  movieSlug: string;
  movieName: string;
  posterUrl?: string;
}

export function FavoriteButton({ movieSlug, movieName, posterUrl }: Props) {
  const { user } = useAuth();
  const [fav, setFav] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setFav(false); return; }
    supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("movie_slug", movieSlug)
      .maybeSingle()
      .then(({ data }) => setFav(!!data));
  }, [user, movieSlug]);

  const toggle = async () => {
    if (!user) {
      toast.info("Đăng nhập để lưu phim yêu thích");
      navigate("/auth");
      return;
    }
    setLoading(true);
    if (fav) {
      const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("movie_slug", movieSlug);
      if (error) toast.error(error.message);
      else { setFav(false); toast.success("Đã xoá khỏi yêu thích"); }
    } else {
      const { error } = await supabase.from("favorites").insert({
        user_id: user.id, movie_slug: movieSlug, movie_name: movieName, poster_url: posterUrl ?? null,
      });
      if (error) toast.error(error.message);
      else { setFav(true); toast.success("Đã thêm vào yêu thích"); }
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-md px-6 py-3 font-semibold backdrop-blur transition-colors disabled:opacity-50 ${
        fav ? "bg-primary text-primary-foreground" : "bg-foreground/10 hover:bg-foreground/20"
      }`}
    >
      <Heart className={`h-5 w-5 ${fav ? "fill-current" : ""}`} />
      {fav ? "Đã yêu thích" : "Yêu thích"}
    </button>
  );
}
