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
      activities: {
        Row: {
          at: string
          client_visible: boolean
          company_id: string | null
          contact_id: string | null
          deal_id: string | null
          id: string
          summary: string
          type: string
          workspace_id: string
        }
        Insert: {
          at?: string
          client_visible?: boolean
          company_id?: string | null
          contact_id?: string | null
          deal_id?: string | null
          id?: string
          summary: string
          type: string
          workspace_id: string
        }
        Update: {
          at?: string
          client_visible?: boolean
          company_id?: string | null
          contact_id?: string | null
          deal_id?: string | null
          id?: string
          summary?: string
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_daily: {
        Row: {
          company_id: string
          day: string
          leads: number
          visits: number
          workspace_id: string
        }
        Insert: {
          company_id: string
          day: string
          leads?: number
          visits?: number
          workspace_id: string
        }
        Update: {
          company_id?: string
          day?: string
          leads?: number
          visits?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_daily_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action: Json
          created_at: string
          enabled: boolean
          id: string
          name: string
          trigger: Json
          workspace_id: string
        }
        Insert: {
          action: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          trigger: Json
          workspace_id: string
        }
        Update: {
          action?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          trigger?: Json
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          domain: string
          id: string
          industry: string
          is_client: boolean
          location: string
          name: string
          notes: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          domain?: string
          id?: string
          industry?: string
          is_client?: boolean
          location?: string
          name: string
          notes?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          industry?: string
          is_client?: boolean
          location?: string
          name?: string
          notes?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          hue: number
          id: string
          name: string
          notes: string
          phone: string
          role: string
          tags: string[]
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string
          hue?: number
          id?: string
          name: string
          notes?: string
          phone?: string
          role?: string
          tags?: string[]
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          hue?: number
          id?: string
          name?: string
          notes?: string
          phone?: string
          role?: string
          tags?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          amount: number
          company_id: string
          deal_id: string | null
          id: string
          sent_at: string
          signed_at: string | null
          signed_by: string | null
          status: string
          summary: string
          terms: string[]
          title: string
          viewed_at: string | null
          workspace_id: string
        }
        Insert: {
          amount?: number
          company_id: string
          deal_id?: string | null
          id?: string
          sent_at?: string
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          summary?: string
          terms?: string[]
          title: string
          viewed_at?: string | null
          workspace_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          deal_id?: string | null
          id?: string
          sent_at?: string
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          summary?: string
          terms?: string[]
          title?: string
          viewed_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          closed_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          name: string
          source: string
          stage_changed_at: string
          stage_id: string
          value: number
          workspace_id: string
        }
        Insert: {
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          name: string
          source?: string
          stage_changed_at?: string
          stage_id: string
          value?: number
          workspace_id: string
        }
        Update: {
          closed_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          name?: string
          source?: string
          stage_changed_at?: string
          stage_id?: string
          value?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          client_comment: string
          company_id: string
          deal_id: string | null
          file_path: string
          id: string
          kind: string
          note: string
          posted_at: string
          responded_at: string | null
          status: string
          title: string
          url: string
          workspace_id: string
        }
        Insert: {
          client_comment?: string
          company_id: string
          deal_id?: string | null
          file_path?: string
          id?: string
          kind?: string
          note?: string
          posted_at?: string
          responded_at?: string | null
          status?: string
          title: string
          url?: string
          workspace_id: string
        }
        Update: {
          client_comment?: string
          company_id?: string
          deal_id?: string | null
          file_path?: string
          id?: string
          kind?: string
          note?: string
          posted_at?: string
          responded_at?: string | null
          status?: string
          title?: string
          url?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_articles: {
        Row: {
          category: string
          client_visible: boolean
          id: string
          minutes: number
          position: number
          sections: Json
          slug: string
          summary: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string
          client_visible?: boolean
          id?: string
          minutes?: number
          position?: number
          sections?: Json
          slug: string
          summary?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string
          client_visible?: boolean
          id?: string
          minutes?: number
          position?: number
          sections?: Json
          slug?: string
          summary?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doc_articles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          at: string
          body_html: string
          body_text: string
          created_at: string
          direction: string
          from_email: string
          from_name: string
          id: string
          in_reply_to: string
          message_id: string
          subject: string
          thread_id: string
          to_emails: string[]
          workspace_id: string
        }
        Insert: {
          at?: string
          body_html?: string
          body_text?: string
          created_at?: string
          direction: string
          from_email?: string
          from_name?: string
          id?: string
          in_reply_to?: string
          message_id?: string
          subject?: string
          thread_id: string
          to_emails?: string[]
          workspace_id: string
        }
        Update: {
          at?: string
          body_html?: string
          body_text?: string
          created_at?: string
          direction?: string
          from_email?: string
          from_name?: string
          id?: string
          in_reply_to?: string
          message_id?: string
          subject?: string
          thread_id?: string
          to_emails?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_outbox: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          event: string
          id: string
          payload: Json
          recipients: string[]
          sent_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          event: string
          id?: string
          payload?: Json
          recipients: string[]
          sent_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          event?: string
          id?: string
          payload?: Json
          recipients?: string[]
          sent_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          last_direction: string
          last_message_at: string
          lead_id: string | null
          snippet: string
          subject: string
          unread: boolean
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          last_direction?: string
          last_message_at?: string
          lead_id?: string | null
          snippet?: string
          subject?: string
          unread?: boolean
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          last_direction?: string
          last_message_at?: string
          lead_id?: string | null
          snippet?: string
          subject?: string
          unread?: boolean
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_threads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlements: {
        Row: {
          company_id: string
          tool_ids: string[]
          workspace_id: string
        }
        Insert: {
          company_id: string
          tool_ids?: string[]
          workspace_id: string
        }
        Update: {
          company_id?: string
          tool_ids?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlements_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          contact_id: string | null
          deal_id: string | null
          done: boolean
          duration_min: number
          id: string
          kind: string
          notes: string
          start_at: string
          title: string
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          deal_id?: string | null
          done?: boolean
          duration_min?: number
          id?: string
          kind?: string
          notes?: string
          start_at?: string
          title: string
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          deal_id?: string | null
          done?: boolean
          duration_min?: number
          id?: string
          kind?: string
          notes?: string
          start_at?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_requests: {
        Row: {
          company: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          email: string
          id: string
          ip: string | null
          message: string
          name: string
          request_type: string
          workspace_id: string
        }
        Insert: {
          company?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          email: string
          id?: string
          ip?: string | null
          message: string
          name: string
          request_type: string
          workspace_id: string
        }
        Update: {
          company?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          email?: string
          id?: string
          ip?: string | null
          message?: string
          name?: string
          request_type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_requests_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          company_id: string
          deal_id: string | null
          due_at: string
          id: string
          issued_at: string
          label: string
          number: string
          paid_at: string | null
          status: string
          workspace_id: string
        }
        Insert: {
          amount?: number
          company_id: string
          deal_id?: string | null
          due_at?: string
          id?: string
          issued_at?: string
          label?: string
          number: string
          paid_at?: string | null
          status?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          deal_id?: string | null
          due_at?: string
          id?: string
          issued_at?: string
          label?: string
          number?: string
          paid_at?: string | null
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company: string
          converted_contact_id: string | null
          created_at: string
          email: string
          id: string
          last_contacted_at: string | null
          name: string
          notes: string
          phone: string
          role: string
          source: string
          status: string
          tags: string[]
          website: string
          workspace_id: string
        }
        Insert: {
          company?: string
          converted_contact_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string
          phone?: string
          role?: string
          source?: string
          status?: string
          tags?: string[]
          website?: string
          workspace_id: string
        }
        Update: {
          company?: string
          converted_contact_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string
          phone?: string
          role?: string
          source?: string
          status?: string
          tags?: string[]
          website?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_contact_id_fkey"
            columns: ["converted_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          hue: number
          id: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          hue?: number
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          hue?: number
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          detail: string
          href: string
          id: string
          kind: string
          rule_id: string | null
          title: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          detail?: string
          href?: string
          id?: string
          kind?: string
          rule_id?: string | null
          title: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          detail?: string
          href?: string
          id?: string
          kind?: string
          rule_id?: string | null
          title?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          id: string
          invoice_id: string
          method: string
          paid_on: string
          recorded_by: string | null
          reference: string
          workspace_id: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          paid_on?: string
          recorded_by?: string | null
          reference?: string
          workspace_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          paid_on?: string
          recorded_by?: string | null
          reference?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          company_id: string | null
          created_at: string
          global_discount_pct: number
          id: string
          lines: Json
          notes: string
          prepared_for: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          global_discount_pct?: number
          id?: string
          lines?: Json
          notes?: string
          prepared_for?: string
          title?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          global_discount_pct?: number
          id?: string
          lines?: Json
          notes?: string
          prepared_for?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      read_notifications: {
        Row: {
          notif_id: string
          read_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          notif_id: string
          read_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          notif_id?: string
          read_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "read_notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      retainers: {
        Row: {
          active: boolean
          amount: number
          auto_invoice: boolean
          billing_day: number
          company_id: string
          created_at: string
          id: string
          included_hours: number
          name: string
          next_invoice_on: string | null
          notes: string
          workspace_id: string
        }
        Insert: {
          active?: boolean
          amount?: number
          auto_invoice?: boolean
          billing_day?: number
          company_id: string
          created_at?: string
          id?: string
          included_hours?: number
          name: string
          next_invoice_on?: string | null
          notes?: string
          workspace_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          auto_invoice?: boolean
          billing_day?: number
          company_id?: string
          created_at?: string
          id?: string
          included_hours?: number
          name?: string
          next_invoice_on?: string | null
          notes?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retainers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retainers_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          backups: Json
          company_id: string
          deploys: Json
          dns: Json
          domain_renews_at: string
          id: string
          incidents: Json
          last_deploy_at: string
          pages: Json
          perf: Json
          plan: string
          region: string
          registrar: string
          ssl_days_left: number
          status: string
          traffic_sources: Json
          uptime_90d: string
          usage: Json
          visits_30d: number
          workspace_id: string
        }
        Insert: {
          backups?: Json
          company_id: string
          deploys?: Json
          dns?: Json
          domain_renews_at?: string
          id?: string
          incidents?: Json
          last_deploy_at?: string
          pages?: Json
          perf?: Json
          plan?: string
          region?: string
          registrar?: string
          ssl_days_left?: number
          status?: string
          traffic_sources?: Json
          uptime_90d?: string
          usage?: Json
          visits_30d?: number
          workspace_id: string
        }
        Update: {
          backups?: Json
          company_id?: string
          deploys?: Json
          dns?: Json
          domain_renews_at?: string
          id?: string
          incidents?: Json
          last_deploy_at?: string
          pages?: Json
          perf?: Json
          plan?: string
          region?: string
          registrar?: string
          ssl_days_left?: number
          status?: string
          traffic_sources?: Json
          uptime_90d?: string
          usage?: Json
          visits_30d?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          id: string
          kind: string
          name: string
          position: number
          workspace_id: string
        }
        Insert: {
          id?: string
          kind?: string
          name: string
          position?: number
          workspace_id: string
        }
        Update: {
          id?: string
          kind?: string
          name?: string
          position?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          contact_id: string | null
          created_at: string
          deal_id: string | null
          done: boolean
          due_at: string
          id: string
          title: string
          workspace_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          done?: boolean
          due_at?: string
          id?: string
          title: string
          workspace_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          done?: boolean
          due_at?: string
          id?: string
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          at: string
          attachments: Json
          author: string
          body: string
          company_id: string
          from_side: string
          id: string
          ticket_id: string
          workspace_id: string
        }
        Insert: {
          at?: string
          attachments?: Json
          author?: string
          body: string
          company_id: string
          from_side: string
          id?: string
          ticket_id: string
          workspace_id: string
        }
        Update: {
          at?: string
          attachments?: Json
          author?: string
          body?: string
          company_id?: string
          from_side?: string
          id?: string
          ticket_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          company_id: string
          contact_id: string | null
          created_at: string
          id: string
          status: string
          subject: string
          topic: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subject: string
          topic?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subject?: string
          topic?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          author: string
          billable: boolean
          company_id: string | null
          created_at: string
          deal_id: string | null
          entry_date: string
          id: string
          minutes: number
          note: string
          retainer_id: string | null
          task_id: string | null
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          author?: string
          billable?: boolean
          company_id?: string | null
          created_at?: string
          deal_id?: string | null
          entry_date?: string
          id?: string
          minutes: number
          note?: string
          retainer_id?: string | null
          task_id?: string | null
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          author?: string
          billable?: boolean
          company_id?: string | null
          created_at?: string
          deal_id?: string | null
          entry_date?: string
          id?: string
          minutes?: number
          note?: string
          retainer_id?: string | null
          task_id?: string | null
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_retainer_id_fkey"
            columns: ["retainer_id"]
            isOneToOne: false
            referencedRelation: "retainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      vault_items: {
        Row: {
          category: string
          company_id: string | null
          created_at: string
          has_secret: boolean
          id: string
          last_access_at: string | null
          name: string
          secret_enc: string | null
          updated_at: string
          url: string
          username: string
          workspace_id: string
        }
        Insert: {
          category?: string
          company_id?: string | null
          created_at?: string
          has_secret?: boolean
          id?: string
          last_access_at?: string | null
          name: string
          secret_enc?: string | null
          updated_at?: string
          url?: string
          username?: string
          workspace_id: string
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string
          has_secret?: boolean
          id?: string
          last_access_at?: string | null
          name?: string
          secret_enc?: string | null
          updated_at?: string
          url?: string
          username?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vault_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inbound_address: string | null
          invoice_seq: number
          name: string
          onboarded: boolean
          plan: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inbound_address?: string | null
          invoice_seq?: number
          name?: string
          onboarded?: boolean
          plan?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inbound_address?: string | null
          invoice_seq?: number
          name?: string
          onboarded?: boolean
          plan?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bill_retainer: { Args: { p_retainer: string }; Returns: string }
      create_contract: {
        Args: {
          p_amount: number
          p_company: string
          p_deal: string
          p_id: string
          p_summary: string
          p_terms: string[]
          p_title: string
        }
        Returns: string
      }
      create_deal: {
        Args: {
          p_company: string
          p_contact: string
          p_id: string
          p_name: string
          p_source: string
          p_stage: string
          p_value: number
          p_workspace: string
        }
        Returns: string
      }
      create_invoice: {
        Args: {
          p_amount: number
          p_company: string
          p_deal: string
          p_due_days: number
          p_id: string
          p_label: string
        }
        Returns: string
      }
      create_ticket: {
        Args: {
          p_attachments?: Json
          p_author: string
          p_company: string
          p_contact: string
          p_details: string
          p_id: string
          p_subject: string
          p_topic: string
        }
        Returns: string
      }
      create_workspace: {
        Args: { p_name: string; p_template: string }
        Returns: string
      }
      get_email_config: { Args: never; Returns: Json }
      ingest_inbound_email: { Args: { p: Json }; Returns: string }
      mark_contract_viewed: { Args: { p_contract: string }; Returns: undefined }
      move_deal: {
        Args: { p_deal: string; p_stage: string }
        Returns: undefined
      }
      delete_payment: { Args: { p_payment: string }; Returns: undefined }
      pay_invoice: { Args: { p_invoice: string }; Returns: undefined }
      record_payment: {
        Args: {
          p_amount: number
          p_id: string
          p_invoice: string
          p_method: string
          p_paid_on: string
          p_reference: string
        }
        Returns: string
      }
      raise_invoice_seq: {
        Args: { p_seq: number; p_workspace: string }
        Returns: undefined
      }
      reply_ticket: {
        Args: {
          p_attachments?: Json
          p_author: string
          p_body: string
          p_ticket: string
        }
        Returns: undefined
      }
      respond_deliverable: {
        Args: { p_comment: string; p_id: string; p_status: string }
        Returns: undefined
      }
      reveal_vault_secret: { Args: { p_id: string }; Returns: string }
      save_vault_item: {
        Args: {
          p_category: string
          p_company: string
          p_id: string
          p_name: string
          p_secret: string
          p_url: string
          p_username: string
          p_workspace: string
        }
        Returns: string
      }
      send_invoice_reminder: { Args: { p_invoice: string }; Returns: undefined }
      send_thread_email: {
        Args: {
          p_body: string
          p_contact: string
          p_lead: string
          p_subject: string
          p_thread: string
          p_to: string[]
          p_workspace: string
        }
        Returns: string
      }
      sign_contract: {
        Args: { p_contract: string; p_signer: string }
        Returns: undefined
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
