import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { periodToDate } from '@/lib/periodUtils';



export interface Company {
  id: string;
  name: string;
  cnpj: string;
  sem_movimento?: boolean;
  segmento?: string;
  regime_tributario?: 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'produtor_rural';
  created_at: string;
  updated_at: string;
}

export interface CompanyPassword {
  id: string;
  company_id: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithPassword extends Company {
  company_passwords?: CompanyPassword;
}

export interface FiscalData {
  id: string;
  company_id: string;
  period: string;
  rbt12: number;
  entrada: number;
  saida: number;
  imposto: number;
  created_at: string;
  updated_at: string;
}

export interface Responsavel {
  id: string;
  nome: string;
  created_at: string;
  updated_at: string;
}

export interface LucroRealData {
  id: string;
  company_id: string;
  period: string;
  entradas: number | null;
  saidas: number | null;
  servicos: number | null;
  pis: number | null;
  cofins: number | null;
  icms: number | null;
  irpj_primeiro_trimestre: number | null;
  csll_primeiro_trimestre: number | null;
  irpj_segundo_trimestre: number | null;
  csll_segundo_trimestre: number | null;
  tvi: number | null;
  responsavel_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithData extends Company {
  fiscal_data: FiscalData[];
}

export interface CompanyWithLucroRealData extends Company {
  lucro_real_data: LucroRealData[];
}

export interface CompanyWithLatestData extends Company {
  latest_fiscal_data?: {
    rbt12: number;
    entrada: number;
    saida: number;
    imposto: number;
    period: string;
  };
}

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          lucro_real_data(responsavel_id),
          company_passwords!left(id, password_hash, created_at, updated_at)
        `)
        .order('name');
      
      if (error) throw error;
      return data as Company[];
    },
  });
};

export const useCompaniesWithLatestFiscalData = () => {
  return useQuery({
    queryKey: ['companies-with-latest-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          fiscal_data(rbt12, entrada, saida, imposto, period, created_at),
          company_passwords!left(id, password_hash, created_at, updated_at)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Process to get only the latest fiscal data for each company
      const companiesWithLatestData: CompanyWithLatestData[] = data?.map(company => {
        if (company.fiscal_data && company.fiscal_data.length > 0) {
          // Sort by fiscal period to get the most recent
          const sortedFiscalData = company.fiscal_data.sort((a: any, b: any) => {
            const dateA = periodToDate(a.period) || new Date(0);
            const dateB = periodToDate(b.period) || new Date(0);
            return dateB.getTime() - dateA.getTime();
          });
          const latestData = sortedFiscalData[0];
          
          return {
            ...company,
            latest_fiscal_data: {
              rbt12: latestData.rbt12 || 0,
              entrada: latestData.entrada || 0,
              saida: latestData.saida || 0,
              imposto: latestData.imposto || 0,
              period: latestData.period || 'N/A'
            }
          };
        }
        return company;
      }) || [];
      
      return companiesWithLatestData;
    },
  });
};

export const useCompanyWithData = (companyId: string) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          fiscal_data(*)
        `)
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      return data as CompanyWithData;
    },
    enabled: !!companyId,
  });
};

export const useFiscalStats = () => {
  return useQuery({
    queryKey: ['fiscal-stats'],
    queryFn: async () => {
      const [companiesResult, fiscalDataResult] = await Promise.all([
        supabase.from('companies').select('id, sem_movimento', { count: 'exact' }),
        supabase.from('fiscal_data').select('entrada, saida, imposto, company_id'),
      ]);

      if (companiesResult.error) throw companiesResult.error;
      if (fiscalDataResult.error) throw fiscalDataResult.error;

      const totalCompanies = companiesResult.count || 0;
      const totalRecords = fiscalDataResult.data?.length || 0;
      
      // Calcular empresas por status
      const empresasAtivas = companiesResult.data?.filter(company => !company.sem_movimento).length || 0;
      const empresasParalisadas = 0; // Por enquanto, todas as empresas com sem_movimento são consideradas "sem movimento"
      const empresasSemMovimento = companiesResult.data?.filter(company => company.sem_movimento).length || 0;
      
      // Filtrar dados de empresas protegidas por senha
      const companiesWithPasswords = await supabase
        .from('companies')
        .select(`
          id,
          name,
          company_passwords!left(id)
        `)
        .not('company_passwords.id', 'is', null);

      const protectedCompanyIds = new Set(companiesWithPasswords.data?.map(c => c.id) || []);
      
      // Verificar quais empresas protegidas estão autenticadas
      const authenticatedProtectedIds = new Set();
      companiesWithPasswords.data?.forEach(company => {
        if (localStorage.getItem(`company_auth_${company.name}`) === 'true') {
          authenticatedProtectedIds.add(company.id);
        }
      });

      // Filtrar dados fiscais para incluir apenas empresas não protegidas ou autenticadas
      const filteredFiscalData = fiscalDataResult.data?.filter(data => {
        // Se a empresa não tem senha, incluir
        if (!protectedCompanyIds.has(data.company_id)) {
          return true;
        }
        // Se tem senha mas está autenticada, incluir
        return authenticatedProtectedIds.has(data.company_id);
      }) || [];
      
      const totals = filteredFiscalData.reduce(
        (acc, curr) => ({
          entrada: acc.entrada + (curr.entrada || 0),
          saida: acc.saida + (curr.saida || 0),
          imposto: acc.imposto + (curr.imposto || 0),
        }),
        { entrada: 0, saida: 0, imposto: 0 }
      );

      return {
        totalCompanies,
        totalRecords: filteredFiscalData.length,
        empresasAtivas,
        empresasParalisadas,
        empresasSemMovimento,
        ...totals,
      };
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      // First delete all fiscal data for this company
      const { error: fiscalError } = await supabase
        .from('fiscal_data')
        .delete()
        .eq('company_id', companyId);

      if (fiscalError) throw fiscalError;

      // Then delete the company
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (companyError) throw companyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Empresa excluída',
        description: 'A empresa e todos os seus dados fiscais foram removidos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir empresa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir a empresa.',
        variant: 'destructive',
      });
    },
  });
};

