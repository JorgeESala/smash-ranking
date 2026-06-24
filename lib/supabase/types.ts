// ============================================================================
// Supabase database types — manually authored from supabase/migrations/
// Run `npm run db:types` after linking the Supabase CLI to regenerate from
// the live schema.
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MatchFormat = "bo3" | "bo5" | "first_to_5";
export type MatchStatus = "pending" | "approved" | "disputed" | "cancelled";
export type MatchAction = "approve" | "dispute" | "cancel";

export interface Database {
  public: {
    Tables: {
      seasons: {
        Row: {
          id: string;
          name: string;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          is_demo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          is_demo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["seasons"]["Insert"]>;
        Relationships: [];
      };
      players: {
        Row: {
          id: string;
          auth_user_id: string;
          nickname: string;
          avatar_url: string | null;
          current_elo: number;
          peak_elo: number;
          games_played: number;
          wins: number;
          losses: number;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          nickname: string;
          avatar_url?: string | null;
          current_elo?: number;
          peak_elo?: number;
          games_played?: number;
          wins?: number;
          losses?: number;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["players"]["Insert"]>;
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          season_id: string;
          reporter_id: string;
          opponent_id: string;
          winner_id: string;
          winner_score: number;
          loser_score: number;
          format: MatchFormat;
          status: MatchStatus;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          season_id: string;
          reporter_id: string;
          opponent_id: string;
          winner_id: string;
          winner_score: number;
          loser_score: number;
          format?: MatchFormat;
          status?: MatchStatus;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "matches_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_opponent_id_fkey";
            columns: ["opponent_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      match_actions: {
        Row: {
          id: string;
          match_id: string;
          actor_id: string;
          action: MatchAction;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          actor_id: string;
          action: MatchAction;
          reason?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["match_actions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "match_actions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_actions_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subs: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
          last_used_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
          last_used_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_subs"]["Insert"]>;
        Relationships: [];
      };
      player_season_summaries: {
        Row: {
          player_id: string;
          season_id: string;
          final_elo: number;
          games: number;
          wins: number;
          losses: number;
          rank: number | null;
        };
        Insert: {
          player_id: string;
          season_id: string;
          final_elo: number;
          games: number;
          wins: number;
          losses: number;
          rank?: number | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["player_season_summaries"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Functions: {
      current_player_id: { Args: Record<string, never>; Returns: string };
      validate_match_scores: {
        Args: { p_format: MatchFormat; p_winner: number; p_loser: number };
        Returns: string | null;
      };
      expected_score: {
        Args: { elo_a: number; elo_b: number };
        Returns: number;
      };
      k_factor: { Args: { games_played: number }; Returns: number };
      approve_match: { Args: { p_match_id: string }; Returns: string };
      record_dispute: {
        Args: { p_match_id: string; p_reason: string };
        Returns: string;
      };
      cancel_match: { Args: { p_match_id: string }; Returns: string };
      end_current_season: { Args: Record<string, never>; Returns: string };
      start_new_season: { Args: { p_name: string }; Returns: string };
    };
    Enums: {
      match_format: MatchFormat;
      match_status: MatchStatus;
    };
    Views: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row types
export type Season = Database["public"]["Tables"]["seasons"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type MatchActionRow = Database["public"]["Tables"]["match_actions"]["Row"];
export type PushSub = Database["public"]["Tables"]["push_subs"]["Row"];
export type PlayerSeasonSummary =
  Database["public"]["Tables"]["player_season_summaries"]["Row"];

// Joined view types
export type MatchWithPlayers = Match & {
  reporter: Pick<Player, "id" | "nickname" | "avatar_url">;
  opponent: Pick<Player, "id" | "nickname" | "avatar_url">;
  winner: Pick<Player, "id" | "nickname">;
  season: Pick<Season, "id" | "name" | "is_demo">;
};
