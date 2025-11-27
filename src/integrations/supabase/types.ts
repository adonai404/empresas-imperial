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
          regime_tributario: string
        }
        Insert: {
          cnpj: string
          created_at?: string | null
          id?: string
          regime_tributario: string
        }
        Update: {
          cnpj?: string
          created_at?: string | null
          id?: string
          regime_tributario?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string | null
          id: string
          name: string
          regime_tributario: string | null
          responsavel_id: string | null
          segmento: string | null
          sem_movimento: boolean | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name: string
          regime_tributario?: string | null
          responsavel_id?: string | null
          segmento?: string | null
          sem_movimento?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          id?: string
          name?: string
          regime_tributario?: string | null
          responsavel_id?: string | null
          segmento?: string | null
          sem_movimento?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
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
      competencias: {
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
      declaracao_options: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      fiscal_data: {
        Row: {
          company_id: string
          created_at: string | null
          difal: number | null
          entrada: number
          id: string
          imposto: number
          period: string
          rbt12: number
          responsavel_id: string | null
          saida: number
          servicos: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          difal?: number | null
          entrada?: number
          id?: string
          imposto?: number
          period: string
          rbt12?: number
          responsavel_id?: string | null
          saida?: number
          servicos?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          difal?: number | null
          entrada?: number
          id?: string
          imposto?: number
          period?: string
          rbt12?: number
          responsavel_id?: string | null
          saida?: number
          servicos?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_data_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
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
          updated_at: string | null
        }
        Insert: {
          cofins?: number | null
          company_id: string
          created_at?: string | null
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
          updated_at?: string | null
        }
        Update: {
          cofins?: number | null
          company_id?: string
          created_at?: string | null
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
      obligation_tasks: {
        Row: {
          competencia_id: string | null
          completed: boolean | null
          created_at: string
          id: string
          order_index: number | null
          periodo: string
          responsaveis: string
          se_aplica: string
          tarefa: string
          updated_at: string
        }
        Insert: {
          competencia_id?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          order_index?: number | null
          periodo: string
          responsaveis: string
          se_aplica: string
          tarefa: string
          updated_at?: string
        }
        Update: {
          competencia_id?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          order_index?: number | null
          periodo?: string
          responsaveis?: string
          se_aplica?: string
          tarefa?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "obligation_tasks_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_tasks: {
        Row: {
          competencia_id: string | null
          completed: boolean | null
          created_at: string
          id: string
          order_index: number | null
          periodo: string
          responsaveis: string
          se_aplica: string
          tarefa: string
          updated_at: string
        }
        Insert: {
          competencia_id?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          order_index?: number | null
          periodo: string
          responsaveis: string
          se_aplica: string
          tarefa: string
          updated_at?: string
        }
        Update: {
          competencia_id?: string | null
          completed?: boolean | null
          created_at?: string
          id?: string
          order_index?: number | null
          periodo?: string
          responsaveis?: string
          se_aplica?: string
          tarefa?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_tasks_competencia_id_fkey"
            columns: ["competencia_id"]
            isOneToOne: false
            referencedRelation: "competencias"
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
      projects: {
        Row: {
          created_at: string
          data_conclusao: string | null
          declaracoes: string[] | null
          id: string
          nome_projeto: string
          prazo_final: string | null
          prioridade: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_conclusao?: string | null
          declaracoes?: string[] | null
          id?: string
          nome_projeto: string
          prazo_final?: string | null
          prioridade?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_conclusao?: string | null
          declaracoes?: string[] | null
          id?: string
          nome_projeto?: string
          prazo_final?: string | null
          prioridade?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          created_at: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      se_aplica_options: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
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
      system_links: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          order_index: number | null
          password: string | null
          system_id: string
          title: string
          url: string
          username: string | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          order_index?: number | null
          password?: string | null
          system_id: string
          title: string
          url: string
          username?: string | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          order_index?: number | null
          password?: string | null
          system_id?: string
          title?: string
          url?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_links_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      systems: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
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