export const useAddCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyData: { 
      name: string; 
      cnpj?: string; 
      sem_movimento?: boolean;
      segmento?: string;
      regime_tributario?: 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'produtor_rural';
    }) => {
      let finalRegime = companyData.regime_tributario;

      // Se não foi especificado um regime e há um CNPJ, verificar se existe regime definido para este CNPJ
      if (!finalRegime && companyData.cnpj) {
        // Remover formatação do CNPJ (pontos, traços, espaços) para comparar apenas números
        const cnpjToSearch = companyData.cnpj.replace(/\D/g, '');
        console.log('🔍 Procurando regime para CNPJ (sem formatação):', cnpjToSearch);
        
        // Debug: listar todos os CNPJs na tabela de regimes
        const { data: allRegimes } = await supabase
          .from('cnpj_regimes')
          .select('cnpj, regime_tributario');
        console.log('📊 Todos os regimes cadastrados:', allRegimes);
        
        const { data: cnpjRegime, error: regimeError } = await supabase
          .from('cnpj_regimes')
          .select('regime_tributario')
          .eq('cnpj', cnpjToSearch)
          .maybeSingle();

        console.log('📋 Resultado da busca:', { cnpjRegime, regimeError });

        if (cnpjRegime) {
          finalRegime = cnpjRegime.regime_tributario;
          console.log('✅ Regime encontrado e aplicado:', finalRegime);
        } else {
          console.log('❌ Nenhum regime encontrado para o CNPJ');
        }
      }

      console.log('💾 Salvando empresa com dados:', {
        name: companyData.name.trim(),
        cnpj: companyData.cnpj?.trim() || null,
        regime_tributario: finalRegime || null
      });

      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: companyData.name.trim(),
          cnpj: companyData.cnpj?.trim() || null,
          sem_movimento: companyData.sem_movimento || false,
          segmento: companyData.segmento?.trim() || null,
          regime_tributario: finalRegime || null,
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Empresa salva com sucesso:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Empresa adicionada',
        description: 'A empresa foi cadastrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar empresa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cadastrar a empresa.',
        variant: 'destructive',
      });
    },
  });
};

export const useAddFiscalData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      company_id: string;
      period: string;
      rbt12: number;
      entrada: number;
      saida: number;
      imposto: number;
    }) => {
      const { data: result, error } = await supabase
        .from('fiscal_data')
        .insert({
          company_id: data.company_id,
          period: data.period.trim(),
          rbt12: data.rbt12 || 0,
          entrada: data.entrada || 0,
          saida: data.saida || 0,
          imposto: data.imposto || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Dados fiscais adicionados',
        description: 'Os dados fiscais foram cadastrados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar dados fiscais',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cadastrar os dados fiscais.',
        variant: 'destructive',
      });
    },
  });
};

export const useImportCompanyExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, data }: {
      companyId: string;
      data: Array<{
        periodo: string;
        rbt12: number | null;
        entrada: number | null;
        saida: number | null;
        imposto: number | null;
      }>
    }) => {
      // Filter out rows without essential data
      const validRows = data.filter(row => 
        row.periodo && row.periodo.trim()
      );

      if (validRows.length === 0) {
        throw new Error('Nenhum registro válido encontrado. Verifique se a coluna Período está preenchida.');
      }

      // Prepare fiscal data
      const fiscalDataRows = validRows.map(row => ({
        company_id: companyId,
        period: row.periodo.trim(),
        rbt12: row.rbt12 || 0,
        entrada: row.entrada || 0,
        saida: row.saida || 0,
        imposto: row.imposto || 0,
      }));

      // Insert fiscal data (using upsert to handle duplicates)
      const { error: fiscalError } = await supabase
        .from('fiscal_data')
        .upsert(fiscalDataRows, { onConflict: 'company_id,period' });

      if (fiscalError) throw fiscalError;

      return { 
        importedRecords: validRows.length,
        skippedRecords: data.length - validRows.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      let description = `${result.importedRecords} registros importados com sucesso.`;
      if (result.skippedRecords > 0) {
        description += ` ${result.skippedRecords} registros foram ignorados por falta de dados essenciais.`;
      }
      
      toast({
        title: 'Importação concluída',
        description,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao importar os dados. Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    },
  });
};

export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, sem_movimento }: { companyId: string; sem_movimento: boolean }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ sem_movimento })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      toast({
        title: 'Situação atualizada',
        description: 'A situação da empresa foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar situação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a situação da empresa.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      companyId, 
      name, 
      cnpj,
      segmento,
      regime_tributario
    }: { 
      companyId: string; 
      name: string; 
      cnpj?: string;
      segmento?: string;
      regime_tributario?: 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'produtor_rural';
    }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ 
          name: name.trim(),
          cnpj: cnpj?.trim() || null,
          segmento: segmento?.trim() || null,
          regime_tributario: regime_tributario || null,
        })
        .eq('id', companyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['company'] });
      
      toast({
        title: 'Empresa atualizada',
        description: 'Os dados da empresa foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar empresa',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a empresa.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para gerenciar senhas de empresas
export const useSetCompanyPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ companyId, password }: { 
      companyId: string; 
      password: string;
    }) => {
      // Hash simples da senha (em produção, use bcrypt ou similar)
      const passwordHash = btoa(password);
      
      const { data, error } = await supabase
        .from('company_passwords')
        .upsert({
          company_id: companyId,
          password_hash: passwordHash
        }, {
          onConflict: 'company_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      toast({
        title: 'Senha definida',
        description: 'A senha da empresa foi definida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao definir senha',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao definir a senha.',
        variant: 'destructive',
      });
    },
  });
};

export const useRemoveCompanyPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (companyId: string) => {
      const { error } = await supabase
        .from('company_passwords')
        .delete()
        .eq('company_id', companyId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      toast({
        title: 'Senha removida',
        description: 'A senha da empresa foi removida com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover senha',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao remover a senha.',
        variant: 'destructive',
      });
    },
  });
};

export const useVerifyCompanyPassword = () => {
  return useMutation({
    mutationFn: async ({ companyId, password }: { 
      companyId: string; 
      password: string;
    }) => {
      const { data, error } = await supabase
        .from('company_passwords')
        .select('password_hash')
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      
      // Verificar se a senha corresponde ao hash
      const passwordHash = btoa(password);
      return passwordHash === data.password_hash;
    },
  });
};

