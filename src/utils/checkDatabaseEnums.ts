import { supabase } from '@/lib/supabase-client';

// Função para verificar os enums do banco de dados
export const checkDatabaseEnums = async () => {
  try {
    // Verificar os valores do enum regime_tributario diretamente no PostgreSQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT enumlabel 
        FROM pg_enum e 
        JOIN pg_type t ON e.enumtypid = t.oid 
        WHERE t.typname = 'regime_tributario' 
        ORDER BY e.enumsortorder;
      `
    });
    
    if (error) {
      console.error('Erro ao verificar enum regime_tributario:', error);
    } else {
      console.log('Valores do enum regime_tributario:', data);
    }
  } catch (error) {
    console.error('Erro ao verificar enums:', error);
  }
};

// Função para verificar a estrutura das tabelas
export const checkTableStructure = async () => {
  try {
    // Verificar a estrutura da coluna regime_tributario na tabela companies
    const { data: companiesInfo, error: companiesError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'companies' AND column_name = 'regime_tributario';
      `
    });
    
    if (companiesError) {
      console.error('Erro ao verificar estrutura da tabela companies:', companiesError);
    } else {
      console.log('Estrutura da coluna regime_tributario em companies:', companiesInfo);
    }
    
    // Verificar a estrutura da coluna regime_tributario na tabela cnpj_regimes
    const { data: cnpjRegimesInfo, error: cnpjRegimesError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type, udt_name, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'cnpj_regimes' AND column_name = 'regime_tributario';
      `
    });
    
    if (cnpjRegimesError) {
      console.error('Erro ao verificar estrutura da tabela cnpj_regimes:', cnpjRegimesError);
    } else {
      console.log('Estrutura da coluna regime_tributario em cnpj_regimes:', cnpjRegimesInfo);
    }
  } catch (error) {
    console.error('Erro ao verificar estrutura das tabelas:', error);
  }
};

// Função para testar a inserção de uma empresa com regime simples_nacional
export const testInsertSimplesNacional = async () => {
  try {
    console.log('Testando inserção de empresa com regime simples_nacional...');
    
    const testData = {
      name: 'Teste Simples Nacional',
      cnpj: '12345678901234',
      regime_tributario: 'simples_nacional',
      sem_movimento: false
    };
    
    const { data, error } = await supabase
      .from('companies')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao inserir empresa com regime simples_nacional:', error);
      return null;
    } else {
      console.log('Empresa inserida com sucesso:', data);
      // Remover a empresa de teste
      if (data?.id) {
        await supabase.from('companies').delete().eq('id', data.id);
        console.log('Empresa de teste removida');
      }
      return data;
    }
  } catch (error) {
    console.error('Erro ao testar inserção:', error);
    return null;
  }
};

// Executar todas as verificações
const runChecks = async () => {
  console.log('=== Verificando enums do banco de dados ===');
  await checkDatabaseEnums();
  
  console.log('\n=== Verificando estrutura das tabelas ===');
  await checkTableStructure();
  
  console.log('\n=== Testando inserção ===');
  await testInsertSimplesNacional();
};

runChecks();