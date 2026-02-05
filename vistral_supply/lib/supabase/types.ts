export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'supply_partner' | 'supply_analyst' | 'supply_admin' | 'renovator_analyst' | 'supply_lead' | 'reno_lead' | 'scouter' | 'supply_project_analyst' | 'supply_project_lead'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: 'supply_partner' | 'supply_analyst' | 'supply_admin' | 'renovator_analyst' | 'supply_lead' | 'reno_lead' | 'scouter' | 'supply_project_analyst' | 'supply_project_lead'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'supply_partner' | 'supply_analyst' | 'supply_admin' | 'renovator_analyst' | 'supply_lead' | 'reno_lead' | 'scouter' | 'supply_project_analyst' | 'supply_project_lead'
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: string
          name: string
          email: string | null
          phone_country_code: string | null
          phone_number: string | null
          dni_nif_cif: string | null
          is_operator: boolean
          created_at: string | null
          updated_at: string | null
          created_by_user_id: string | null
          changed_by_user_id: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          dni_nif_cif?: string | null
          is_operator?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by_user_id?: string | null
          changed_by_user_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          dni_nif_cif?: string | null
          is_operator?: boolean
          created_at?: string | null
          updated_at?: string | null
          created_by_user_id?: string | null
          changed_by_user_id?: string | null
        }
        Relationships: []
      }
      property_contact: {
        Row: {
          id: string
          property_id: string
          contact_id: string
          role: 'seller' | 'tenant' | 'owner' | 'partner' | 'assigned_to' | 'created_by'
          is_active: boolean
          dni_adjunto: Json | null
          fecha_finalizacion_contrato: string | null
          periodo_preaviso: number | null
          subrogacion_contrato: string | null
          importe_alquiler_transferir: number | null
          ultima_actualizacion_alquiler: string | null
          fecha_ultimo_recibo: string | null
          fecha_vencimiento_seguro_alquiler: string | null
          estado_seguro_alquiler: string | null
          proveedor_seguro_alquiler: string | null
          dni_nie_files: Json | null
          contrato_arrendamiento_files: Json | null
          justificantes_pago_files: Json | null
          comprobante_transferencia_vendedor_files: Json | null
          justificante_deposito_files: Json | null
          created_at: string | null
          updated_at: string | null
          deactivated_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          contact_id: string
          role: 'seller' | 'tenant' | 'owner' | 'partner' | 'assigned_to' | 'created_by'
          is_active?: boolean
          dni_adjunto?: Json | null
          fecha_finalizacion_contrato?: string | null
          periodo_preaviso?: number | null
          subrogacion_contrato?: string | null
          importe_alquiler_transferir?: number | null
          ultima_actualizacion_alquiler?: string | null
          fecha_ultimo_recibo?: string | null
          fecha_vencimiento_seguro_alquiler?: string | null
          estado_seguro_alquiler?: string | null
          proveedor_seguro_alquiler?: string | null
          dni_nie_files?: Json | null
          contrato_arrendamiento_files?: Json | null
          justificantes_pago_files?: Json | null
          comprobante_transferencia_vendedor_files?: Json | null
          justificante_deposito_files?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deactivated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          contact_id?: string
          role?: 'seller' | 'tenant' | 'owner' | 'partner' | 'assigned_to' | 'created_by'
          is_active?: boolean
          dni_adjunto?: Json | null
          fecha_finalizacion_contrato?: string | null
          periodo_preaviso?: number | null
          subrogacion_contrato?: string | null
          importe_alquiler_transferir?: number | null
          ultima_actualizacion_alquiler?: string | null
          fecha_ultimo_recibo?: string | null
          fecha_vencimiento_seguro_alquiler?: string | null
          estado_seguro_alquiler?: string | null
          proveedor_seguro_alquiler?: string | null
          dni_nie_files?: Json | null
          contrato_arrendamiento_files?: Json | null
          justificantes_pago_files?: Json | null
          comprobante_transferencia_vendedor_files?: Json | null
          justificante_deposito_files?: Json | null
          created_at?: string | null
          updated_at?: string | null
          deactivated_at?: string | null
        }
        Relationships: []
      }
      address: {
        Row: {
          id: string
          property_id: string
          geography_id: string | null
          address_line: string
          postal_code: string | null
          city: string | null
          country: string | null
          planta: string | null
          puerta: string | null
          bloque: string | null
          escalera: string | null
          latitude: number | null
          longitude: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          geography_id?: string | null
          address_line: string
          postal_code?: string | null
          city?: string | null
          country?: string | null
          planta?: string | null
          puerta?: string | null
          bloque?: string | null
          escalera?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          geography_id?: string | null
          address_line?: string
          postal_code?: string | null
          city?: string | null
          country?: string | null
          planta?: string | null
          puerta?: string | null
          bloque?: string | null
          escalera?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          airtable_property_id: string | null
          name: string | null
          address: string | null
          supply_phase: 'pending' | 'in-progress' | 'review' | 'completed' | 'orphaned' | null
          status: string | null
          property_unique_id: string | null
          created_at: string | null
          updated_at: string | null
          last_update: string | null
          notes: string | null
          bedrooms: number | null
          bathrooms: number | null
          square_meters: number | null
          type: string | null
          stage: string | null
          responsible_owner: string | null
          keys_location: string | null
          pics_urls: string[] | null
          "Client Name": string | null
          "Client email": string | null
          "Hubspot ID": number | null
          geography_id: string | null
          superficie_construida: number | null
          superficie_util: number | null
          ano_construccion: number | null
          referencia_catastral: string | null
          habitaciones: number | null
          banos: number | null
          plazas_aparcamiento: number | null
          ascensor: boolean | null
          balcon_terraza: boolean | null
          trastero: boolean | null
          orientacion: Json | null
          precio_venta: number | null
          gastos_comunidad: number | null
          confirmacion_gastos_comunidad: boolean | null
          ibi_anual: number | null
          confirmacion_ibi: boolean | null
          comunidad_propietarios_constituida: boolean | null
          edificio_seguro_activo: boolean | null
          comercializa_exclusiva: boolean | null
          edificio_ite_favorable: boolean | null
          propiedad_alquilada: boolean | null
          situacion_inquilinos: string | null
          documentacion_minima: Json | null
          planta: string | null
          puerta: string | null
          bloque: string | null
          escalera: string | null
          assigned_to: string | null
          tags: Json | null
          corrections_count: number | null
          total_investment: number | null
          rejection_reasons: Json | null
          analyst_status: string | null
          created_by: string | null
        }
        Insert: {
          id: string
          airtable_property_id?: string | null
          name?: string | null
          address?: string | null
          supply_phase?: 'pending' | 'in-progress' | 'review' | 'completed' | 'orphaned' | null
          status?: string | null
          property_unique_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_update?: string | null
          notes?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          type?: string | null
          stage?: string | null
          responsible_owner?: string | null
          keys_location?: string | null
          pics_urls?: string[] | null
          "Client Name"?: string | null
          "Client email"?: string | null
          "Hubspot ID"?: number | null
          geography_id?: string | null
          superficie_construida?: number | null
          superficie_util?: number | null
          ano_construccion?: number | null
          referencia_catastral?: string | null
          habitaciones?: number | null
          banos?: number | null
          plazas_aparcamiento?: number | null
          ascensor?: boolean | null
          balcon_terraza?: boolean | null
          trastero?: boolean | null
          orientacion?: Json | null
          precio_venta?: number | null
          gastos_comunidad?: number | null
          confirmacion_gastos_comunidad?: boolean | null
          ibi_anual?: number | null
          confirmacion_ibi?: boolean | null
          comunidad_propietarios_constituida?: boolean | null
          edificio_seguro_activo?: boolean | null
          comercializa_exclusiva?: boolean | null
          edificio_ite_favorable?: boolean | null
          propiedad_alquilada?: boolean | null
          situacion_inquilinos?: string | null
          documentacion_minima?: Json | null
          planta?: string | null
          puerta?: string | null
          bloque?: string | null
          escalera?: string | null
          assigned_to?: string | null
          tags?: Json | null
          corrections_count?: number | null
          total_investment?: number | null
          rejection_reasons?: Json | null
          analyst_status?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          airtable_property_id?: string | null
          name?: string | null
          address?: string | null
          supply_phase?: 'pending' | 'in-progress' | 'review' | 'completed' | 'orphaned' | null
          status?: string | null
          property_unique_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_update?: string | null
          notes?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          type?: string | null
          stage?: string | null
          responsible_owner?: string | null
          keys_location?: string | null
          pics_urls?: string[] | null
          "Client Name"?: string | null
          "Client email"?: string | null
          "Hubspot ID"?: number | null
          geography_id?: string | null
          superficie_construida?: number | null
          superficie_util?: number | null
          ano_construccion?: number | null
          referencia_catastral?: string | null
          habitaciones?: number | null
          banos?: number | null
          plazas_aparcamiento?: number | null
          ascensor?: boolean | null
          balcon_terraza?: boolean | null
          trastero?: boolean | null
          orientacion?: Json | null
          precio_venta?: number | null
          gastos_comunidad?: number | null
          confirmacion_gastos_comunidad?: boolean | null
          ibi_anual?: number | null
          confirmacion_ibi?: boolean | null
          comunidad_propietarios_constituida?: boolean | null
          edificio_seguro_activo?: boolean | null
          comercializa_exclusiva?: boolean | null
          edificio_ite_favorable?: boolean | null
          propiedad_alquilada?: boolean | null
          situacion_inquilinos?: string | null
          documentacion_minima?: Json | null
          planta?: string | null
          puerta?: string | null
          bloque?: string | null
          escalera?: string | null
          created_by?: string | null
          assigned_to?: string | null
          tags?: Json | null
          corrections_count?: number | null
          total_investment?: number | null
          rejection_reasons?: Json | null
          analyst_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      budgets: {
        Row: {
          id: string
          property_id: string
          version: number
          items: Json
          total_amount: number | null
          created_by: string
          created_at: string | null
          updated_at: string | null
          is_current: boolean | null
          notes: string | null
        }
        Insert: {
          id?: string
          property_id: string
          version?: number
          items?: Json
          total_amount?: number | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
          is_current?: boolean | null
          notes?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          version?: number
          items?: Json
          total_amount?: number | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
          is_current?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budgets_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      financial_estimates: {
        Row: {
          id: string
          property_id: string
          version: number
          is_current: boolean | null
          basic_info: Json
          financing: Json
          scenario_drivers: Json
          results: Json
          yield_threshold: number
          meets_threshold: boolean | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id: string
          version?: number
          is_current?: boolean | null
          basic_info?: Json
          financing?: Json
          scenario_drivers?: Json
          results?: Json
          yield_threshold?: number
          meets_threshold?: boolean | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          version?: number
          is_current?: boolean | null
          basic_info?: Json
          financing?: Json
          scenario_drivers?: Json
          results?: Json
          yield_threshold?: number
          meets_threshold?: boolean | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_estimates_property_id_fkey"
            columns: ["property_id"]
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_estimates_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Enums: {
      app_role: 'supply_partner' | 'supply_analyst' | 'supply_admin' | 'renovator_analyst' | 'supply_lead' | 'reno_lead' | 'scouter' | 'supply_project_analyst' | 'supply_project_lead'
    }
  }
}