export const useUpdateFiscalData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      period: string;
      rbt12: number;
      entrada: number;
      saida: number;
      imposto: number;
    }) => {
      const { data: result, error } = await supabase
        .from('fiscal_data')
        .update({
          period: data.period.trim(),
          rbt12: data.rbt12 || 0,
          entrada: data.entrada || 0,
          saida: data.saida || 0,
          imposto: data.imposto || 0,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Dados fiscais atualizados',
        description: 'Os dados fiscais foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar dados fiscais',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar os dados fiscais.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteFiscalData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fiscalDataId: string) => {
      const { error } = await supabase
        .from('fiscal_data')
        .delete()
        .eq('id', fiscalDataId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      
      toast({
        title: 'Dados fiscais excluídos',
        description: 'Os dados fiscais foram removidos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir dados fiscais',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir os dados fiscais.',
        variant: 'destructive',
      });
    },
  });
};

export const useFiscalEvolutionData = () => {
  return useQuery({
    queryKey: ['fiscal-evolution-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_data')
        .select(`
          period,
          entrada,
          saida,
          imposto,
          companies!inner(id, name)
        `)
        .order('period');
      
      if (error) throw error;
      
      // Filtrar dados de empresas protegidas por senha
      const companiesWithPasswords = await supabase
        .from('companies')
        .select(`
          id,
          name,
          company_passwords!left(id)
        `)
        .not('company_passwords.id', 'is', null);

      const protectedCompanyIds = new Set(companiesWithPasswords.data?.map(c => c.id) || []);
      
      // Verificar quais empresas protegidas estão autenticadas
      const authenticatedProtectedIds = new Set();
      companiesWithPasswords.data?.forEach(company => {
        if (localStorage.getItem(`company_auth_${company.name}`) === 'true') {
          authenticatedProtectedIds.add(company.id);
        }
      });

      // Filtrar dados fiscais para incluir apenas empresas não protegidas ou autenticadas
      const filteredData = data?.filter(item => {
        // Se a empresa não tem senha, incluir
        if (!protectedCompanyIds.has(item.companies.id)) {
          return true;
        }
        // Se tem senha mas está autenticada, incluir
        return authenticatedProtectedIds.has(item.companies.id);
      }) || [];
      
      // Agrupar dados por período e calcular totais
      const periodTotals = new Map();
      
      filteredData.forEach(item => {
        const period = item.period;
        if (!periodTotals.has(period)) {
          periodTotals.set(period, {
            period,
            entrada: 0,
            saida: 0,
            imposto: 0,
            companies: new Set()
          });
        }
        
        const periodData = periodTotals.get(period);
        periodData.entrada += item.entrada || 0;
        periodData.saida += item.saida || 0;
        periodData.imposto += item.imposto || 0;
        periodData.companies.add(item.companies.name);
      });
      
      // Converter para array e ordenar por período
      const evolutionData = Array.from(periodTotals.values())
        .map(item => ({
          period: item.period,
          entrada: item.entrada,
          saida: item.saida,
          imposto: item.imposto,
          companiesCount: item.companies.size
        }))
        .sort((a, b) => {
          const dateA = periodToDate(a.period) || new Date(0);
          const dateB = periodToDate(b.period) || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
      
      return evolutionData;
    },
  });
};

export const useCompanyFiscalEvolutionData = (companyId: string) => {
  return useQuery({
    queryKey: ['company-fiscal-evolution', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_data')
        .select(`
          period,
          entrada,
          saida,
          imposto,
          rbt12
        `)
        .eq('company_id', companyId)
        .order('period');
      
      if (error) throw error;
      
      // Ordenar dados por período
      const evolutionData = data?.map(item => ({
        period: item.period,
        entrada: item.entrada || 0,
        saida: item.saida || 0,
        imposto: item.imposto || 0,
        rbt12: item.rbt12 || 0,
        saldo: (item.entrada || 0) - (item.saida || 0)
      })).sort((a, b) => {
        const dateA = periodToDate(a.period) || new Date(0);
        const dateB = periodToDate(b.period) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      }) || [];
      
      return evolutionData;
    },
    enabled: !!companyId,
  });
};

export const useLucroRealEvolutionData = (companyId: string) => {
  return useQuery({
    queryKey: ['lucro-real-evolution', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucro_real_data')
        .select(`
          period,
          entradas,
          saidas,
          servicos,
          pis,
          cofins,
          icms,
          irpj_primeiro_trimestre,
          csll_primeiro_trimestre,
          irpj_segundo_trimestre,
          csll_segundo_trimestre
        `)
        .eq('company_id', companyId)
        .order('period');
      
      if (error) throw error;
      
      // Ordenar dados por período e calcular totais
      const evolutionData = data?.map(item => {
        const entradas = Number(item.entradas) || 0;
        const saidas = Number(item.saidas) || 0;
        const servicos = Number(item.servicos) || 0;
        const pis = Number(item.pis) || 0;
        const cofins = Number(item.cofins) || 0;
        const icms = Number(item.icms) || 0;
        const irpj1 = Number(item.irpj_primeiro_trimestre) || 0;
        const csll1 = Number(item.csll_primeiro_trimestre) || 0;
        const irpj2 = Number(item.irpj_segundo_trimestre) || 0;
        const csll2 = Number(item.csll_segundo_trimestre) || 0;
        
        const totalImpostos = pis + cofins + icms + irpj1 + csll1 + irpj2 + csll2;
        
        return {
          period: item.period,
          entrada: entradas,
          saida: saidas,
          servicos: servicos,
          imposto: totalImpostos,
          pis,
          cofins,
          icms,
          irpj_primeiro_trimestre: irpj1,
          csll_primeiro_trimestre: csll1,
          irpj_segundo_trimestre: irpj2,
          csll_segundo_trimestre: csll2,
          saldo: entradas - saidas
        };
      }).sort((a, b) => {
        const dateA = periodToDate(a.period) || new Date(0);
        const dateB = periodToDate(b.period) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      }) || [];
      
      return evolutionData;
    },
    enabled: !!companyId,
  });
};

// Hook para gerenciar regimes de CNPJs
export const useCnpjRegimes = () => {
  return useQuery({
    queryKey: ['cnpj-regimes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cnpj_regimes')
        .select('cnpj, regime_tributario')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(item => ({
        cnpj: item.cnpj,
        regime: item.regime_tributario
      })) || [];
    },
  });
};

