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
      ai_generations: {
        Row: {
          application_id: string | null
          created_at: string | null
          cv_id: string | null
          id: string
          input: Json | null
          output: string | null
          type: string
          user_id: string
          version: number | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          cv_id?: string | null
          id?: string
          input?: Json | null
          output?: string | null
          type: string
          user_id: string
          version?: number | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          cv_id?: string | null
          id?: string
          input?: Json | null
          output?: string | null
          type?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generations_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          ai_score: Json | null
          applied_at: string | null
          archive_reason: string | null
          archived_at: string | null
          benefits: Json | null
          company: string
          company_logo: string | null
          company_size: string | null
          company_website: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contacts: Json | null
          contract_type: string | null
          cover_letter: string | null
          created_at: string | null
          cv_used: string | null
          description: string | null
          follow_ups: Json | null
          id: string
          interview_questions: Json
          interviews: Json | null
          location: string | null
          nice_to_have_skills: Json | null
          notes: string | null
          personal_note: string | null
          personal_rating: number | null
          priority: string | null
          remote: string | null
          required_skills: Json | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          sector: string | null
          source: string | null
          source_url: string | null
          status: string | null
          tags: Json | null
          timeline: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_score?: Json | null
          applied_at?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          benefits?: Json | null
          company: string
          company_logo?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contacts?: Json | null
          contract_type?: string | null
          cover_letter?: string | null
          created_at?: string | null
          cv_used?: string | null
          description?: string | null
          follow_ups?: Json | null
          id?: string
          interview_questions?: Json
          interviews?: Json | null
          location?: string | null
          nice_to_have_skills?: Json | null
          notes?: string | null
          personal_note?: string | null
          personal_rating?: number | null
          priority?: string | null
          remote?: string | null
          required_skills?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          sector?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          tags?: Json | null
          timeline?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_score?: Json | null
          applied_at?: string | null
          archive_reason?: string | null
          archived_at?: string | null
          benefits?: Json | null
          company?: string
          company_logo?: string | null
          company_size?: string | null
          company_website?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contacts?: Json | null
          contract_type?: string | null
          cover_letter?: string | null
          created_at?: string | null
          cv_used?: string | null
          description?: string | null
          follow_ups?: Json | null
          id?: string
          interview_questions?: Json
          interviews?: Json | null
          location?: string | null
          nice_to_have_skills?: Json | null
          notes?: string | null
          personal_note?: string | null
          personal_rating?: number | null
          priority?: string | null
          remote?: string | null
          required_skills?: Json | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          sector?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
          tags?: Json | null
          timeline?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cvs: {
        Row: {
          analysis: Json | null
          average_ats_score: number | null
          created_at: string | null
          id: string
          is_archived: boolean | null
          is_default: boolean | null
          name: string
          pdf_base64: string | null
          pdf_url: string | null
          tags: Json | null
          target_title: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string
          version: string | null
        }
        Insert: {
          analysis?: Json | null
          average_ats_score?: number | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          name: string
          pdf_base64?: string | null
          pdf_url?: string | null
          tags?: Json | null
          target_title?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
          version?: string | null
        }
        Update: {
          analysis?: Json | null
          average_ats_score?: number | null
          created_at?: string | null
          id?: string
          is_archived?: boolean | null
          is_default?: boolean | null
          name?: string
          pdf_base64?: string | null
          pdf_url?: string | null
          tags?: Json | null
          target_title?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          available_from: string | null
          bio: string | null
          created_at: string | null
          currency: string | null
          current_title: string | null
          email: string | null
          first_name: string | null
          github: string | null
          hard_skills: Json | null
          id: string
          languages: Json | null
          last_name: string | null
          linkedin: string | null
          location: string | null
          phone: string | null
          pitch_2min: string | null
          pitch_30s: string | null
          portfolio: string | null
          profile_completion: number | null
          remote_preference: string | null
          search_status: string | null
          soft_skills: Json | null
          target_contracts: Json | null
          target_salary_max: number | null
          target_salary_min: number | null
          target_sectors: Json | null
          updated_at: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          available_from?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          current_title?: string | null
          email?: string | null
          first_name?: string | null
          github?: string | null
          hard_skills?: Json | null
          id?: string
          languages?: Json | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          pitch_2min?: string | null
          pitch_30s?: string | null
          portfolio?: string | null
          profile_completion?: number | null
          remote_preference?: string | null
          search_status?: string | null
          soft_skills?: Json | null
          target_contracts?: Json | null
          target_salary_max?: number | null
          target_salary_min?: number | null
          target_sectors?: Json | null
          updated_at?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          available_from?: string | null
          bio?: string | null
          created_at?: string | null
          currency?: string | null
          current_title?: string | null
          email?: string | null
          first_name?: string | null
          github?: string | null
          hard_skills?: Json | null
          id?: string
          languages?: Json | null
          last_name?: string | null
          linkedin?: string | null
          location?: string | null
          phone?: string | null
          pitch_2min?: string | null
          pitch_30s?: string | null
          portfolio?: string | null
          profile_completion?: number | null
          remote_preference?: string | null
          search_status?: string | null
          soft_skills?: Json | null
          target_contracts?: Json | null
          target_salary_max?: number | null
          target_salary_min?: number | null
          target_sectors?: Json | null
          updated_at?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          color_theme: string | null
          density: string | null
          id: string
          mammouth_api_key: string | null
          notifications_enabled: boolean | null
          sla_applied: number | null
          sla_interview: number | null
          sla_watchlist: number | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color_theme?: string | null
          density?: string | null
          id?: string
          mammouth_api_key?: string | null
          notifications_enabled?: boolean | null
          sla_applied?: number | null
          sla_interview?: number | null
          sla_watchlist?: number | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color_theme?: string | null
          density?: string | null
          id?: string
          mammouth_api_key?: string | null
          notifications_enabled?: boolean | null
          sla_applied?: number | null
          sla_interview?: number | null
          sla_watchlist?: number | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
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
