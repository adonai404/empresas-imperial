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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cnpj_regimes: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          regime: string
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          regime: string
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          regime?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          cnpj: string
          created_at: string | null
          id: string
          name: string
          regime: string
          segment_id: string | null
          sem_movimento: boolean | null
          updated_at: string | null
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          name: string
          regime: string
          segment_id?: string | null
          sem_movimento?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          name?: string
          regime?: string
          segment_id?: string | null
          sem_movimento?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      company_passwords: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_passwords_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_data: {
        Row: {
          aliquota: number | null
          base_calculo: number | null
          company_id: string
          created_at: string | null
          deducoes: number | null
          id: string
          period: string
          receita_bruta: number | null
          updated_at: string | null
          valor_devido: number | null
        }
        Insert: {
          aliquota?: number | null
          base_calculo?: number | null
          company_id: string
          created_at?: string | null
          deducoes?: number | null
          id?: string
          period: string
          receita_bruta?: number | null
          updated_at?: string | null
          valor_devido?: number | null
        }
        Update: {
          aliquota?: number | null
          base_calculo?: number | null
          company_id?: string
          created_at?: string | null
          deducoes?: number | null
          id?: string
          period?: string
          receita_bruta?: number | null
          updated_at?: string | null
          valor_devido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lucro_presumido_data: {
        Row: {
          base_calculo: number | null
          cofins: number | null
          company_id: string
          created_at: string | null
          csll: number | null
          id: string
          irpj: number | null
          period: string
          pis: number | null
          receita_bruta: number | null
          updated_at: string | null
        }
        Insert: {
          base_calculo?: number | null
          cofins?: number | null
          company_id: string
          created_at?: string | null
          csll?: number | null
          id?: string
          irpj?: number | null
          period: string
          pis?: number | null
          receita_bruta?: number | null
          updated_at?: string | null
        }
        Update: {
          base_calculo?: number | null
          cofins?: number | null
          company_id?: string
          created_at?: string | null
          csll?: number | null
          id?: string
          irpj?: number | null
          period?: string
          pis?: number | null
          receita_bruta?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lucro_presumido_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      lucro_real_data: {
        Row: {
          cofins: number | null
          company_id: string
          created_at: string | null
          csll: number | null
          custos: number | null
          despesas: number | null
          id: string
          irpj: number | null
          lucro_liquido: number | null
          period: string
          pis: number | null
          receita_bruta: number | null
          responsavel_id: string | null
          updated_at: string | null
        }
        Insert: {
          cofins?: number | null
          company_id: string
          created_at?: string | null
          csll?: number | null
          custos?: number | null
          despesas?: number | null
          id?: string
          irpj?: number | null
          lucro_liquido?: number | null
          period: string
          pis?: number | null
          receita_bruta?: number | null
          responsavel_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cofins?: number | null
          company_id?: string
          created_at?: string | null
          csll?: number | null
          custos?: number | null
          despesas?: number | null
          id?: string
          irpj?: number | null
          lucro_liquido?: number | null
          period?: string
          pis?: number | null
          receita_bruta?: number | null
          responsavel_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lucro_real_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lucro_real_data_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      produtor_rural_data: {
        Row: {
          company_id: string
          created_at: string | null
          despesas: number | null
          funrural: number | null
          id: string
          period: string
          receita_bruta: number | null
          resultado: number | null
          senar: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          despesas?: number | null
          funrural?: number | null
          id?: string
          period: string
          receita_bruta?: number | null
          resultado?: number | null
          senar?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          despesas?: number | null
          funrural?: number | null
          id?: string
          period?: string
          receita_bruta?: number | null
          resultado?: number | null
          senar?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtor_rural_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      responsaveis: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