export const useSaveCnpjRegime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cnpj, regime }: {
      cnpj: string;
      regime: 'lucro_real' | 'lucro_presumido' | 'simples_nacional' | 'produtor_rural';
    }) => {
      // Verificar se já existe um regime para este CNPJ
      const { data: existingRegime } = await supabase
        .from('cnpj_regimes')
        .select('id, regime_tributario')
        .eq('cnpj', cnpj)
        .maybeSingle();

      if (existingRegime) {
        // Atualizar regime existente
        const { data, error } = await supabase
          .from('cnpj_regimes')
          .update({ regime_tributario: regime })
          .eq('id', existingRegime.id)
          .select()
          .single();

        if (error) throw error;
        return { type: 'updated', data };
      } else {
        // Criar novo regime para o CNPJ
        const { data, error } = await supabase
          .from('cnpj_regimes')
          .insert({
            cnpj,
            regime_tributario: regime
          })
          .select()
          .single();

        if (error) throw error;
        return { type: 'created', data };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnpj-regimes'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      toast({
        title: 'Regime definido',
        description: 'O regime tributário foi definido para o CNPJ.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao definir regime',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao definir o regime.',
        variant: 'destructive',
      });
    },
  });
};

export const useRemoveCnpjRegime = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cnpj: string) => {
      // Remover regime da tabela cnpj_regimes
      const { error } = await supabase
        .from('cnpj_regimes')
        .delete()
        .eq('cnpj', cnpj);

      if (error) throw error;
      return { type: 'regime_removed' };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnpj-regimes'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      toast({
        title: 'Regime removido',
        description: 'O regime tributário foi removido do CNPJ.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover regime',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao remover o regime.',
        variant: 'destructive',
      });
    },
  });
};

export const useAutoAssignRegimes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Buscar todas as empresas sem regime que têm CNPJ
      const { data: companiesWithoutRegime } = await supabase
        .from('companies')
        .select('id, name, cnpj')
        .not('cnpj', 'is', null)
        .is('regime_tributario', null);

      if (!companiesWithoutRegime || companiesWithoutRegime.length === 0) {
        return { updated: 0 };
      }

      // Buscar regimes definidos para CNPJs na nova tabela
      const { data: cnpjRegimes } = await supabase
        .from('cnpj_regimes')
        .select('cnpj, regime_tributario');

      if (!cnpjRegimes || cnpjRegimes.length === 0) {
        return { updated: 0 };
      }

      // Criar mapa de CNPJ para regime
      const regimeMap = new Map();
      cnpjRegimes.forEach(item => {
        regimeMap.set(item.cnpj, item.regime_tributario);
      });

      // Atualizar empresas que têm regime definido
      let updatedCount = 0;
      for (const company of companiesWithoutRegime) {
        const regime = regimeMap.get(company.cnpj);
        if (regime) {
          const { error } = await supabase
            .from('companies')
            .update({ regime_tributario: regime })
            .eq('id', company.id);

          if (!error) {
            updatedCount++;
          }
        }
      }

      return { updated: updatedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      
      if (result.updated > 0) {
        toast({
          title: 'Regimes aplicados',
          description: `${result.updated} empresas tiveram seus regimes aplicados automaticamente.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Erro ao aplicar regimes',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao aplicar os regimes.',
        variant: 'destructive',
      });
    },
  });
};

// Hook para buscar segmentos
export const useSegments = () => {
  return useQuery({
    queryKey: ['segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('segments')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Hook para criar segmento
export const useCreateSegment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('segments')
        .insert([{ name: name.trim() }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast({
        title: "Sucesso",
        description: "Segmento criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar segmento.",
        variant: "destructive",
      });
    },
  });
};

// Hook para deletar segmento
export const useDeleteSegment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from('segments')
        .delete()
        .eq('id', segmentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      toast({
        title: "Sucesso",
        description: "Segmento excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir segmento.",
        variant: "destructive",
      });
    },
  });
};

// Hook para buscar responsáveis
export const useResponsaveis = () => {
  return useQuery({
    queryKey: ['responsaveis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('responsaveis')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });
};

// Hook para criar responsável
export const useCreateResponsavel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from('responsaveis')
        .insert([{ nome: nome.trim() }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsaveis'] });
      toast({
        title: "Sucesso",
        description: "Responsável criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar responsável.",
        variant: "destructive",
      });
    },
  });
};

// Hook para atualizar responsável em lucro_real_data
export const useUpdateLucroRealResponsavel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ companyId, responsavelId }: { companyId: string; responsavelId: string | null }) => {
      const { data, error } = await supabase
        .from('lucro_real_data')
        .update({ responsavel_id: responsavelId })
        .eq('company_id', companyId)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      toast({
        title: "Sucesso",
        description: "Responsável atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar responsável.",
        variant: "destructive",
      });
    },
  });
};

// Hook para atualizar empresa com segmento
export const useUpdateCompanySegment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ companyId, segmento }: { companyId: string; segmento: string }) => {
      const { data, error } = await supabase
        .from('companies')
        .update({ segmento })
        .eq('id', companyId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      toast({
        title: "Sucesso",
        description: "Segmento da empresa atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar segmento da empresa.",
        variant: "destructive",
      });
    },
  });
};

export const useImportExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Array<{
      empresa: string;
      cnpj: string;
      periodo: string;
      rbt12: number | null;
      entrada: number | null;
      saida: number | null;
      imposto: number | null;
      sem_movimento?: boolean;
      segmento?: string;
    }>) => {
      // Filter out rows without essential data (only empresa is required now)
      const validRows = data.filter(row => 
        row.empresa && row.empresa.trim()
      );

      if (validRows.length === 0) {
        throw new Error('Nenhum registro válido encontrado. Verifique se a coluna Empresa está preenchida.');
      }

      // Process companies first
      const companiesMap = new Map();
      const uniqueCompanies = [];

      for (const row of validRows) {
        // Use CNPJ if available, otherwise generate a unique key from company name
        const companyKey = row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : `company_${row.empresa.trim().toLowerCase().replace(/\s+/g, '_')}`;
        
        if (!companiesMap.has(companyKey)) {
          companiesMap.set(companyKey, {
            name: row.empresa.trim(),
            cnpj: row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : null,
            sem_movimento: row.sem_movimento || false,
            segmento: row.segmento && row.segmento.trim() ? row.segmento.trim() : null,
            id: null // Will be filled after insert
          });
          uniqueCompanies.push({
            name: row.empresa.trim(),
            cnpj: row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : null,
            sem_movimento: row.sem_movimento || false,
            segmento: row.segmento && row.segmento.trim() ? row.segmento.trim() : null,
          });
        }
      }

      // Insert companies one by one to handle potential duplicates
      const companies = [];
      for (const company of uniqueCompanies) {
        // First check if company already exists
        const existingQuery = supabase
          .from('companies')
          .select('*');

        if (company.cnpj) {
          existingQuery.eq('cnpj', company.cnpj);
        } else {
          existingQuery.eq('name', company.name).is('cnpj', null);
        }

        const { data: existing } = await existingQuery.maybeSingle();

        if (existing) {
          // Update existing company with new data (including situation)
          const { data: updatedCompany, error: updateError } = await supabase
            .from('companies')
            .update({
              name: company.name,
              cnpj: company.cnpj,
              sem_movimento: company.sem_movimento
            })
            .eq('id', existing.id)
            .select()
            .single();

          if (updateError) throw updateError;
          companies.push(updatedCompany);
        } else {
          // Verificar se existe regime definido para este CNPJ
          let regime = company.regime_tributario;
          if (!regime && company.cnpj) {
            // Remover formatação do CNPJ para comparar apenas números
            const cnpjToSearch = company.cnpj.replace(/\D/g, '');
            const { data: cnpjRegime } = await supabase
              .from('cnpj_regimes')
              .select('regime_tributario')
              .eq('cnpj', cnpjToSearch)
              .maybeSingle();

            if (cnpjRegime) {
              regime = cnpjRegime.regime_tributario;
            }
          }

          const { data: newCompany, error: insertError } = await supabase
            .from('companies')
            .insert({
              ...company,
              regime_tributario: regime
            })
            .select()
            .single();

          if (insertError) throw insertError;
          companies.push(newCompany);
        }
      }

      // Create a map of company key to company ID
      const companyKeyToIdMap = new Map();
      companies?.forEach(company => {
        const companyKey = company.cnpj ? company.cnpj : `company_${company.name.toLowerCase().replace(/\s+/g, '_')}`;
        companyKeyToIdMap.set(companyKey, company.id);
      });

      // Prepare fiscal data with null/0 handling
      const fiscalDataRows = validRows.map(row => {
        const companyKey = row.cnpj && row.cnpj.trim() ? row.cnpj.trim() : `company_${row.empresa.trim().toLowerCase().replace(/\s+/g, '_')}`;
        return {
          company_id: companyKeyToIdMap.get(companyKey),
          period: row.periodo || 'Não informado',
          rbt12: row.rbt12 || 0,
          entrada: row.entrada || 0,
          saida: row.saida || 0,
          imposto: row.imposto || 0,
        };
      });

      // Insert fiscal data (using upsert to handle duplicates)
      const { error: fiscalError } = await supabase
        .from('fiscal_data')
        .upsert(fiscalDataRows, { onConflict: 'company_id,period' });

      if (fiscalError) throw fiscalError;

      return { 
        importedRecords: validRows.length,
        skippedRecords: data.length - validRows.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['companies-with-latest-data'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-stats'] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-evolution-data'] });
      
      let description = `${result.importedRecords} registros importados com sucesso.`;
      if (result.skippedRecords > 0) {
        description += ` ${result.skippedRecords} registros foram ignorados por falta de dados essenciais.`;
      }
      
      toast({
        title: 'Importação concluída',
        description,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao importar os dados. Verifique o arquivo e tente novamente.',
        variant: 'destructive',
      });
      console.error('Import error:', error);
    },
  });
};

// Lucro Real Data Hooks
export const useLucroRealData = () => {
  return useQuery({
    queryKey: ['lucro-real-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucro_real_data')
        .select(`
          *,
          companies(id, name, cnpj, segmento)
        `)
        .order('period', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCompanyWithLucroRealData = (companyId: string) => {
  return useQuery({
    queryKey: ['company-lucro-real', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          lucro_real_data(*)
        `)
        .eq('id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as CompanyWithLucroRealData | null;
    },
    enabled: !!companyId,
  });
};

