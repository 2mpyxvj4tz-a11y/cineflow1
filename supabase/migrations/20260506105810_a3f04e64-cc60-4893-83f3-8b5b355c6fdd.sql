
-- Watch rooms
CREATE TABLE public.watch_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  host_id UUID NOT NULL,
  movie_slug TEXT NOT NULL,
  movie_name TEXT,
  episode_slug TEXT,
  poster_url TEXT,
  max_users INTEGER NOT NULL DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.watch_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms" ON public.watch_rooms FOR SELECT USING (true);
CREATE POLICY "Authed can create rooms" ON public.watch_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Host can delete room" ON public.watch_rooms FOR DELETE USING (auth.uid() = host_id);
CREATE POLICY "Host can update room" ON public.watch_rooms FOR UPDATE USING (auth.uid() = host_id);

-- Participants
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  mic_enabled BOOLEAN NOT NULL DEFAULT false,
  mic_muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Self can join" ON public.room_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self can update" ON public.room_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Self can leave" ON public.room_participants FOR DELETE USING (auth.uid() = user_id);

-- Messages
CREATE TABLE public.room_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone in room can view messages" ON public.room_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.room_participants p WHERE p.room_id = room_messages.room_id AND p.user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.room_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.room_participants p WHERE p.room_id = room_messages.room_id AND p.user_id = auth.uid()
  )
);

-- Realtime
ALTER TABLE public.room_participants REPLICA IDENTITY FULL;
ALTER TABLE public.room_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

CREATE INDEX idx_room_messages_room ON public.room_messages(room_id, created_at DESC);
CREATE INDEX idx_room_participants_room ON public.room_participants(room_id);
