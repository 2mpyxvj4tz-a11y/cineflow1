-- Bảng lưu phim hoạt hình 3D scrape từ hoathinh3d.co
CREATE TABLE public.donghua_movies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  origin_name text,
  poster_url text,
  thumb_url text,
  source_url text NOT NULL,
  year integer,
  quality text,
  lang text,
  episode_current text,
  total_episodes integer,
  description text,
  source text NOT NULL DEFAULT 'hoathinh3d',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.donghua_episodes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id uuid NOT NULL REFERENCES public.donghua_movies(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  episode_name text NOT NULL,
  episode_slug text NOT NULL,
  embed_url text,
  m3u8_url text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (movie_id, episode_number)
);

CREATE INDEX idx_donghua_movies_updated ON public.donghua_movies(updated_at DESC);
CREATE INDEX idx_donghua_episodes_movie ON public.donghua_episodes(movie_id, episode_number);

-- Bảng log mỗi lần sync
CREATE TABLE public.sync_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  status text NOT NULL,
  movies_added integer DEFAULT 0,
  episodes_added integer DEFAULT 0,
  error_message text,
  ran_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.donghua_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donghua_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Public read (catalog phim công khai)
CREATE POLICY "Anyone can view donghua movies" ON public.donghua_movies FOR SELECT USING (true);
CREATE POLICY "Anyone can view donghua episodes" ON public.donghua_episodes FOR SELECT USING (true);
CREATE POLICY "Anyone can view sync logs" ON public.sync_logs FOR SELECT USING (true);
-- Không có INSERT/UPDATE/DELETE policy → chỉ service_role (edge function) ghi được

CREATE TRIGGER set_donghua_movies_updated_at
BEFORE UPDATE ON public.donghua_movies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bật pg_cron + pg_net để chạy job 7h tối hằng ngày
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;