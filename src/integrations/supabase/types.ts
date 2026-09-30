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
      citizen_requests: {
        Row: {
          affected_population_estimate: number | null
          category: string | null
          channel: string
          cluster_id: string | null
          confidence: number | null
          confirmed: boolean
          created_at: string
          district: string | null
          evidence: string[]
          id: string
          inferred: Json
          infrastructure_type: string | null
          language: string
          lat: number | null
          lng: number | null
          problem_type: string | null
          public_ref: string
          raw_text: string | null
          recurrence: string | null
          severity: number | null
          stated_summary: string | null
          status: string
          taluka: string | null
          village: string | null
        }
        Insert: {
          affected_population_estimate?: number | null
          category?: string | null
          channel?: string
          cluster_id?: string | null
          confidence?: number | null
          confirmed?: boolean
          created_at?: string
          district?: string | null
          evidence?: string[]
          id?: string
          inferred?: Json
          infrastructure_type?: string | null
          language?: string
          lat?: number | null
          lng?: number | null
          problem_type?: string | null
          public_ref?: string
          raw_text?: string | null
          recurrence?: string | null
          severity?: number | null
          stated_summary?: string | null
          status?: string
          taluka?: string | null
          village?: string | null
        }
        Update: {
          affected_population_estimate?: number | null
          category?: string | null
          channel?: string
          cluster_id?: string | null
          confidence?: number | null
          confirmed?: boolean
          created_at?: string
          district?: string | null
          evidence?: string[]
          id?: string
          inferred?: Json
          infrastructure_type?: string | null
          language?: string
          lat?: number | null
          lng?: number | null
          problem_type?: string | null
          public_ref?: string
          raw_text?: string | null
          recurrence?: string | null
          severity?: number | null
          stated_summary?: string | null
          status?: string
          taluka?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "citizen_requests_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "development_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      development_clusters: {
        Row: {
          affected_population: number
          category: string
          count_source: string
          created_at: string
          demand_score: number
          district: string
          first_seen: string
          gap_score: number
          id: string
          infrastructure_type: string
          languages: string[]
          last_seen: string
          lat: number
          lng: number
          priority_score: number
          problem_type: string
          radius_km: number
          recurrence: string
          request_count: number
          severity_avg: number
          taluka: string | null
          title: string
          village: string | null
        }
        Insert: {
          affected_population?: number
          category: string
          count_source?: string
          created_at?: string
          demand_score?: number
          district: string
          first_seen?: string
          gap_score?: number
          id: string
          infrastructure_type: string
          languages?: string[]
          last_seen?: string
          lat: number
          lng: number
          priority_score?: number
          problem_type: string
          radius_km?: number
          recurrence?: string
          request_count?: number
          severity_avg?: number
          taluka?: string | null
          title: string
          village?: string | null
        }
        Update: {
          affected_population?: number
          category?: string
          count_source?: string
          created_at?: string
          demand_score?: number
          district?: string
          first_seen?: string
          gap_score?: number
          id?: string
          infrastructure_type?: string
          languages?: string[]
          last_seen?: string
          lat?: number
          lng?: number
          priority_score?: number
          problem_type?: string
          radius_km?: number
          recurrence?: string
          request_count?: number
          severity_avg?: number
          taluka?: string | null
          title?: string
          village?: string | null
        }
        Relationships: []
      }
      impact_metrics: {
        Row: {
          baseline: number
          current: number
          id: string
          metric: string
          project_id: string | null
          recommendation_id: string | null
          target: number
          unit: string
        }
        Insert: {
          baseline: number
          current: number
          id?: string
          metric: string
          project_id?: string | null
          recommendation_id?: string | null
          target: number
          unit: string
        }
        Update: {
          baseline?: number
          current?: number
          id?: string
          metric?: string
          project_id?: string | null
          recommendation_id?: string | null
          target?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "impact_metrics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "impact_metrics_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      infrastructure_assets: {
        Row: {
          asset_type: string
          condition: string
          district: string
          id: string
          lat: number
          lng: number
          name: string
          notes: string | null
          serves_population: number
          village: string | null
        }
        Insert: {
          asset_type: string
          condition?: string
          district: string
          id: string
          lat: number
          lng: number
          name: string
          notes?: string | null
          serves_population?: number
          village?: string | null
        }
        Update: {
          asset_type?: string
          condition?: string
          district?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          notes?: string | null
          serves_population?: number
          village?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget_inr: number
          category: string
          coverage_note: string | null
          department: string | null
          district: string
          end_date: string | null
          id: string
          lat: number
          lng: number
          name: string
          scheme: string | null
          start_date: string | null
          status: string
          village: string | null
        }
        Insert: {
          budget_inr?: number
          category: string
          coverage_note?: string | null
          department?: string | null
          district: string
          end_date?: string | null
          id: string
          lat: number
          lng: number
          name: string
          scheme?: string | null
          start_date?: string | null
          status?: string
          village?: string | null
        }
        Update: {
          budget_inr?: number
          category?: string
          coverage_note?: string | null
          department?: string | null
          district?: string
          end_date?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
          scheme?: string | null
          start_date?: string | null
          status?: string
          village?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          affected_population: number
          category: string
          cluster_id: string | null
          confidence: number
          created_at: string
          decision_note: string | null
          district: string
          estimated_cost_inr: number
          evidence: Json
          expected_impact: Json
          id: string
          intervention: string
          lat: number
          lng: number
          overlap_flag: boolean
          priority_score: number
          status: string
          title: string
          village: string | null
          why_not: Json
          why_this: Json
        }
        Insert: {
          affected_population?: number
          category: string
          cluster_id?: string | null
          confidence?: number
          created_at?: string
          decision_note?: string | null
          district: string
          estimated_cost_inr?: number
          evidence?: Json
          expected_impact?: Json
          id: string
          intervention: string
          lat: number
          lng: number
          overlap_flag?: boolean
          priority_score?: number
          status?: string
          title: string
          village?: string | null
          why_not?: Json
          why_this?: Json
        }
        Update: {
          affected_population?: number
          category?: string
          cluster_id?: string | null
          confidence?: number
          created_at?: string
          decision_note?: string | null
          district?: string
          estimated_cost_inr?: number
          evidence?: Json
          expected_impact?: Json
          id?: string
          intervention?: string
          lat?: number
          lng?: number
          overlap_flag?: boolean
          priority_score?: number
          status?: string
          title?: string
          village?: string | null
          why_not?: Json
          why_this?: Json
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "development_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_citizen_request: {
        Args: { _confirmed: boolean; _correction: string; _id: string }
        Returns: boolean
      }
      submit_citizen_request: {
        Args: { payload: Json }
        Returns: {
          id: string
          public_ref: string
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
