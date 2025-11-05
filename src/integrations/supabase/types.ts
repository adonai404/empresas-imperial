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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      cnpj_regimes: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          regime_tributario: Database["public"]["Enums"]["regime_tributario"]
          updated_at: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          regime_tributario: Database["public"]["Enums"]["regime_tributario"]
          updated_at?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          regime_tributario?: Database["public"]["Enums"]["regime_tributario"]
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          name: string
          regime_tributario:
            | Database["public"]["Enums"]["regime_tributario"]
            | null
          segmento: string | null
          sem_movimento: boolean | null
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name: string
          regime_tributario?:
            | Database["public"]["Enums"]["regime_tributario"]
            | null
          segmento?: string | null
          sem_movimento?: boolean | null
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          name?: string
          regime_tributario?:
            | Database["public"]["Enums"]["regime_tributario"]
            | null
          segmento?: string | null
          sem_movimento?: boolean | null
          updated_at?: string
        }
        Relationships: []
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
          company_id: string
          created_at: string
          entrada: number | null
          id: string
          imposto: number | null
          period: string
          rbt12: number | null
          saida: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          entrada?: number | null
          id?: string
          imposto?: number | null
          period: string
          rbt12?: number | null
          saida?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          entrada?: number | null
          id?: string
          imposto?: number | null
          period?: string
          rbt12?: number | null
          saida?: number | null
          updated_at?: string
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
          cofins: number | null
          company_id: string
          created_at: string
          csll_primeiro_trimestre: number | null
          csll_segundo_trimestre: number | null
          entradas: number | null
          icms: number | null
          id: string
          irpj_primeiro_trimestre: number | null
          irpj_segundo_trimestre: number | null
          period: string
          pis: number | null
          saidas: number | null
          servicos: number | null
          tvi: number | null
          updated_at: string
        }
        Insert: {
          cofins?: number | null
          company_id: string
          created_at?: string
          csll_primeiro_trimestre?: number | null
          csll_segundo_trimestre?: number | null
          entradas?: number | null
          icms?: number | null
          id?: string
          irpj_primeiro_trimestre?: number | null
          irpj_segundo_trimestre?: number | null
          period: string
          pis?: number | null
          saidas?: number | null
          servicos?: number | null
          tvi?: number | null
          updated_at?: string
        }
        Update: {
          cofins?: number | null
          company_id?: string
          created_at?: string
          csll_primeiro_trimestre?: number | null
          csll_segundo_trimestre?: number | null
          entradas?: number | null
          icms?: number | null
          id?: string
          irpj_primeiro_trimestre?: number | null
          irpj_segundo_trimestre?: number | null
          period?: string
          pis?: number | null
          saidas?: number | null
          servicos?: number | null
          tvi?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      lucro_real_data: {
        Row: {
          cofins: number | null
          company_id: string
          created_at: string
          csll_primeiro_trimestre: number | null
          csll_segundo_trimestre: number | null
          entradas: number | null
          icms: number | null
          id: string
          irpj_primeiro_trimestre: number | null
          irpj_segundo_trimestre: number | null
          period: string
          pis: number | null
          responsavel_id: string | null
          saidas: number | null
          servicos: number | null
          tvi: number | null
          updated_at: string
        }
        Insert: {
          cofins?: number | null
          company_id: string
          created_at?: string
          csll_primeiro_trimestre?: number | null
          csll_segundo_trimestre?: number | null
          entradas?: number | null
          icms?: number | null
          id?: string
          irpj_primeiro_trimestre?: number | null
          irpj_segundo_trimestre?: number | null
          period: string
          pis?: number | null
          responsavel_id?: string | null
          saidas?: number | null
          servicos?: number | null
          tvi?: number | null
          updated_at?: string
        }
        Update: {
          cofins?: number | null
          company_id?: string
          created_at?: string
          csll_primeiro_trimestre?: number | null
          csll_segundo_trimestre?: number | null
          entradas?: number | null
          icms?: number | null
          id?: string
          irpj_primeiro_trimestre?: number | null
          irpj_segundo_trimestre?: number | null
          period?: string
          pis?: number | null
          responsavel_id?: string | null
          saidas?: number | null
          servicos?: number | null
          tvi?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lucro_real_data_company_id"
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
          cofins: number | null
          company_id: string
          created_at: string
          csll_primeiro_trimestre: number | null
          csll_segundo_trimestre: number | null
          entradas: number | null
          icms: number | null
          id: string
          irpj_primeiro_trimestre: number | null
          irpj_segundo_trimestre: number | null
          period: string
          pis: number | null
          saidas: number | null
          servicos: number | null
          tvi: number | null
          updated_at: string
        }
        Insert: {
          cofins?: number | null
          company_id: string
          created_at?: string
          csll_primeiro_trimestre?: number | null
          csll_segundo_trimestre?: number | null
          entradas?: number | null
          icms?: number | null
          id?: string
          irpj_primeiro_trimestre?: number | null
          irpj_segundo_trimestre?: number | null
          period: string
          pis?: number | null
          saidas?: number | null
          servicos?: number | null
          tvi?: number | null
          updated_at?: string
        }
        Update: {
          cofins?: number | null
          company_id?: string
          created_at?: string
          csll_primeiro_trimestre?: number | null
          csll_segundo_trimestre?: number | null
          entradas?: number | null
          icms?: number | null
          id?: string
          irpj_primeiro_trimestre?: number | null
          irpj_segundo_trimestre?: number | null
          period?: string
          pis?: number | null
          saidas?: number | null
          servicos?: number | null
          tvi?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      segments: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
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
      regime_tributario:
        | "lucro_real"
        | "lucro_presumido"
        | "simples_nacional"
        | "produtor_rural"
      regime_tributario_type:
        | "lucro_real"
        | "lucro_presumido"
        | "simples_nacional"
        | "mei"
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
      regime_tributario: [
        "lucro_real",
        "lucro_presumido",
        "simples_nacional",
        "produtor_rural",
      ],
      regime_tributario_type: [
        "lucro_real",
        "lucro_presumido",
        "simples_nacional",
        "mei",
      ],
    },
  },
} as const
