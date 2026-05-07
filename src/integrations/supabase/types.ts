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
      gift_history: {
        Row: {
          action: Database["public"]["Enums"]["gift_history_action"]
          changes: Json | null
          created_at: string
          entity_type: string
          gift_id: string
          id: string
          snapshot: Json | null
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["gift_history_action"]
          changes?: Json | null
          created_at?: string
          entity_type?: string
          gift_id: string
          id?: string
          snapshot?: Json | null
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["gift_history_action"]
          changes?: Json | null
          created_at?: string
          entity_type?: string
          gift_id?: string
          id?: string
          snapshot?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      gift_sources: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      given_event_types: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      given_gifts: {
        Row: {
          created_at: string
          deleted_at: string | null
          details: string | null
          event_date: string | null
          event_type: string | null
          father_name: string | null
          first_name: string
          gift_amount: number | null
          id: string
          nickname: string | null
          number: number | null
          relationship: string | null
          surname: string
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          details?: string | null
          event_date?: string | null
          event_type?: string | null
          father_name?: string | null
          first_name: string
          gift_amount?: number | null
          id?: string
          nickname?: string | null
          number?: number | null
          relationship?: string | null
          surname: string
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          details?: string | null
          event_date?: string | null
          event_type?: string | null
          father_name?: string | null
          first_name?: string
          gift_amount?: number | null
          id?: string
          nickname?: string | null
          number?: number | null
          relationship?: string | null
          surname?: string
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      personal_events: {
        Row: {
          created_at: string
          event_date: string | null
          event_type: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wedding_gifts: {
        Row: {
          created_at: string
          deleted_at: string | null
          details: string | null
          event_id: string | null
          father_name: string | null
          first_name: string
          gift_amount: number | null
          guest_type: string | null
          id: string
          nickname: string | null
          number: number | null
          responsible: string | null
          source: string | null
          surname: string
          updated_at: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          details?: string | null
          event_id?: string | null
          father_name?: string | null
          first_name: string
          gift_amount?: number | null
          guest_type?: string | null
          id?: string
          nickname?: string | null
          number?: number | null
          responsible?: string | null
          source?: string | null
          surname: string
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          details?: string | null
          event_id?: string | null
          father_name?: string | null
          first_name?: string
          gift_amount?: number | null
          guest_type?: string | null
          id?: string
          nickname?: string | null
          number?: number | null
          responsible?: string | null
          source?: string | null
          surname?: string
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wedding_gifts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "personal_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gift_history_action:
        | "create"
        | "update"
        | "delete"
        | "restore"
        | "permanent_delete"
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
    Enums: {
      gift_history_action: [
        "create",
        "update",
        "delete",
        "restore",
        "permanent_delete",
      ],
    },
  },
} as const
