import { supabase } from '@/lib/supabase-client';

export const checkRegimeEnum = async () => {
  try {
    // Verificar os valores possíveis do enum regime_tributario
    const { data, error } = await supabase.rpc('pg_enum_values', {
      enum_name: 'regime_tributario'
    });
    
    if (error) {
      console.error('Erro ao verificar enum:', error);
      return;
    }
    
    console.log('Valores do enum regime_tributario:', data);
  } catch (error) {
    console.error('Erro ao verificar enum:', error);
  }
};

// Função para verificar o estado das tabelas
export const checkTables = async () => {
  try {
    // Verificar estrutura da tabela companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (companiesError) {
      console.error('Erro ao verificar tabela companies:', companiesError);
    } else {
      console.log('Estrutura da tabela companies:', companies?.[0]);
    }
    
    // Verificar estrutura da tabela cnpj_regimes
    const { data: cnpjRegimes, error: cnpjRegimesError } = await supabase
      .from('cnpj_regimes')
      .select('*')
      .limit(1);
    
    if (cnpjRegimesError) {
      console.error('Erro ao verificar tabela cnpj_regimes:', cnpjRegimesError);
    } else {
      console.log('Estrutura da tabela cnpj_regimes:', cnpjRegimes?.[0]);
    }
  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  }
};

// Executar verificações
checkRegimeEnum();
checkTables();