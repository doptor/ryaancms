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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      build_analytics: {
        Row: {
          collection_count: number | null
          component_count: number | null
          components_used: Json | null
          created_at: string
          duration_ms: number | null
          id: string
          page_count: number | null
          project_title: string | null
          prompt: string
          security_score: number | null
          status: string
          user_id: string
        }
        Insert: {
          collection_count?: number | null
          component_count?: number | null
          components_used?: Json | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          page_count?: number | null
          project_title?: string | null
          prompt: string
          security_score?: number | null
          status?: string
          user_id: string
        }
        Update: {
          collection_count?: number | null
          component_count?: number | null
          components_used?: Json | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          page_count?: number | null
          project_title?: string | null
          prompt?: string
          security_score?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      deploy_approvals: {
        Row: {
          config: Json
          id: string
          project_title: string
          reviewed_at: string | null
          reviewer_notes: string | null
          schema_sql: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          id?: string
          project_title: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          schema_sql?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          id?: string
          project_title?: string
          reviewed_at?: string | null
          reviewer_notes?: string | null
          schema_sql?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_groups: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: string
          slug: string
          sort_order: number
          target: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: string
          slug: string
          sort_order?: number
          target?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: string
          slug?: string
          sort_order?: number
          target?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          created_at: string
          group_id: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          link_type: string
          open_in_new_tab: boolean
          parent_id: string | null
          plugin_slug: string | null
          position: string
          sort_order: number
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label: string
          link_type?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          plugin_slug?: string | null
          position?: string
          sort_order?: number
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          link_type?: string
          open_in_new_tab?: boolean
          parent_id?: string | null
          plugin_slug?: string | null
          position?: string
          sort_order?: number
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "menu_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          author: string | null
          category: string
          config_schema: Json | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          install_count: number | null
          is_official: boolean | null
          name: string
          rating: number | null
          slug: string
          tags: string[] | null
          updated_at: string
          version: string
        }
        Insert: {
          author?: string | null
          category?: string
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_official?: boolean | null
          name: string
          rating?: number | null
          slug: string
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Update: {
          author?: string | null
          category?: string
          config_schema?: Json | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_official?: boolean | null
          name?: string
          rating?: number | null
          slug?: string
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_memory: {
        Row: {
          agent_log: Json | null
          api_list: Json | null
          created_at: string
          current_step: number | null
          db_schema: Json | null
          error: string | null
          folder_structure: Json | null
          generated_files: Json | null
          id: string
          modules: Json | null
          page_layouts: Json | null
          project_id: string
          quality_score: Json | null
          requirements: Json | null
          status: string | null
          suggestions: Json | null
          task_plan: Json | null
          total_steps: number | null
          ui_components: Json | null
          updated_at: string
          user_id: string
          workflow: Json | null
        }
        Insert: {
          agent_log?: Json | null
          api_list?: Json | null
          created_at?: string
          current_step?: number | null
          db_schema?: Json | null
          error?: string | null
          folder_structure?: Json | null
          generated_files?: Json | null
          id?: string
          modules?: Json | null
          page_layouts?: Json | null
          project_id: string
          quality_score?: Json | null
          requirements?: Json | null
          status?: string | null
          suggestions?: Json | null
          task_plan?: Json | null
          total_steps?: number | null
          ui_components?: Json | null
          updated_at?: string
          user_id: string
          workflow?: Json | null
        }
        Update: {
          agent_log?: Json | null
          api_list?: Json | null
          created_at?: string
          current_step?: number | null
          db_schema?: Json | null
          error?: string | null
          folder_structure?: Json | null
          generated_files?: Json | null
          id?: string
          modules?: Json | null
          page_layouts?: Json | null
          project_id?: string
          quality_score?: Json | null
          requirements?: Json | null
          status?: string | null
          suggestions?: Json | null
          task_plan?: Json | null
          total_steps?: number | null
          ui_components?: Json | null
          updated_at?: string
          user_id?: string
          workflow?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_memory_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          id: string
          prompt: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      releases: {
        Row: {
          created_at: string
          id: string
          release_url: string | null
          status: string
          tag_name: string
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          release_url?: string | null
          status?: string
          tag_name: string
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          release_url?: string | null
          status?: string
          tag_name?: string
          version?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      user_plugins: {
        Row: {
          config: Json | null
          id: string
          installed_at: string
          is_active: boolean | null
          plugin_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          id?: string
          installed_at?: string
          is_active?: boolean | null
          plugin_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          id?: string
          installed_at?: string
          is_active?: boolean | null
          plugin_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plugins_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
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
