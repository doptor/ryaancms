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
      ac_accounts: {
        Row: {
          category: string | null
          code: string
          company_id: string | null
          created_at: string
          currency_code: string | null
          current_balance: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          opening_balance: number | null
          parent_id: string | null
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          opening_balance?: number | null
          parent_id?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          current_balance?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          opening_balance?: number | null
          parent_id?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ac_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_companies: {
        Row: {
          address: string | null
          created_at: string
          currency_code: string | null
          email: string | null
          fiscal_year_start: string | null
          id: string
          is_active: boolean | null
          logo: string | null
          name: string
          phone: string | null
          tax_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency_code?: string | null
          email?: string | null
          fiscal_year_start?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          currency_code?: string | null
          email?: string | null
          fiscal_year_start?: string | null
          id?: string
          is_active?: boolean | null
          logo?: string | null
          name?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ac_currencies: {
        Row: {
          code: string
          created_at: string
          exchange_rate: number | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          exchange_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      ac_customers: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          currency_code: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          outstanding_balance: number | null
          phone: string | null
          tax_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          outstanding_balance?: number | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          outstanding_balance?: number | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_customers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_expense_categories: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_expense_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_expenses: {
        Row: {
          account_id: string | null
          amount: number
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          company_id: string | null
          created_at: string
          currency_code: string | null
          description: string | null
          expense_date: string
          id: string
          is_billable: boolean | null
          is_recurring: boolean | null
          payment_method: string | null
          receipt_path: string | null
          recurring_frequency: string | null
          reference: string | null
          rejection_reason: string | null
          submitted_by: string
          tax_amount: number | null
          tax_rate_id: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          description?: string | null
          expense_date: string
          id?: string
          is_billable?: boolean | null
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_path?: string | null
          recurring_frequency?: string | null
          reference?: string | null
          rejection_reason?: string | null
          submitted_by: string
          tax_amount?: number | null
          tax_rate_id?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          is_billable?: boolean | null
          is_recurring?: boolean | null
          payment_method?: string | null
          receipt_path?: string | null
          recurring_frequency?: string | null
          reference?: string | null
          rejection_reason?: string | null
          submitted_by?: string
          tax_amount?: number | null
          tax_rate_id?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ac_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ac_expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_expenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_expenses_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "ac_tax_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "ac_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_income: {
        Row: {
          account_id: string | null
          amount: number
          attachment: string | null
          category: string | null
          company_id: string | null
          created_at: string
          currency_code: string | null
          customer_id: string | null
          description: string | null
          id: string
          income_date: string
          is_recurring: boolean | null
          payment_method: string | null
          recurring_frequency: string | null
          reference: string | null
          tax_amount: number | null
          tax_rate_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          income_date: string
          is_recurring?: boolean | null
          payment_method?: string | null
          recurring_frequency?: string | null
          reference?: string | null
          tax_amount?: number | null
          tax_rate_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment?: string | null
          category?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string | null
          description?: string | null
          id?: string
          income_date?: string
          is_recurring?: boolean | null
          payment_method?: string | null
          recurring_frequency?: string | null
          reference?: string | null
          tax_amount?: number | null
          tax_rate_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_income_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ac_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_income_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_income_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ac_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_income_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "ac_tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_invoice_items: {
        Row: {
          account_id: string | null
          created_at: string
          description: string
          discount: number | null
          id: string
          invoice_id: string
          quantity: number | null
          sort_order: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string
          description: string
          discount?: number | null
          id?: string
          invoice_id: string
          quantity?: number | null
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          created_at?: string
          description?: string
          discount?: number | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          sort_order?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_invoice_items_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ac_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "ac_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          company_id: string | null
          created_at: string
          currency_code: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_type: string | null
          due_date: string
          exchange_rate: number | null
          id: string
          invoice_number: string
          is_recurring: boolean | null
          issue_date: string
          late_fee: number | null
          notes: string | null
          paid_at: string | null
          recurring_frequency: string | null
          sent_at: string | null
          status: string | null
          subtotal: number | null
          tax_amount: number | null
          template: string | null
          terms: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number | null
          amount_paid?: number | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          due_date: string
          exchange_rate?: number | null
          id?: string
          invoice_number: string
          is_recurring?: boolean | null
          issue_date: string
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          recurring_frequency?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          template?: string | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number | null
          amount_paid?: number | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          due_date?: string
          exchange_rate?: number | null
          id?: string
          invoice_number?: string
          is_recurring?: boolean | null
          issue_date?: string
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          recurring_frequency?: string | null
          sent_at?: string | null
          status?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          template?: string | null
          terms?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ac_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_payments: {
        Row: {
          account_id: string
          amount: number
          company_id: string | null
          created_at: string
          currency_code: string | null
          customer_id: string | null
          exchange_rate: number | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string
          payment_method: string
          status: string | null
          transaction_reference: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date: string
          payment_method: string
          status?: string | null
          transaction_reference?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          customer_id?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_method?: string
          status?: string | null
          transaction_reference?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ac_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "ac_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "ac_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ac_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "ac_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_tax_rates: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_compound: boolean | null
          name: string
          rate: number
          type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_compound?: boolean | null
          name: string
          rate: number
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_compound?: boolean | null
          name?: string
          rate?: number
          type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_tax_rates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ac_vendors: {
        Row: {
          address: string | null
          company_id: string | null
          created_at: string
          currency_code: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          outstanding_balance: number | null
          phone: string | null
          tax_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          outstanding_balance?: number | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_id?: string | null
          created_at?: string
          currency_code?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          outstanding_balance?: number | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ac_vendors_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      collaboration_messages: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          message: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          message: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          message?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          related_id: string | null
          related_type: string | null
          status: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_id?: string | null
          related_type?: string | null
          status?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          related_id?: string | null
          related_type?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_campaigns: {
        Row: {
          budget: number | null
          conversions: number | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          leads_generated: number | null
          name: string
          spent: number | null
          start_date: string | null
          status: string | null
          target_audience: string | null
          type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          name: string
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          conversions?: number | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          leads_generated?: number | null
          name?: string
          spent?: number | null
          start_date?: string | null
          status?: string | null
          target_audience?: string | null
          type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_companies: {
        Row: {
          address: string | null
          annual_revenue: number | null
          created_at: string
          email: string | null
          employee_count: number | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          annual_revenue?: number | null
          created_at?: string
          email?: string | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          annual_revenue?: number | null
          created_at?: string
          email?: string | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          address: string | null
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          social_linkedin: string | null
          social_twitter: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          actual_close_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          currency_code: string | null
          expected_close_date: string | null
          id: string
          lost_reason: string | null
          notes: string | null
          owner_id: string | null
          probability: number | null
          stage_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          actual_close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency_code?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          actual_close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency_code?: string | null
          expected_close_date?: string | null
          id?: string
          lost_reason?: string | null
          notes?: string | null
          owner_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "crm_pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          company_id: string | null
          converted_at: string | null
          converted_contact_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          score: number | null
          source: string | null
          status: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          company_id?: string | null
          converted_at?: string | null
          converted_contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          company_id?: string | null
          converted_at?: string | null
          converted_contact_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_stages: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          probability: number | null
          slug: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          probability?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          probability?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "ac_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
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
      developer_api_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          label?: string
          last_used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      developer_payouts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          developer_id: string
          id: string
          notes: string | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          developer_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          developer_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
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
      orders: {
        Row: {
          amount: number
          buyer_id: string
          commission_amount: number
          created_at: string
          currency: string
          developer_amount: number
          id: string
          license_key: string | null
          payment_method: string | null
          plugin_id: string
          status: string
        }
        Insert: {
          amount?: number
          buyer_id: string
          commission_amount?: number
          created_at?: string
          currency?: string
          developer_amount?: number
          id?: string
          license_key?: string | null
          payment_method?: string | null
          plugin_id: string
          status?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          commission_amount?: number
          created_at?: string
          currency?: string
          developer_amount?: number
          id?: string
          license_key?: string | null
          payment_method?: string | null
          plugin_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_plugin_id_fkey"
            columns: ["plugin_id"]
            isOneToOne: false
            referencedRelation: "plugins"
            referencedColumns: ["id"]
          },
        ]
      }
      plugins: {
        Row: {
          approval_status: string
          author: string | null
          category: string
          commission_rate: number | null
          config_schema: Json | null
          created_at: string
          demo_url: string | null
          description: string | null
          download_url: string | null
          icon: string | null
          id: string
          install_count: number | null
          is_free: boolean | null
          is_official: boolean | null
          name: string
          price: number | null
          rating: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          slug: string
          submitted_by: string | null
          tags: string[] | null
          updated_at: string
          version: string
        }
        Insert: {
          approval_status?: string
          author?: string | null
          category?: string
          commission_rate?: number | null
          config_schema?: Json | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          download_url?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_free?: boolean | null
          is_official?: boolean | null
          name: string
          price?: number | null
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          slug: string
          submitted_by?: string | null
          tags?: string[] | null
          updated_at?: string
          version?: string
        }
        Update: {
          approval_status?: string
          author?: string | null
          category?: string
          commission_rate?: number | null
          config_schema?: Json | null
          created_at?: string
          demo_url?: string | null
          description?: string | null
          download_url?: string | null
          icon?: string | null
          id?: string
          install_count?: number | null
          is_free?: boolean | null
          is_official?: boolean | null
          name?: string
          price?: number | null
          rating?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          slug?: string
          submitted_by?: string | null
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
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          brand_name: string | null
          created_at: string
          id: string
          logo_url: string | null
          prompt: string
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          prompt: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          prompt?: string
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      published_previews: {
        Row: {
          config: Json
          created_at: string
          id: string
          project_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          project_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          project_title?: string | null
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string
          events: string[]
          id: string
          is_active: boolean
          name: string
          project_id: string | null
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name: string
          project_id?: string | null
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          id?: string
          is_active?: boolean
          name?: string
          project_id?: string | null
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_project_id_fkey"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
