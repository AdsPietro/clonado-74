import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Usar valores padrão se as variáveis não estiverem configuradas
const defaultUrl = 'https://placeholder.supabase.co';
const defaultKey = 'placeholder-key';

const finalUrl = supabaseUrl && !supabaseUrl.includes('your-project-ref') ? supabaseUrl : defaultUrl;
const finalKey = supabaseAnonKey && !supabaseAnonKey.includes('your-anon-key') ? supabaseAnonKey : defaultKey;

// Criar cliente Supabase
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Tipos para TypeScript (serão expandidos conforme criamos as tabelas)
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: string;
          name: string;
          address: string;
          energy_unit_name: string | null;
          type: 'apartment' | 'house' | 'commercial';
          purchase_price: number;
          rent_value: number;
          status: 'rented' | 'vacant' | 'maintenance';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          energy_unit_name?: string | null;
          type: 'apartment' | 'house' | 'commercial';
          purchase_price: number;
          rent_value: number;
          status: 'rented' | 'vacant' | 'maintenance';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          energy_unit_name?: string | null;
          type?: 'apartment' | 'house' | 'commercial';
          purchase_price?: number;
          rent_value?: number;
          status?: 'rented' | 'vacant' | 'maintenance';
          created_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          property_id: string;
          name: string;
          email: string;
          cpf: string | null;
          phone: string;
          start_date: string;
          agreed_payment_date: string | null;
          monthly_rent: number;
          deposit: number;
          payment_method: 'À vista' | 'A prazo' | null;
          installments: '2x' | '3x' | null;
          deposit_paid_installments: boolean[] | null;
          formalized_contract: boolean | null;
          status: 'active' | 'inactive';
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          name: string;
          email: string;
          cpf?: string | null;
          phone: string;
          start_date: string;
          agreed_payment_date?: string | null;
          monthly_rent: number;
          deposit: number;
          payment_method?: 'À vista' | 'A prazo' | null;
          installments?: '2x' | '3x' | null;
          deposit_paid_installments?: boolean[] | null;
          formalized_contract?: boolean | null;
          status: 'active' | 'inactive';
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          name?: string;
          email?: string;
          cpf?: string | null;
          phone?: string;
          start_date?: string;
          agreed_payment_date?: string | null;
          monthly_rent?: number;
          deposit?: number;
          payment_method?: 'À vista' | 'A prazo' | null;
          installments?: '2x' | '3x' | null;
          deposit_paid_installments?: boolean[] | null;
          formalized_contract?: boolean | null;
          status?: 'active' | 'inactive';
          created_at?: string;
        };
      };

      transactions: {
        Row: {
          id: string;
          property_id: string;
          type: 'income' | 'expense';
          category: string;
          amount: number;
          description: string;
          date: string;
          recurring: Json | null; // JSON field
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          type: 'income' | 'expense';
          category: string;
          amount: number;
          description: string;
          date: string;
          recurring?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          type?: 'income' | 'expense';
          category?: string;
          amount?: number;
          description?: string;
          date?: string;
          recurring?: Json | null;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          type: 'Contrato de locação' | 'Comprovante de pagamento' | 'RG' | 'CPF' | 'Laudo técnico' | 'Outros';
          issue_date: string;
          has_validity: boolean;
          validity_date: string | null;
          file_name: string | null;
          file_url: string | null;
          observations: string | null;
          property_id: string;
          tenant_id: string | null;
          status: 'Válido' | 'Expirado' | 'Pendente' | 'Revisão';
          contract_signed: boolean;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'Contrato de locação' | 'Comprovante de pagamento' | 'RG' | 'CPF' | 'Laudo técnico' | 'Outros';
          issue_date: string;
          has_validity: boolean;
          validity_date?: string | null;
          file_name?: string | null;
          file_url?: string | null;
          observations?: string | null;
          property_id: string;
          tenant_id?: string | null;
          status: 'Válido' | 'Expirado' | 'Pendente' | 'Revisão';
          contract_signed: boolean;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'Contrato de locação' | 'Comprovante de pagamento' | 'RG' | 'CPF' | 'Laudo técnico' | 'Outros';
          issue_date?: string;
          has_validity?: boolean;
          validity_date?: string | null;
          file_name?: string | null;
          file_url?: string | null;
          observations?: string | null;
          property_id?: string;
          tenant_id?: string | null;
          status?: 'Válido' | 'Expirado' | 'Pendente' | 'Revisão';
          contract_signed?: boolean;
          last_updated?: string;
          created_at?: string;
        };
      };
      water_bills: {
        Row: {
          id: string;
          date: string;
          observations: string | null;
          is_paid: boolean;
          created_at: string;
          last_updated: string;
          group_id: string;
          group_name: string;
          total_group_value: number;
          properties_in_group: Json; // Stores SharedWaterConsumption[]
        };
        Insert: {
          id?: string;
          date: string;
          observations?: string | null;
          is_paid?: boolean;
          created_at?: string;
          last_updated?: string;
          group_id: string;
          group_name: string;
          total_group_value: number;
          properties_in_group: Json;
        };
        Update: {
          id?: string;
          date?: string;
          observations?: string | null;
          is_paid?: boolean;
          created_at?: string;
          last_updated?: string;
          group_id?: string;
          group_name?: string;
          total_group_value?: number;
          properties_in_group?: Json;
        };
      };
      // Mais tabelas serão adicionadas conforme necessário
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Cliente tipado
export const supabaseTyped = supabase as typeof supabase & {
  from<T extends keyof Database['public']['Tables']>(
    table: T
  ): any;
};

// Utilitários para autenticação
export const auth = supabase.auth;

// Utilitários para storage (para upload de documentos no futuro)
export const storage = supabase.storage;

// Helper para verificar se o usuário está autenticado
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
  return user;
};

// Helper para fazer logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
};

// Helper para verificar conexão com Supabase
export const testConnection = async () => {
  try {
    // Verificar se as variáveis de ambiente estão configuradas corretamente
    if (!supabaseUrl || !supabaseAnonKey || 
        supabaseUrl.includes('your-project-ref') || 
        supabaseAnonKey.includes('your-anon-key') ||
        finalUrl === defaultUrl || finalKey === defaultKey) {
      console.warn('Supabase não configurado - usando modo offline');
      return false;
    }

    const { data, error } = await supabase
      .from('properties')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela não existe ainda
      throw error;
    }
    
    return true;
  } catch (error) {
    console.warn('Supabase indisponível - usando modo offline:', error);
    return false;
  }
};
