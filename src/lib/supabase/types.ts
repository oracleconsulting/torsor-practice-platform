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
      workflows: {
        Row: {
          id: string;
          practice_id: string;
          service_id: string;
          name: string;
          description: string | null;
          version: number;
          is_active: boolean;
          is_template: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          practice_id: string;
          service_id: string;
          name: string;
          description?: string | null;
          version?: number;
          is_active?: boolean;
          is_template?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          practice_id?: string;
          service_id?: string;
          name?: string;
          description?: string | null;
          version?: number;
          is_active?: boolean;
          is_template?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: Json;
        };
      };
      workflow_steps: {
        Row: {
          id: string;
          workflow_id: string;
          step_order: number;
          step_type: 'llm' | 'conditional' | 'transform' | 'user_input' | 'api_call';
          name: string;
          description: string | null;
          config: Json;
          input_mapping: Json;
          output_schema: Json;
          parent_step_id: string | null;
          branch_condition: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          step_order: number;
          step_type: 'llm' | 'conditional' | 'transform' | 'user_input' | 'api_call';
          name: string;
          description?: string | null;
          config?: Json;
          input_mapping?: Json;
          output_schema?: Json;
          parent_step_id?: string | null;
          branch_condition?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          step_order?: number;
          step_type?: 'llm' | 'conditional' | 'transform' | 'user_input' | 'api_call';
          name?: string;
          description?: string | null;
          config?: Json;
          input_mapping?: Json;
          output_schema?: Json;
          parent_step_id?: string | null;
          branch_condition?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workflow_executions: {
        Row: {
          id: string;
          workflow_id: string;
          practice_id: string;
          client_id: string | null;
          client_name: string | null;
          status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
          current_step_id: string | null;
          progress_percentage: number;
          input_data: Json;
          output_data: Json;
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          execution_time_ms: number | null;
          executed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workflow_id: string;
          practice_id: string;
          client_id?: string | null;
          client_name?: string | null;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
          current_step_id?: string | null;
          progress_percentage?: number;
          input_data?: Json;
          output_data?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          executed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workflow_id?: string;
          practice_id?: string;
          client_id?: string | null;
          client_name?: string | null;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
          current_step_id?: string | null;
          progress_percentage?: number;
          input_data?: Json;
          output_data?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          execution_time_ms?: number | null;
          executed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      step_executions: {
        Row: {
          id: string;
          workflow_execution_id: string;
          step_id: string;
          status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
          input_data: Json;
          output_data: Json;
          error_message: string | null;
          llm_provider: string | null;
          llm_model: string | null;
          prompt_used: string | null;
          tokens_used: number | null;
          cost_usd: number | null;
          started_at: string | null;
          completed_at: string | null;
          execution_time_ms: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workflow_execution_id: string;
          step_id: string;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
          input_data?: Json;
          output_data?: Json;
          error_message?: string | null;
          llm_provider?: string | null;
          llm_model?: string | null;
          prompt_used?: string | null;
          tokens_used?: number | null;
          cost_usd?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          execution_time_ms?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workflow_execution_id?: string;
          step_id?: string;
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
          input_data?: Json;
          output_data?: Json;
          error_message?: string | null;
          llm_provider?: string | null;
          llm_model?: string | null;
          prompt_used?: string | null;
          tokens_used?: number | null;
          cost_usd?: number | null;
          started_at?: string | null;
          completed_at?: string | null;
          execution_time_ms?: number | null;
          created_at?: string;
        };
      };
      workflow_templates: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          service_type: string;
          category: string | null;
          template_data: Json;
          is_public: boolean;
          usage_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          service_type: string;
          category?: string | null;
          template_data: Json;
          is_public?: boolean;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          service_type?: string;
          category?: string | null;
          template_data?: Json;
          is_public?: boolean;
          usage_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_workflow_progress: {
        Args: { execution_id: string };
        Returns: number;
      };
    }
    Enums: {
      [_ in never]: never
    }
  }
} 