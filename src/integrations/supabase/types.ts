export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accountancy_admins: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_super_admin: boolean | null
          permissions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_super_admin?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_super_admin?: boolean | null
          permissions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      advanced_surveys: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          responses: Json
          survey_type: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          responses: Json
          survey_type: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          responses?: Json
          survey_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_surveys_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "client_intake"
            referencedColumns: ["group_id"]
          },
        ]
      }
      agent_settings: {
        Row: {
          client_email: string
          config: Json
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          client_email: string
          config?: Json
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          client_email?: string
          config?: Json
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_location: string
          backup_size_bytes: number | null
          backup_type: string
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          notes: string | null
          restore_tested: boolean | null
        }
        Insert: {
          backup_location: string
          backup_size_bytes?: number | null
          backup_type: string
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          restore_tested?: boolean | null
        }
        Update: {
          backup_location?: string
          backup_size_bytes?: number | null
          backup_type?: string
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          notes?: string | null
          restore_tested?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "backup_history_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "client_intake"
            referencedColumns: ["group_id"]
          },
        ]
      }
      board_conversations: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          question: string
          responses: Json
          session_id: string
          synthesis: string
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          question: string
          responses: Json
          session_id: string
          synthesis: string
          timestamp: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          question?: string
          responses?: Json
          session_id?: string
          synthesis?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_conversations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "client_intake"
            referencedColumns: ["group_id"]
          },
        ]
      }
      client_config: {
        Row: {
          annual_value_potential: number | null
          board: Json | null
          board_accepted: boolean | null
          board_accepted_at: string | null
          board_composition: Json | null
          board_rejected_at: string | null
          client_config: Json | null
          client_id: string | null
          config: Json
          created_at: string
          custom_needs: string | null
          email: string | null
          founder_state: Json | null
          generated_at: string | null
          group_id: string | null
          id: string
          industry: string | null
          iteration: number | null
          last_backup_at: string | null
          metadata: Json | null
          narrative_generated_at: string | null
          pinecone_created_at: string | null
          pinecone_index_name: string | null
          pinecone_status: string | null
          rationale: Json | null
          recommended_board: Json | null
          rejection_reason: string | null
          roadmap: Json | null
          roadmap_narrative: Json | null
          scores: Json | null
          session_type: string | null
          tier: number | null
        }
        Insert: {
          annual_value_potential?: number | null
          board?: Json | null
          board_accepted?: boolean | null
          board_accepted_at?: string | null
          board_composition?: Json | null
          board_rejected_at?: string | null
          client_config?: Json | null
          client_id?: string | null
          config?: Json
          created_at?: string
          custom_needs?: string | null
          email?: string | null
          founder_state?: Json | null
          generated_at?: string | null
          group_id?: string | null
          id?: string
          industry?: string | null
          iteration?: number | null
          last_backup_at?: string | null
          metadata?: Json | null
          narrative_generated_at?: string | null
          pinecone_created_at?: string | null
          pinecone_index_name?: string | null
          pinecone_status?: string | null
          rationale?: Json | null
          recommended_board?: Json | null
          rejection_reason?: string | null
          roadmap?: Json | null
          roadmap_narrative?: Json | null
          scores?: Json | null
          session_type?: string | null
          tier?: number | null
        }
        Update: {
          annual_value_potential?: number | null
          board?: Json | null
          board_accepted?: boolean | null
          board_accepted_at?: string | null
          board_composition?: Json | null
          board_rejected_at?: string | null
          client_config?: Json | null
          client_id?: string | null
          config?: Json
          created_at?: string
          custom_needs?: string | null
          email?: string | null
          founder_state?: Json | null
          generated_at?: string | null
          group_id?: string | null
          id?: string
          industry?: string | null
          iteration?: number | null
          last_backup_at?: string | null
          metadata?: Json | null
          narrative_generated_at?: string | null
          pinecone_created_at?: string | null
          pinecone_index_name?: string | null
          pinecone_status?: string | null
          rationale?: Json | null
          recommended_board?: Json | null
          rejection_reason?: string | null
          roadmap?: Json | null
          roadmap_narrative?: Json | null
          scores?: Json | null
          session_type?: string | null
          tier?: number | null
        }
        Relationships: []
      }
      client_intake: {
        Row: {
          created_at: string | null
          email: string | null
          fit_message: string | null
          group_id: string | null
          id: string
          invited_email_sent_at: string | null
          is_primary: boolean | null
          is_virtual_board_candidate: boolean | null
          last_tagged_at: string | null
          not_a_fit_email_sent_at: string | null
          notes: string | null
          referrer_id: string | null
          responses: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          fit_message?: string | null
          group_id?: string | null
          id?: string
          invited_email_sent_at?: string | null
          is_primary?: boolean | null
          is_virtual_board_candidate?: boolean | null
          last_tagged_at?: string | null
          not_a_fit_email_sent_at?: string | null
          notes?: string | null
          referrer_id?: string | null
          responses?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          fit_message?: string | null
          group_id?: string | null
          id?: string
          invited_email_sent_at?: string | null
          is_primary?: boolean | null
          is_virtual_board_candidate?: boolean | null
          last_tagged_at?: string | null
          not_a_fit_email_sent_at?: string | null
          notes?: string | null
          referrer_id?: string | null
          responses?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      client_intake_part2: {
        Row: {
          client_id: string | null
          extracted_insights: Json | null
          group_id: string | null
          id: string
          responses: Json
          roadmap_generated: boolean | null
          submitted_at: string | null
        }
        Insert: {
          client_id?: string | null
          extracted_insights?: Json | null
          group_id?: string | null
          id?: string
          responses: Json
          roadmap_generated?: boolean | null
          submitted_at?: string | null
        }
        Update: {
          client_id?: string | null
          extracted_insights?: Json | null
          group_id?: string | null
          id?: string
          responses?: Json
          roadmap_generated?: boolean | null
          submitted_at?: string | null
        }
        Relationships: []
      }
      client_roadmap: {
        Row: {
          client_id: string
          created_at: string | null
          roadmap: Json
        }
        Insert: {
          client_id: string
          created_at?: string | null
          roadmap: Json
        }
        Update: {
          client_id?: string
          created_at?: string | null
          roadmap?: Json
        }
        Relationships: []
      }
      community_activity: {
        Row: {
          author_name: string | null
          created_at: string | null
          featured: boolean | null
          id: string
          preview: string | null
          title: string
          type: string | null
          url: string | null
        }
        Insert: {
          author_name?: string | null
          created_at?: string | null
          featured?: boolean | null
          id?: string
          preview?: string | null
          title: string
          type?: string | null
          url?: string | null
        }
        Update: {
          author_name?: string | null
          created_at?: string | null
          featured?: boolean | null
          id?: string
          preview?: string | null
          title?: string
          type?: string | null
          url?: string | null
        }
        Relationships: []
      }
      community_leads: {
        Row: {
          consented: boolean | null
          created_at: string | null
          email: string
          id: string
          resource_type: string | null
          source_page: string | null
          utm_campaign: string | null
        }
        Insert: {
          consented?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          resource_type?: string | null
          source_page?: string | null
          utm_campaign?: string | null
        }
        Update: {
          consented?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          resource_type?: string | null
          source_page?: string | null
          utm_campaign?: string | null
        }
        Relationships: []
      }
      data_backups: {
        Row: {
          backup_type: string | null
          created_at: string | null
          data: Json | null
          environment: string | null
          group_id: string | null
          id: string
        }
        Insert: {
          backup_type?: string | null
          created_at?: string | null
          data?: Json | null
          environment?: string | null
          group_id?: string | null
          id?: string
        }
        Update: {
          backup_type?: string | null
          created_at?: string | null
          data?: Json | null
          environment?: string | null
          group_id?: string | null
          id?: string
        }
        Relationships: []
      }
      document_recommendations: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          document_id: string | null
          feedback: string | null
          group_id: string | null
          id: string
          opened_at: string | null
          reason: string | null
          relevance_score: number | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          document_id?: string | null
          feedback?: string | null
          group_id?: string | null
          id?: string
          opened_at?: string | null
          reason?: string | null
          relevance_score?: number | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          document_id?: string | null
          feedback?: string | null
          group_id?: string | null
          id?: string
          opened_at?: string | null
          reason?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_recommendations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_snapshots: {
        Row: {
          accounts_payable: number | null
          accounts_receivable: number | null
          cash_position: number | null
          created_at: string | null
          currency: string | null
          group_id: string
          id: string
          monthly_expenses: number | null
          monthly_revenue: number | null
          period_end: string | null
          period_start: string | null
          raw_data: Json | null
          source: string
        }
        Insert: {
          accounts_payable?: number | null
          accounts_receivable?: number | null
          cash_position?: number | null
          created_at?: string | null
          currency?: string | null
          group_id: string
          id?: string
          monthly_expenses?: number | null
          monthly_revenue?: number | null
          period_end?: string | null
          period_start?: string | null
          raw_data?: Json | null
          source: string
        }
        Update: {
          accounts_payable?: number | null
          accounts_receivable?: number | null
          cash_position?: number | null
          created_at?: string | null
          currency?: string | null
          group_id?: string
          id?: string
          monthly_expenses?: number | null
          monthly_revenue?: number | null
          period_end?: string | null
          period_start?: string | null
          raw_data?: Json | null
          source?: string
        }
        Relationships: []
      }
      integration_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          integration_id: string | null
          metadata: Json | null
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          integration_id?: string | null
          metadata?: Json | null
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_logs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          connected_at: string | null
          expires_at: string | null
          group_id: string
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync_at: string | null
          refresh_token: string | null
          scopes: string | null
          sync_error: string | null
          sync_status: string | null
          tenant_id: string | null
          tenant_name: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          expires_at?: string | null
          group_id: string
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          expires_at?: string | null
          group_id?: string
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          refresh_token?: string | null
          scopes?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tenant_id?: string | null
          tenant_name?: string | null
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          published: boolean | null
          related_assessments: Json | null
          summary: string | null
          tags: string[] | null
          target_audience: Json | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          related_assessments?: Json | null
          summary?: string | null
          tags?: string[] | null
          target_audience?: Json | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          published?: boolean | null
          related_assessments?: Json | null
          summary?: string | null
          tags?: string[] | null
          target_audience?: Json | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      model_feedback: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          feedback_type: string
          group_id: string | null
          id: string
          improvements: Json | null
          original_output: Json
          user_feedback: string | null
          user_rating: number | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          feedback_type: string
          group_id?: string | null
          id?: string
          improvements?: Json | null
          original_output: Json
          user_feedback?: string | null
          user_rating?: number | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          feedback_type?: string
          group_id?: string | null
          id?: string
          improvements?: Json | null
          original_output?: Json
          user_feedback?: string | null
          user_rating?: number | null
        }
        Relationships: []
      }
      onboarding_responses: {
        Row: {
          goal_summary: string | null
          id: string
          inserted_at: string | null
          pain_point: string
          priority_focus: string
          user_id: string | null
        }
        Insert: {
          goal_summary?: string | null
          id?: string
          inserted_at?: string | null
          pain_point: string
          priority_focus: string
          user_id?: string | null
        }
        Update: {
          goal_summary?: string | null
          id?: string
          inserted_at?: string | null
          pain_point?: string
          priority_focus?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_cohorts: {
        Row: {
          created_at: string | null
          current_participants: number | null
          end_date: string
          features: Json | null
          id: string
          max_participants: number | null
          name: string
          pricing: Json | null
          start_date: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          current_participants?: number | null
          end_date: string
          features?: Json | null
          id?: string
          max_participants?: number | null
          name: string
          pricing?: Json | null
          start_date: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          current_participants?: number | null
          end_date?: string
          features?: Json | null
          id?: string
          max_participants?: number | null
          name?: string
          pricing?: Json | null
          start_date?: string
          status?: string | null
        }
        Relationships: []
      }
      pilot_participants: {
        Row: {
          cohort_id: string | null
          feedback_provided: boolean | null
          graduation_date: string | null
          group_id: string | null
          id: string
          joined_at: string | null
          status: string | null
        }
        Insert: {
          cohort_id?: string | null
          feedback_provided?: boolean | null
          graduation_date?: string | null
          group_id?: string | null
          id?: string
          joined_at?: string | null
          status?: string | null
        }
        Update: {
          cohort_id?: string | null
          feedback_provided?: boolean | null
          graduation_date?: string | null
          group_id?: string | null
          id?: string
          joined_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pilot_participants_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "pilot_cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          referral_code: string
          referred_email: string | null
          referred_group_id: string | null
          referrer_group_id: string | null
          reward_status: string | null
          reward_type: string | null
          status: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referral_code: string
          referred_email?: string | null
          referred_group_id?: string | null
          referrer_group_id?: string | null
          reward_status?: string | null
          reward_type?: string | null
          status?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_group_id?: string | null
          referrer_group_id?: string | null
          reward_status?: string | null
          reward_type?: string | null
          status?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      slack_connections: {
        Row: {
          channels: Json | null
          connected_at: string | null
          slack_email: string | null
          slack_user_id: string | null
          tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channels?: Json | null
          connected_at?: string | null
          slack_email?: string | null
          slack_user_id?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channels?: Json | null
          connected_at?: string | null
          slack_email?: string | null
          slack_user_id?: string | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sprint_feedback: {
        Row: {
          created_at: string | null
          description: string | null
          feedback_type: string | null
          group_id: string
          id: string
          impact_score: number | null
          sprint_number: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          feedback_type?: string | null
          group_id: string
          id?: string
          impact_score?: number | null
          sprint_number?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          feedback_type?: string | null
          group_id?: string
          id?: string
          impact_score?: number | null
          sprint_number?: number | null
          title?: string
        }
        Relationships: []
      }
      sprint_history: {
        Row: {
          completion_rate: number | null
          created_at: string | null
          end_date: string | null
          group_id: string
          id: string
          key_metrics: Json | null
          regeneration_data: Json | null
          sprint_number: number | null
          start_date: string | null
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string | null
          end_date?: string | null
          group_id: string
          id?: string
          key_metrics?: Json | null
          regeneration_data?: Json | null
          sprint_number?: number | null
          start_date?: string | null
        }
        Update: {
          completion_rate?: number | null
          created_at?: string | null
          end_date?: string | null
          group_id?: string
          id?: string
          key_metrics?: Json | null
          regeneration_data?: Json | null
          sprint_number?: number | null
          start_date?: string | null
        }
        Relationships: []
      }
      sprint_progress: {
        Row: {
          completed: boolean | null
          completed_date: string | null
          created_at: string | null
          group_id: string
          id: string
          notes: string | null
          sprint_number: number | null
          task_description: string | null
          task_id: string | null
          task_title: string
        }
        Insert: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          notes?: string | null
          sprint_number?: number | null
          task_description?: string | null
          task_id?: string | null
          task_title: string
        }
        Update: {
          completed?: boolean | null
          completed_date?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          notes?: string | null
          sprint_number?: number | null
          task_description?: string | null
          task_id?: string | null
          task_title?: string
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          group_id: string
          id: string
          invite_token: string | null
          invitee_email: string
          inviter_email: string
          role: string | null
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          invite_token?: string | null
          invitee_email: string
          inviter_email: string
          role?: string | null
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          invite_token?: string | null
          invitee_email?: string
          inviter_email?: string
          role?: string | null
          status?: string | null
        }
        Relationships: []
      }
      team_roadmaps: {
        Row: {
          generated_at: string | null
          goal_alignment: Json | null
          group_id: string
          id: string
          milestones: Json | null
          updated_at: string | null
          vision_statement: string | null
        }
        Insert: {
          generated_at?: string | null
          goal_alignment?: Json | null
          group_id: string
          id?: string
          milestones?: Json | null
          updated_at?: string | null
          vision_statement?: string | null
        }
        Update: {
          generated_at?: string | null
          goal_alignment?: Json | null
          group_id?: string
          id?: string
          milestones?: Json | null
          updated_at?: string | null
          vision_statement?: string | null
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          tokens: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          tokens?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_leads: {
        Row: {
          email: string
          id: string
          joined_date: string | null
          onboarding_status: string | null
          plan: string | null
          queries_limit: number | null
          queries_used: number | null
          seats: number | null
          tier: string | null
        }
        Insert: {
          email: string
          id?: string
          joined_date?: string | null
          onboarding_status?: string | null
          plan?: string | null
          queries_limit?: number | null
          queries_used?: number | null
          seats?: number | null
          tier?: string | null
        }
        Update: {
          email?: string
          id?: string
          joined_date?: string | null
          onboarding_status?: string | null
          plan?: string | null
          queries_limit?: number | null
          queries_used?: number | null
          seats?: number | null
          tier?: string | null
        }
        Relationships: []
      }
      webhook_subscriptions: {
        Row: {
          created_at: string | null
          endpoint_url: string
          event_types: string[] | null
          id: string
          integration_id: string | null
          is_active: boolean | null
          secret: string | null
          webhook_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint_url: string
          event_types?: string[] | null
          id?: string
          integration_id?: string | null
          is_active?: boolean | null
          secret?: string | null
          webhook_id: string
        }
        Update: {
          created_at?: string | null
          endpoint_url?: string
          event_types?: string[] | null
          id?: string
          integration_id?: string | null
          is_active?: boolean | null
          secret?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_subscriptions_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integrations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_admin_by_email: {
        Args: { user_email: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
