/**
 * Type definitions mirroring the SQL schema so the codebase typechecks
 * before `supabase gen types` is ever run. When you wire a real project,
 * regenerate with:
 *   npx supabase gen types typescript --project-id <ref> --schema public > supabase/database.gen.types.ts
 * and it will be structurally compatible with these shapes.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
        };
        Update: Partial<{
          username: string;
          avatar_url: string | null;
          bio: string | null;
        }>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          slug: string;
          title: string;
          subtitle: string | null;
          excerpt: string;
          content_md: string;
          cover_image_url: string | null;
          category: "Design" | "Engineering" | "Culture" | "Notes";
          tags: string[];
          status: "draft" | "published";
          reading_time: number;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          slug: string;
          title: string;
          subtitle?: string | null;
          excerpt?: string;
          content_md: string;
          cover_image_url?: string | null;
          category?: "Design" | "Engineering" | "Culture" | "Notes";
          tags?: string[];
          status?: "draft" | "published";
          reading_time?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          subtitle?: string | null;
          excerpt?: string;
          content_md?: string;
          cover_image_url?: string | null;
          category?: "Design" | "Engineering" | "Culture" | "Notes";
          tags?: string[];
          status?: "draft" | "published";
          reading_time?: number;
          published_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          body: string;
          created_at?: string;
        };
        Update: { body?: string; parent_id?: string | null };
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          post_id: string;
          user_id: string;
          kind: "like" | "insight" | "bookmark";
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          kind: "like" | "insight" | "bookmark";
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      subscribers: {
        Row: { id: string; email: string; created_at: string };
        Insert: { id?: string; email: string; created_at?: string };
        Update: Record<string, never>;
        Relationships: [];
      };
      notices: {
        Row: {
          id: string;
          slug: string;
          title: string;
          department: string;
          kind: "recruitment" | "result" | "admit-card" | "answer-key" | "admission";
          apply_mode: "online" | "offline";
          summary: string;
          facts: Array<{ label: string; value: string }>;
          official_url: string;
          apply_last_date: string | null;
          vacancy_count: number | null;
          series_slug: string;
          source: string;
          status: "live" | "closed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          department: string;
          kind?: "recruitment" | "result" | "admit-card" | "answer-key" | "admission";
          apply_mode: "online" | "offline";
          summary: string;
          facts?: Array<{ label: string; value: string }>;
          official_url: string;
          apply_last_date?: string | null;
          vacancy_count?: number | null;
          series_slug: string;
          source: string;
          status?: "live" | "closed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          slug: string;
          title: string;
          department: string;
          kind: "recruitment" | "result" | "admit-card" | "answer-key" | "admission";
          apply_mode: "online" | "offline";
          summary: string;
          facts: Array<{ label: string; value: string }>;
          official_url: string;
          apply_last_date: string | null;
          vacancy_count: number | null;
          series_slug: string;
          source: string;
          status: "live" | "closed" | "archived";
        }>;
        Relationships: [];
      };
      realtime_events: {
        Row: {
          id: string;
          type: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      post_status: "draft" | "published";
      reaction_kind: "like" | "insight" | "bookmark";
      notice_status: "live" | "closed" | "archived";
      notice_kind:
        | "recruitment"
        | "result"
        | "admit-card"
        | "answer-key"
        | "admission";
    };
    CompositeTypes: Record<string, never>;
  };
};