export const useLucroRealDataByCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['lucro-real-data-by-company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucro_real_data')
        .select('*')
        .eq('company_id', companyId)
        .order('period', { ascending: false });
      
      if (error) throw error;
      return data as LucroRealData[];
    },
    enabled: !!companyId,
  });
};

export const useAddLucroRealData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      company_id: string;
      period: string;
      entradas?: number;
      saidas?: number;
      servicos?: number;
      pis?: number;
      cofins?: number;
      icms?: number;
      irpj_primeiro_trimestre?: number;
      csll_primeiro_trimestre?: number;
      irpj_segundo_trimestre?: number;
      csll_segundo_trimestre?: number;
      tvi?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('lucro_real_data')
        .insert({
          company_id: data.company_id,
          period: data.period.trim(),
          entradas: data.entradas || null,
          saidas: data.saidas || null,
          servicos: data.servicos || null,
          pis: data.pis || null,
          cofins: data.cofins || null,
          icms: data.icms || null,
          irpj_primeiro_trimestre: data.irpj_primeiro_trimestre || null,
          csll_primeiro_trimestre: data.csll_primeiro_trimestre || null,
          irpj_segundo_trimestre: data.irpj_segundo_trimestre || null,
          csll_segundo_trimestre: data.csll_segundo_trimestre || null,
          tvi: data.tvi || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucro-real-data'] });
      queryClient.invalidateQueries({ queryKey: ['company-lucro-real'] });
      
      toast({
        title: 'Dados de Lucro Real adicionados',
        description: 'Os dados foram cadastrados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cadastrar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateLucroRealData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      period: string;
      entradas?: number;
      saidas?: number;
      servicos?: number;
      pis?: number;
      cofins?: number;
      icms?: number;
      irpj_primeiro_trimestre?: number;
      csll_primeiro_trimestre?: number;
      irpj_segundo_trimestre?: number;
      csll_segundo_trimestre?: number;
      tvi?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('lucro_real_data')
        .update({
          period: data.period.trim(),
          entradas: data.entradas || null,
          saidas: data.saidas || null,
          servicos: data.servicos || null,
          pis: data.pis || null,
          cofins: data.cofins || null,
          icms: data.icms || null,
          irpj_primeiro_trimestre: data.irpj_primeiro_trimestre || null,
          csll_primeiro_trimestre: data.csll_primeiro_trimestre || null,
          irpj_segundo_trimestre: data.irpj_segundo_trimestre || null,
          csll_segundo_trimestre: data.csll_segundo_trimestre || null,
          tvi: data.tvi || null,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucro-real-data'] });
      queryClient.invalidateQueries({ queryKey: ['lucro-real-data-by-company'] });
      queryClient.invalidateQueries({ queryKey: ['company-lucro-real'] });
      
      toast({
        title: 'Dados de Lucro Real atualizados',
        description: 'Os dados foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteLucroRealData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lucro_real_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucro-real-data'] });
      queryClient.invalidateQueries({ queryKey: ['lucro-real-data-by-company'] });
      queryClient.invalidateQueries({ queryKey: ['company-lucro-real'] });
      
      toast({
        title: 'Dados de Lucro Real excluídos',
        description: 'Os dados foram excluídos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useImportLucroRealExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Array<{
      empresa: string;
      cnpj: string;
      periodo: string;
      entradas: number | null;
      saidas: number | null;
      servicos: number | null;
      pis: number | null;
      cofins: number | null;
      icms: number | null;
      irpj_primeiro_trimestre: number | null;
      csll_primeiro_trimestre: number | null;
      irpj_segundo_trimestre: number | null;
      csll_segundo_trimestre: number | null;
      tvi: number | null;
      segmento?: string;
    }>) => {
      const validRows = data.filter(row => 
        row.empresa && row.empresa.trim() !== ''
      );

      if (validRows.length === 0) {
        throw new Error('Nenhum dado válido encontrado. Verifique se a coluna Empresa está preenchida.');
      }

      // Process companies first
      const companiesMap = new Map<string, string>();
      
      for (const row of validRows) {
        const companyName = row.empresa.trim();
        const cnpj = row.cnpj?.replace(/\D/g, '') || null;
        
        if (!companiesMap.has(companyName)) {
          // Check if company exists
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyName)
            .maybeSingle();

          if (existingCompany) {
            companiesMap.set(companyName, existingCompany.id);
          } else {
            // Create new company with Lucro Real regime
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: companyName,
                cnpj: cnpj,
                regime_tributario: 'lucro_real',
                segmento: row.segmento?.trim() || null,
              })
              .select('id')
              .single();

            if (companyError) throw companyError;
            companiesMap.set(companyName, newCompany.id);
          }
        }
      }

      // Process lucro real data
      const lucroRealDataRows = validRows
        .filter(row => row.periodo && row.periodo.trim())
        .map(row => ({
          company_id: companiesMap.get(row.empresa.trim())!,
          period: row.periodo.trim(),
          entradas: row.entradas,
          saidas: row.saidas,
          servicos: row.servicos,
          pis: row.pis,
          cofins: row.cofins,
          icms: row.icms,
          irpj_primeiro_trimestre: row.irpj_primeiro_trimestre,
          csll_primeiro_trimestre: row.csll_primeiro_trimestre,
          irpj_segundo_trimestre: row.irpj_segundo_trimestre,
          csll_segundo_trimestre: row.csll_segundo_trimestre,
          tvi: row.tvi,
        }));

      // Insert lucro real data
      if (lucroRealDataRows.length > 0) {
        const { error: lucroRealError } = await supabase
          .from('lucro_real_data')
          .upsert(lucroRealDataRows, { onConflict: 'company_id,period' });

        if (lucroRealError) throw lucroRealError;
      }

      return { 
        importedRecords: lucroRealDataRows.length,
        skippedRecords: data.length - lucroRealDataRows.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['lucro-real-data'] });
      
      let description = `${result.importedRecords} registros de Lucro Real importados com sucesso.`;
      if (result.skippedRecords > 0) {
        description += ` ${result.skippedRecords} registros foram ignorados por falta de dados essenciais.`;
      }
      
      toast({
        title: 'Importação concluída',
        description,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro durante a importação.',
        variant: 'destructive',
      });
    },
  });
};

