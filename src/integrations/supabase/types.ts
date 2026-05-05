export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          movie_slug: string
          rating: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          movie_slug: string
          rating?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          movie_slug?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: []
      }
      donghua_episodes: {
        Row: {
          created_at: string
          embed_url: string | null
          episode_name: string
          episode_number: number
          episode_slug: string
          id: string
          m3u8_url: string | null
          movie_id: string
          source_url: string | null
        }
        Insert: {
          created_at?: string
          embed_url?: string | null
          episode_name: string
          episode_number: number
          episode_slug: string
          id?: string
          m3u8_url?: string | null
          movie_id: string
          source_url?: string | null
        }
        Update: {
          created_at?: string
          embed_url?: string | null
          episode_name?: string
          episode_number?: number
          episode_slug?: string
          id?: string
          m3u8_url?: string | null
          movie_id?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donghua_episodes_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "donghua_movies"
            referencedColumns: ["id"]
          },
        ]
      }
      donghua_movies: {
        Row: {
          created_at: string
          description: string | null
          episode_current: string | null
          id: string
          lang: string | null
          last_synced_at: string
          name: string
          origin_name: string | null
          poster_url: string | null
          quality: string | null
          slug: string
          source: string
          source_url: string
          thumb_url: string | null
          total_episodes: number | null
          updated_at: string
          year: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          episode_current?: string | null
          id?: string
          lang?: string | null
          last_synced_at?: string
          name: string
          origin_name?: string | null
          poster_url?: string | null
          quality?: string | null
          slug: string
          source?: string
          source_url: string
          thumb_url?: string | null
          total_episodes?: number | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          episode_current?: string | null
          id?: string
          lang?: string | null
          last_synced_at?: string
          name?: string
          origin_name?: string | null
          poster_url?: string | null
          quality?: string | null
          slug?: string
          source?: string
          source_url?: string
          thumb_url?: string | null
          total_episodes?: number | null
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          movie_name: string
          movie_slug: string
          poster_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movie_name: string
          movie_slug: string
          poster_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movie_name?: string
          movie_slug?: string
          poster_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          episodes_added: number | null
          error_message: string | null
          id: string
          movies_added: number | null
          ran_at: string
          source: string
          status: string
        }
        Insert: {
          episodes_added?: number | null
          error_message?: string | null
          id?: string
          movies_added?: number | null
          ran_at?: string
          source: string
          status: string
        }
        Update: {
          episodes_added?: number | null
          error_message?: string | null
          id?: string
          movies_added?: number | null
          ran_at?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      watch_history: {
        Row: {
          episode_slug: string | null
          id: string
          movie_name: string
          movie_slug: string
          poster_url: string | null
          user_id: string
          watched_at: string
        }
        Insert: {
          episode_slug?: string | null
          id?: string
          movie_name: string
          movie_slug: string
          poster_url?: string | null
          user_id: string
          watched_at?: string
        }
        Update: {
          episode_slug?: string | null
          id?: string
          movie_name?: string
          movie_slug?: string
          poster_url?: string | null
          user_id?: string
          watched_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
