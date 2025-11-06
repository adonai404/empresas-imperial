// Wrapper para o cliente Supabase com type casting para evitar problemas de tipos vazios
import { supabase as supabaseClient } from '@/integrations/supabase/client';

// Helper para fazer cast automático das chamadas do Supabase
export const supabase = {
  from: (table: string) => ((supabaseClient as any).from(table) as any),
  auth: supabaseClient.auth,
  storage: supabaseClient.storage,
  rpc: (fn: string, args?: any) => ((supabaseClient as any).rpc(fn, args) as any),
  channel: (name: string) => supabaseClient.channel(name),
};