// Lucro Presumido Data Hooks
export interface LucroPresumidoData {
  id: string;
  company_id: string;
  period: string;
  entradas: number | null;
  saidas: number | null;
  servicos: number | null;
  pis: number | null;
  cofins: number | null;
  icms: number | null;
  irpj_primeiro_trimestre: number | null;
  csll_primeiro_trimestre: number | null;
  irpj_segundo_trimestre: number | null;
  csll_segundo_trimestre: number | null;
  tvi: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithLucroPresumidoData extends Company {
  lucro_presumido_data: LucroPresumidoData[];
}

export const useLucroPresumidoData = () => {
  return useQuery({
    queryKey: ['lucro-presumido-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucro_presumido_data')
        .select(`
          *,
          companies(id, name, cnpj, segmento)
        `)
        .order('period', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useCompanyWithLucroPresumidoData = (companyId: string) => {
  return useQuery({
    queryKey: ['company-lucro-presumido', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          lucro_presumido_data(*)
        `)
        .eq('id', companyId)
        .maybeSingle();
      
      if (error) throw error;
      return data as unknown as CompanyWithLucroPresumidoData | null;
    },
    enabled: !!companyId,
  });
};

export const useLucroPresumidoDataByCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['lucro-presumido-data-by-company', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucro_presumido_data')
        .select('*')
        .eq('company_id', companyId)
        .order('period', { ascending: false });
      
      if (error) throw error;
      return data as LucroPresumidoData[];
    },
    enabled: !!companyId,
  });
};

export const useAddLucroPresumidoData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      company_id: string;
      period: string;
      entradas?: number;
      saidas?: number;
      servicos?: number;
      pis?: number;
      cofins?: number;
      icms?: number;
      irpj_primeiro_trimestre?: number;
      csll_primeiro_trimestre?: number;
      irpj_segundo_trimestre?: number;
      csll_segundo_trimestre?: number;
      tvi?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('lucro_presumido_data')
        .insert({
          company_id: data.company_id,
          period: data.period.trim(),
          entradas: data.entradas || null,
          saidas: data.saidas || null,
          servicos: data.servicos || null,
          pis: data.pis || null,
          cofins: data.cofins || null,
          icms: data.icms || null,
          irpj_primeiro_trimestre: data.irpj_primeiro_trimestre || null,
          csll_primeiro_trimestre: data.csll_primeiro_trimestre || null,
          irpj_segundo_trimestre: data.irpj_segundo_trimestre || null,
          csll_segundo_trimestre: data.csll_segundo_trimestre || null,
          tvi: data.tvi || null,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucro-presumido-data'] });
      queryClient.invalidateQueries({ queryKey: ['company-lucro-presumido'] });
      
      toast({
        title: 'Dados de Lucro Presumido adicionados',
        description: 'Os dados foram cadastrados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cadastrar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateLucroPresumidoData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      period: string;
      entradas?: number;
      saidas?: number;
      servicos?: number;
      pis?: number;
      cofins?: number;
      icms?: number;
      irpj_primeiro_trimestre?: number;
      csll_primeiro_trimestre?: number;
      irpj_segundo_trimestre?: number;
      csll_segundo_trimestre?: number;
      tvi?: number;
    }) => {
      const { data: result, error } = await supabase
        .from('lucro_presumido_data')
        .update({
          period: data.period.trim(),
          entradas: data.entradas || null,
          saidas: data.saidas || null,
          servicos: data.servicos || null,
          pis: data.pis || null,
          cofins: data.cofins || null,
          icms: data.icms || null,
          irpj_primeiro_trimestre: data.irpj_primeiro_trimestre || null,
          csll_primeiro_trimestre: data.csll_primeiro_trimestre || null,
          irpj_segundo_trimestre: data.irpj_segundo_trimestre || null,
          csll_segundo_trimestre: data.csll_segundo_trimestre || null,
          tvi: data.tvi || null,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucro-presumido-data'] });
      queryClient.invalidateQueries({ queryKey: ['lucro-presumido-data-by-company'] });
      queryClient.invalidateQueries({ queryKey: ['company-lucro-presumido'] });
      
      toast({
        title: 'Dados de Lucro Presumido atualizados',
        description: 'Os dados foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteLucroPresumidoData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('lucro_presumido_data')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lucro-presumido-data'] });
      queryClient.invalidateQueries({ queryKey: ['lucro-presumido-data-by-company'] });
      queryClient.invalidateQueries({ queryKey: ['company-lucro-presumido'] });
      
      toast({
        title: 'Dados de Lucro Presumido excluídos',
        description: 'Os dados foram excluídos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useLucroPresumidoEvolutionData = (companyId: string) => {
  return useQuery({
    queryKey: ['lucro-presumido-evolution', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lucro_presumido_data')
        .select(`
          period,
          entradas,
          saidas,
          servicos,
          pis,
          cofins,
          icms,
          irpj_primeiro_trimestre,
          csll_primeiro_trimestre,
          irpj_segundo_trimestre,
          csll_segundo_trimestre
        `)
        .eq('company_id', companyId)
        .order('period');
      
      if (error) throw error;
      
      const evolutionData = data?.map(item => {
        const entradas = Number(item.entradas) || 0;
        const saidas = Number(item.saidas) || 0;
        const servicos = Number(item.servicos) || 0;
        const pis = Number(item.pis) || 0;
        const cofins = Number(item.cofins) || 0;
        const icms = Number(item.icms) || 0;
        const irpj1 = Number(item.irpj_primeiro_trimestre) || 0;
        const csll1 = Number(item.csll_primeiro_trimestre) || 0;
        const irpj2 = Number(item.irpj_segundo_trimestre) || 0;
        const csll2 = Number(item.csll_segundo_trimestre) || 0;
        
        const totalImpostos = pis + cofins + icms + irpj1 + csll1 + irpj2 + csll2;
        
        return {
          period: item.period,
          entrada: entradas,
          saida: saidas,
          servicos: servicos,
          imposto: totalImpostos,
          pis,
          cofins,
          icms,
          irpj_primeiro_trimestre: irpj1,
          csll_primeiro_trimestre: csll1,
          irpj_segundo_trimestre: irpj2,
          csll_segundo_trimestre: csll2,
          saldo: entradas - saidas
        };
      }).sort((a, b) => {
        const dateA = periodToDate(a.period) || new Date(0);
        const dateB = periodToDate(b.period) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      }) || [];
      
      return evolutionData;
    },
    enabled: !!companyId,
  });
};

export const useImportLucroPresumidoExcel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Array<{
      empresa: string;
      cnpj: string;
      periodo: string;
      entradas: number | null;
      saidas: number | null;
      servicos: number | null;
      pis: number | null;
      cofins: number | null;
      icms: number | null;
      irpj_primeiro_trimestre: number | null;
      csll_primeiro_trimestre: number | null;
      irpj_segundo_trimestre: number | null;
      csll_segundo_trimestre: number | null;
      tvi: number | null;
      segmento?: string;
    }>) => {
      const validRows = data.filter(row => 
        row.empresa && row.empresa.trim() !== ''
      );

      if (validRows.length === 0) {
        throw new Error('Nenhum dado válido encontrado. Verifique se a coluna Empresa está preenchida.');
      }

      // Process companies first
      const companiesMap = new Map<string, string>();
      
      for (const row of validRows) {
        const companyName = row.empresa.trim();
        const cnpj = row.cnpj?.replace(/\D/g, '') || null;
        
        if (!companiesMap.has(companyName)) {
          // Check if company exists
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('name', companyName)
            .maybeSingle();

          if (existingCompany) {
            companiesMap.set(companyName, existingCompany.id);
          } else {
            // Create new company with Lucro Presumido regime
            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({
                name: companyName,
                cnpj: cnpj,
                regime_tributario: 'lucro_presumido',
                segmento: row.segmento?.trim() || null,
              })
              .select('id')
              .single();

            if (companyError) throw companyError;
            companiesMap.set(companyName, newCompany.id);
          }
        }
      }

      // Process lucro presumido data
      const lucroPresumidoDataRows = validRows
        .filter(row => row.periodo && row.periodo.trim())
        .map(row => ({
          company_id: companiesMap.get(row.empresa.trim())!,
          period: row.periodo.trim(),
          entradas: row.entradas,
          saidas: row.saidas,
          servicos: row.servicos,
          pis: row.pis,
          cofins: row.cofins,
          icms: row.icms,
          irpj_primeiro_trimestre: row.irpj_primeiro_trimestre,
          csll_primeiro_trimestre: row.csll_primeiro_trimestre,
          irpj_segundo_trimestre: row.irpj_segundo_trimestre,
          csll_segundo_trimestre: row.csll_segundo_trimestre,
          tvi: row.tvi,
        }));

      // Insert lucro presumido data
      if (lucroPresumidoDataRows.length > 0) {
        const { error: lucroPresumidoError } = await supabase
          .from('lucro_presumido_data')
          .upsert(lucroPresumidoDataRows, { onConflict: 'company_id,period' });

        if (lucroPresumidoError) throw lucroPresumidoError;
      }

      return { 
        importedRecords: lucroPresumidoDataRows.length,
        skippedRecords: data.length - lucroPresumidoDataRows.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['lucro-presumido-data'] });
      
      let description = `${result.importedRecords} registros de Lucro Presumido importados com sucesso.`;
      if (result.skippedRecords > 0) {
        description += ` ${result.skippedRecords} registros foram ignorados por falta de dados essenciais.`;
      }
      
      toast({
        title: 'Importação concluída',
        description,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro durante a importação.',
        variant: 'destructive',
      });
    },
  });
};

// Produtor Rural hooks
export interface ProdutorRuralData {
  id: string;
  company_id: string;
  period: string;
  entradas: number | null;
  saidas: number | null;
  servicos: number | null;
  pis: number | null;
  cofins: number | null;
  icms: number | null;
  irpj_primeiro_trimestre: number | null;
  csll_primeiro_trimestre: number | null;
  irpj_segundo_trimestre: number | null;
  csll_segundo_trimestre: number | null;
  tvi: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyWithProdutorRuralData {
  id: string;
  name: string;
  cnpj: string | null;
  regime_tributario: string | null;
  sem_movimento: boolean | null;
  segmento: string | null;
  produtor_rural_data?: ProdutorRuralData[];
}

// Hook to get Produtor Rural data by company
export const useProdutorRuralDataByCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['produtor-rural-data', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtor_rural_data')
        .select('*')
        .eq('company_id', companyId)
        .order('period', { ascending: false });
      
      if (error) throw error;
      return data as ProdutorRuralData[];
    },
    enabled: !!companyId
  });
};

export const useAddProdutorRuralData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ProdutorRuralData, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('produtor_rural_data')
        .insert([data])
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-data'] });
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-evolution'] });
      
      toast({
        title: 'Dados de Produtor Rural adicionados',
        description: 'Os dados foram adicionados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateProdutorRuralData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ProdutorRuralData> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('produtor_rural_data')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-data'] });
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-evolution'] });
      
      toast({
        title: 'Dados de Produtor Rural atualizados',
        description: 'Os dados foram atualizados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteProdutorRuralData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('produtor_rural_data')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-data'] });
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-evolution'] });
      
      toast({
        title: 'Dados de Produtor Rural excluídos',
        description: 'Os dados foram excluídos com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir dados',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao excluir os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useImportProdutorRuralExcel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (dataRows: any[]) => {
      // Transform data to match the table structure
      const transformedData = dataRows.map(item => ({
        company_id: item.company_id,
        period: item.periodo,
        entradas: item.entradas ?? null,
        saidas: item.saidas ?? null,
        servicos: item.servicos ?? null,
        pis: item.pis ?? null,
        cofins: item.cofins ?? null,
        icms: item.icms ?? null,
        irpj_primeiro_trimestre: item.irpj_primeiro_trimestre ?? null,
        csll_primeiro_trimestre: item.csll_primeiro_trimestre ?? null,
        irpj_segundo_trimestre: item.irpj_segundo_trimestre ?? null,
        csll_segundo_trimestre: item.csll_segundo_trimestre ?? null,
        tvi: item.tvi ?? null
      }));
      
      const { data, error } = await supabase
        .from('produtor_rural_data')
        .insert(transformedData);
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-data'] });
      queryClient.invalidateQueries({ queryKey: ['produtor-rural-evolution'] });
      
      toast({
        title: 'Importação concluída',
        description: 'Os dados foram importados com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao importar os dados.',
        variant: 'destructive',
      });
    },
  });
};

export const useProdutorRuralEvolutionData = (companyId: string) => {
  return useQuery({
    queryKey: ['produtor-rural-evolution', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtor_rural_data')
        .select(`
          period,
          entradas,
          saidas,
          servicos,
          pis,
          cofins,
          icms,
          irpj_primeiro_trimestre,
          csll_primeiro_trimestre,
          irpj_segundo_trimestre,
          csll_segundo_trimestre
        `)
        .eq('company_id', companyId)
        .order('period');
      
      if (error) throw error;
      
      const evolutionData = data?.map(item => {
        const entradas = Number(item.entradas) || 0;
        const saidas = Number(item.saidas) || 0;
        const servicos = Number(item.servicos) || 0;
        const pis = Number(item.pis) || 0;
        const cofins = Number(item.cofins) || 0;
        const icms = Number(item.icms) || 0;
        const irpj1 = Number(item.irpj_primeiro_trimestre) || 0;
        const csll1 = Number(item.csll_primeiro_trimestre) || 0;
        const irpj2 = Number(item.irpj_segundo_trimestre) || 0;
        const csll2 = Number(item.csll_segundo_trimestre) || 0;
        
        const totalImpostos = pis + cofins + icms + irpj1 + csll1 + irpj2 + csll2;
        
        return {
          period: item.period,
          entrada: entradas,
          saida: saidas,
          servicos: servicos,
          imposto: totalImpostos,
          pis,
          cofins,
          icms,
          irpj_primeiro_trimestre: irpj1,
          csll_primeiro_trimestre: csll1,
          irpj_segundo_trimestre: irpj2,
          csll_segundo_trimestre: csll2,
          saldo: entradas - saidas
        };
      }).sort((a, b) => {
        const dateA = periodToDate(a.period) || new Date(0);
        const dateB = periodToDate(b.period) || new Date(0);
        return dateA.getTime() - dateB.getTime();
      }) || [];
      
      return evolutionData;
    },
    enabled: !!companyId,
  });
};