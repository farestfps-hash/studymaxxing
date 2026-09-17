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
      ai_evaluations: {
        Row: {
          benchmark: Json
          countries: Json
          created_at: string
          gaps: Json
          holistic_score: number | null
          id: string
          missing_items: Json
          strengths: Json
          summary: string | null
          user_id: string
        }
        Insert: {
          benchmark?: Json
          countries?: Json
          created_at?: string
          gaps?: Json
          holistic_score?: number | null
          id?: string
          missing_items?: Json
          strengths?: Json
          summary?: string | null
          user_id: string
        }
        Update: {
          benchmark?: Json
          countries?: Json
          created_at?: string
          gaps?: Json
          holistic_score?: number | null
          id?: string
          missing_items?: Json
          strengths?: Json
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ap_exams: {
        Row: {
          created_at: string
          id: string
          score: number | null
          status: string
          subject: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          score?: number | null
          status?: string
          subject: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          score?: number | null
          status?: string
          subject?: string
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          color: string
          completed: boolean
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          color?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          color?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      extracurriculars: {
        Row: {
          created_at: string
          description: string | null
          hours_per_week: number | null
          id: string
          key_impact: string | null
          organization: string | null
          role: string | null
          title: string
          user_id: string
          years_active: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours_per_week?: number | null
          id?: string
          key_impact?: string | null
          organization?: string | null
          role?: string | null
          title: string
          user_id: string
          years_active?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hours_per_week?: number | null
          id?: string
          key_impact?: string | null
          organization?: string | null
          role?: string | null
          title?: string
          user_id?: string
          years_active?: string | null
        }
        Relationships: []
      }
      olympiads_honors: {
        Row: {
          created_at: string
          id: string
          level: string | null
          name: string
          placement: string | null
          subject: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string | null
          name: string
          placement?: string | null
          subject?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          level?: string | null
          name?: string
          placement?: string | null
          subject?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          act_score: number | null
          annual_budget: number | null
          bio: string | null
          budget_currency: string | null
          created_at: string
          english_score: string | null
          english_test: string | null
          full_name: string | null
          gpa_scale: string | null
          gpa_unweighted: number | null
          gpa_weighted: number | null
          grade_level: string | null
          high_school: string | null
          id: string
          is_profile_public: boolean
          needs_full_aid: boolean
          nuet_score: number | null
          portfolio_public: boolean
          sat_score: number | null
          school_name: string | null
          target_countries: string[]
          target_major: string | null
          unt_score: number | null
          updated_at: string
        }
        Insert: {
          act_score?: number | null
          annual_budget?: number | null
          bio?: string | null
          budget_currency?: string | null
          created_at?: string
          english_score?: string | null
          english_test?: string | null
          full_name?: string | null
          gpa_scale?: string | null
          gpa_unweighted?: number | null
          gpa_weighted?: number | null
          grade_level?: string | null
          high_school?: string | null
          id: string
          is_profile_public?: boolean
          needs_full_aid?: boolean
          nuet_score?: number | null
          portfolio_public?: boolean
          sat_score?: number | null
          school_name?: string | null
          target_countries?: string[]
          target_major?: string | null
          unt_score?: number | null
          updated_at?: string
        }
        Update: {
          act_score?: number | null
          annual_budget?: number | null
          bio?: string | null
          budget_currency?: string | null
          created_at?: string
          english_score?: string | null
          english_test?: string | null
          full_name?: string | null
          gpa_scale?: string | null
          gpa_unweighted?: number | null
          gpa_weighted?: number | null
          grade_level?: string | null
          high_school?: string | null
          id?: string
          is_profile_public?: boolean
          needs_full_aid?: boolean
          nuet_score?: number | null
          portfolio_public?: boolean
          sat_score?: number | null
          school_name?: string | null
          target_countries?: string[]
          target_major?: string | null
          unt_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          created_at: string
          id: string
          steps: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          steps?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          steps?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { _country?: string }
        Returns: {
          full_name: string
          grade_level: string
          holistic_score: number
          is_public: boolean
          rank: number
          school_name: string
          user_id: string
        }[]
      }
      get_leaderboard_stats: {
        Args: { _country?: string }
        Returns: {
          avg_score: number
          my_rank: number
          my_score: number
          total_count: number
        }[]
      }
      get_public_portfolio: {
        Args: { _user_id: string }
        Returns: {
          act_score: number
          ap_exams: Json
          bio: string
          extracurriculars: Json
          full_name: string
          gpa_unweighted: number
          grade_level: string
          holistic_score: number
          honors: Json
          nuet_score: number
          sat_score: number
          school_name: string
          strengths: Json
          summary: string
          target_countries: string[]
          target_major: string
          unt_score: number
          user_id: string
        }[]
      }
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
