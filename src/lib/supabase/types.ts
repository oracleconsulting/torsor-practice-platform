export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accountancy_users: {
        Row: {
          id: string;
          user_id: string;
          practice_id: string | null;
          full_name: string;
          practice_name: string;
          email: string;
          phone: string | null;
          team_size: string | null;
          address: string | null;
          website: string | null;
          subscription_tier: string;
          is_active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          practice_id?: string | null;
          full_name: string;
          practice_name: string;
          email: string;
          phone?: string | null;
          team_size?: string | null;
          address?: string | null;
          website?: string | null;
          subscription_tier?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          practice_id?: string | null;
          full_name?: string;
          practice_name?: string;
          email?: string;
          phone?: string | null;
          team_size?: string | null;
          address?: string | null;
          website?: string | null;
          subscription_tier?: string;
          is_active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      client_intake: {
        Row: {
          created_at: string | null
          email: string
          fit_message: string | null
          group_id: string
          id: string
          responses: Json | null
        }
        Insert: {
          created_at?: string | null
          email: string
          fit_message?: string | null
          group_id: string
          id?: string
          responses?: Json | null
        }
        Update: {
          created_at?: string | null
          email?: string
          fit_message?: string | null
          group_id?: string
          id?: string
          responses?: Json | null
        }
      }
      client_intake_part2: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          responses: Json | null
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          responses?: Json | null
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          responses?: Json | null
        }
      }
      client_config: {
        Row: {
          board: string[]
          board_composition: string
          group_id: string
          id: string
          rationale: Record<string, string>
          roadmap: Json | null
          scores: Record<string, number>
        }
        Insert: {
          board?: string[]
          board_composition?: string
          group_id: string
          id?: string
          rationale?: Record<string, string>
          roadmap?: Json | null
          scores?: Record<string, number>
        }
        Update: {
          board?: string[]
          board_composition?: string
          group_id?: string
          id?: string
          rationale?: Record<string, string>
          roadmap?: Json | null
          scores?: Record<string, number>
        }
      }
      practice_health_progress: {
        Row: {
          id: string;
          user_id: string;
          practice_id?: string | null;
          answers: Json;
          current_section: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          practice_id?: string | null;
          answers: Json;
          current_section: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          practice_id?: string | null;
          answers?: Json;
          current_section?: number;
          updated_at?: string;
        };
      };
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
  }
} 