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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          analysis_status: string
          codec: string | null
          created_at: string
          download_status: string
          duration: number | null
          external_storage_reference: string | null
          file_size: number | null
          filename: string | null
          frame_rate: number | null
          height: number | null
          id: string
          media_type: string
          project_id: string | null
          telegram_file_id: string | null
          telegram_file_unique_id: string | null
          user_id: string
          width: number | null
        }
        Insert: {
          analysis_status?: string
          codec?: string | null
          created_at?: string
          download_status?: string
          duration?: number | null
          external_storage_reference?: string | null
          file_size?: number | null
          filename?: string | null
          frame_rate?: number | null
          height?: number | null
          id?: string
          media_type?: string
          project_id?: string | null
          telegram_file_id?: string | null
          telegram_file_unique_id?: string | null
          user_id: string
          width?: number | null
        }
        Update: {
          analysis_status?: string
          codec?: string | null
          created_at?: string
          download_status?: string
          duration?: number | null
          external_storage_reference?: string | null
          file_size?: number | null
          filename?: string | null
          frame_rate?: number | null
          height?: number | null
          id?: string
          media_type?: string
          project_id?: string | null
          telegram_file_id?: string | null
          telegram_file_unique_id?: string | null
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_plans: {
        Row: {
          created_at: string
          creative_explanation: string | null
          id: string
          project_id: string
          status: string
          timeline_json: Json
          version: number
        }
        Insert: {
          created_at?: string
          creative_explanation?: string | null
          id?: string
          project_id: string
          status?: string
          timeline_json?: Json
          version?: number
        }
        Update: {
          created_at?: string
          creative_explanation?: string | null
          id?: string
          project_id?: string
          status?: string
          timeline_json?: Json
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "edit_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      editing_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          settings_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          settings_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          settings_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          feedback_type: string
          id: string
          preference_tags: string[]
          project_id: string
          render_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          preference_tags?: string[]
          project_id: string
          render_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          feedback_type?: string
          id?: string
          preference_tags?: string[]
          project_id?: string
          render_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_render_id_fkey"
            columns: ["render_id"]
            isOneToOne: false
            referencedRelation: "renders"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          external_event_id: string | null
          id: string
          processing_status: string
          source: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          external_event_id?: string | null
          id?: string
          processing_status?: string
          source: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          external_event_id?: string | null
          id?: string
          processing_status?: string
          source?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          current_stage: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          payload: Json
          progress: number
          project_id: string | null
          started_at: string | null
          status: string
          user_id: string
          worker_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_stage?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          payload?: Json
          progress?: number
          project_id?: string | null
          started_at?: string | null
          status?: string
          user_id: string
          worker_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_stage?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          payload?: Json
          progress?: number
          project_id?: string | null
          started_at?: string | null
          status?: string
          user_id?: string
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      music_analysis: {
        Row: {
          beat_positions: Json | null
          bpm: number | null
          created_at: string
          downbeats: Json | null
          energy_curve: Json | null
          id: string
          music_track_id: string | null
          musical_bars: Json | null
          project_id: string
          status: string
          suggested_segments: Json | null
        }
        Insert: {
          beat_positions?: Json | null
          bpm?: number | null
          created_at?: string
          downbeats?: Json | null
          energy_curve?: Json | null
          id?: string
          music_track_id?: string | null
          musical_bars?: Json | null
          project_id: string
          status?: string
          suggested_segments?: Json | null
        }
        Update: {
          beat_positions?: Json | null
          bpm?: number | null
          created_at?: string
          downbeats?: Json | null
          energy_curve?: Json | null
          id?: string
          music_track_id?: string | null
          musical_bars?: Json | null
          project_id?: string
          status?: string
          suggested_segments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "music_analysis_music_track_id_fkey"
            columns: ["music_track_id"]
            isOneToOne: false
            referencedRelation: "music_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "music_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      music_tracks: {
        Row: {
          analysis_status: string
          beat_data: Json | null
          bpm: number | null
          created_at: string
          duration: number | null
          energy_data: Json | null
          filename: string | null
          id: string
          project_id: string | null
          selected_end: number | null
          selected_start: number | null
          telegram_file_id: string | null
          time_signature: string | null
          user_id: string
        }
        Insert: {
          analysis_status?: string
          beat_data?: Json | null
          bpm?: number | null
          created_at?: string
          duration?: number | null
          energy_data?: Json | null
          filename?: string | null
          id?: string
          project_id?: string | null
          selected_end?: number | null
          selected_start?: number | null
          telegram_file_id?: string | null
          time_signature?: string | null
          user_id: string
        }
        Update: {
          analysis_status?: string
          beat_data?: Json | null
          bpm?: number | null
          created_at?: string
          duration?: number | null
          energy_data?: Json | null
          filename?: string | null
          id?: string
          project_id?: string | null
          selected_end?: number | null
          selected_start?: number | null
          telegram_file_id?: string | null
          time_signature?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_tracks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived: boolean
          aspect_ratio: string
          beat_sync_mode: string | null
          color_profile: string | null
          created_at: string
          creative_brief: string | null
          description: string | null
          editing_pace: string | null
          editing_profile_id: string | null
          editing_style: string[]
          effects_settings: Json
          frame_rate: number
          hook_strategy: Json
          id: string
          name: string
          narrative_objective: string | null
          original_audio_mode: string | null
          resolution: string
          status: string
          subtitle_settings: Json
          target_duration: number
          transition_settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          aspect_ratio?: string
          beat_sync_mode?: string | null
          color_profile?: string | null
          created_at?: string
          creative_brief?: string | null
          description?: string | null
          editing_pace?: string | null
          editing_profile_id?: string | null
          editing_style?: string[]
          effects_settings?: Json
          frame_rate?: number
          hook_strategy?: Json
          id?: string
          name: string
          narrative_objective?: string | null
          original_audio_mode?: string | null
          resolution?: string
          status?: string
          subtitle_settings?: Json
          target_duration?: number
          transition_settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          aspect_ratio?: string
          beat_sync_mode?: string | null
          color_profile?: string | null
          created_at?: string
          creative_brief?: string | null
          description?: string | null
          editing_pace?: string | null
          editing_profile_id?: string | null
          editing_style?: string[]
          effects_settings?: Json
          frame_rate?: number
          hook_strategy?: Json
          id?: string
          name?: string
          narrative_objective?: string | null
          original_audio_mode?: string | null
          resolution?: string
          status?: string
          subtitle_settings?: Json
          target_duration?: number
          transition_settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_editing_profile_id_fkey"
            columns: ["editing_profile_id"]
            isOneToOne: false
            referencedRelation: "editing_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      renders: {
        Row: {
          created_at: string
          download_url: string | null
          duration: number | null
          edit_plan_id: string | null
          file_size: number | null
          id: string
          output_reference: string | null
          preview_url: string | null
          project_id: string
          quality_report: Json | null
          resolution: string | null
          status: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          download_url?: string | null
          duration?: number | null
          edit_plan_id?: string | null
          file_size?: number | null
          id?: string
          output_reference?: string | null
          preview_url?: string | null
          project_id: string
          quality_report?: Json | null
          resolution?: string | null
          status?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          download_url?: string | null
          duration?: number | null
          edit_plan_id?: string | null
          file_size?: number | null
          id?: string
          output_reference?: string | null
          preview_url?: string | null
          project_id?: string
          quality_report?: Json | null
          resolution?: string | null
          status?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "renders_edit_plan_id_fkey"
            columns: ["edit_plan_id"]
            isOneToOne: false
            referencedRelation: "edit_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_analysis: {
        Row: {
          analysis_data: Json
          asset_id: string | null
          created_at: string
          id: string
          project_id: string
          status: string
          updated_at: string
        }
        Insert: {
          analysis_data?: Json
          asset_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          analysis_data?: Json
          asset_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_analysis_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_analysis_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_project: { Args: { _pid: string }; Returns: boolean }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
