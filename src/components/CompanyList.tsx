import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCompaniesWithLatestFiscalData, useDeleteCompany, useAddCompany, useUpdateCompanyStatus, useUpdateCompany, useAutoAssignRegimes, useSegments, useCreateSegment, useResponsaveis, useCreateResponsavel, useUpdateFiscalDataResponsavel, useAddFiscalData } from '@/hooks/useFiscalData';
import { Search, Building2, FileText, Plus, Trash2, Edit3, CheckCircle, AlertCircle, PauseCircle, Filter, X, ArrowUpDown, Calendar, DollarSign, Lock, MoreHorizontal, Eye, Edit, AlertTriangle, Settings, UserCheck, Tag, ArrowLeft, Download, Upload, FileSpreadsheet, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CompanyOperationAuth } from './CompanyOperationAuth';
import { CompanyPasswordAuth } from './CompanyPasswordAuth';
import { LucroRealList } from './LucroRealList';
import { ResponsavelList } from './ResponsavelList';
import { useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import { periodToDate } from '@/lib/periodUtils';
import { supabase } from '@/integrations/supabase/client';

interface CompanyListProps {
  onSelectCompany: (companyId: string) => void;
  onLucroRealSelect?: () => void;
  defaultRegime?: string;
  selectedResponsavelId?: string | null;
  onResponsavelBack?: () => void;
}

interface AddCompanyForm {
  name: string;
  cnpj: string;
  segmento: string;
  regime_tributario: string;
}

interface EditCompanyForm {
  name: string;
  cnpj: string;
  segmento: string;
  regime_tributario: string;
}

interface FilterState {
  search: string;
  status: string;
  rbt12Min: string;
  rbt12Max: string;
  periodo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  regimeFiltro: string;
  segmentoFiltro: string;
  responsavelFiltro: string;
}

export const CompanyList = ({ 
  onSelectCompany, 
  onLucroRealSelect, 
  defaultRegime,
  selectedResponsavelId,
  onResponsavelBack
}: CompanyListProps) => {
  const [selectedRegime, setSelectedRegime] = useState<string | null>(defaultRegime || null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'todas',
    rbt12Min: '',
    rbt12Max: '',
    periodo: 'todos',
    sortBy: 'name',
    sortOrder: 'asc',
    regimeFiltro: 'todos',
    segmentoFiltro: 'todos',
    responsavelFiltro: 'todos'
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string; cnpj: string; segmento: string; regime_tributario: string } | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [passwordAuthCompany, setPasswordAuthCompany] = useState<{ id: string; name: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [operationAuthCompany, setOperationAuthCompany] = useState<{ id: string; name: string; operation: 'edit' | 'delete' } | null>(null);
  const [isOperationAuthModalOpen, setIsOperationAuthModalOpen] = useState(false);
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  
  // Estados para gerenciamento de segmentos na adição e edição
  const [isCreateSegmentFromEditOpen, setIsCreateSegmentFromEditOpen] = useState(false);
  const [newSegmentNameFromEdit, setNewSegmentNameFromEdit] = useState('');
  const [isCreateSegmentFromAddOpen, setIsCreateSegmentFromAddOpen] = useState(false);
  const [newSegmentNameFromAdd, setNewSegmentNameFromAdd] = useState('');
  
  // Estados para funcionalidades de importação/exportação  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Estados para gerenciamento de responsáveis
  const [responsavelModalOpen, setResponsavelModalOpen] = useState(false);
  const [selectedResponsavelCompany, setSelectedResponsavelCompany] = useState<any>(null);
  const [newResponsavelName, setNewResponsavelName] = useState('');
  
  // Efeito para lidar com a seleção de responsável
  useEffect(() => {
    if (selectedResponsavelId) {
      // Quando um responsável é selecionado, mostrar a lista de responsáveis
      setSelectedRegime('responsavel');
    }
  }, [selectedResponsavelId]);
  
  const { data: companies, isLoading } = useCompaniesWithLatestFiscalData();
  const { data: segments = [] } = useSegments();
  const { data: responsaveis = [] } = useResponsaveis();
  const deleteCompanyMutation = useDeleteCompany();
  const addCompanyMutation = useAddCompany();
  const updateCompanyMutation = useUpdateCompany();
  const updateStatusMutation = useUpdateCompanyStatus();
  const autoAssignRegimesMutation = useAutoAssignRegimes();
  const createSegmentMutation = useCreateSegment();
  const createResponsavelMutation = useCreateResponsavel();
  const updateFiscalDataResponsavelMutation = useUpdateFiscalDataResponsavel();
  const addFiscalDataMutation = useAddFiscalData();

  // Aplicar regimes automaticamente quando as empresas carregarem
  React.useEffect(() => {
    if (companies && companies.length > 0) {
      autoAssignRegimesMutation.mutate();
    }
  }, [companies?.length]);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AddCompanyForm>({
    mode: 'onChange'
  });
  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, setValue: setValueEdit, formState: { errors: editErrors } } = useForm<EditCompanyForm>({
    mode: 'onChange'
  });

  // Funções para gerenciar regimes - usando dados reais do banco de dados
  const getRegimeCompanies = (regime: string) => {
    if (!companies) return [];
    
    switch (regime) {
      case 'lucro_real':
        return companies.filter(company => company.regime_tributario === 'lucro_real');
      case 'simples_nacional':
        return companies.filter(company => company.regime_tributario === 'simples_nacional');
      default:
        return companies;
    }
  };

  // Primeiro filtrar por regime se selecionado
  const regimeFilteredCompanies = selectedRegime && selectedRegime !== 'todas' 
    ? getRegimeCompanies(selectedRegime) 
    : companies || [];
  
  const filteredAndSortedCompanies = regimeFilteredCompanies.filter(company => {
    // Filtro de busca
    const matchesSearch = filters.search === '' || 
      company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (company.cnpj && company.cnpj.includes(filters.search));
    
    // Filtro de status
    const matchesStatus = filters.status === 'todas' || 
      (filters.status === 'ativa' && !company.sem_movimento) ||
      (filters.status === 'paralizada' && company.sem_movimento) ||
      (filters.status === 'sem_movimento' && company.sem_movimento);
    
    // Filtro de RBT12
    const rbt12 = company.latest_fiscal_data?.rbt12 || 0;
    const matchesRbt12Min = filters.rbt12Min === '' || rbt12 >= parseFloat(filters.rbt12Min);
    const matchesRbt12Max = filters.rbt12Max === '' || rbt12 <= parseFloat(filters.rbt12Max);
    
    // Filtro de período
    const matchesPeriodo = filters.periodo === 'todos' || 
      (company.latest_fiscal_data?.period === filters.periodo);
    
    // Filtro de regime (para aba "todas")
    const matchesRegime = filters.regimeFiltro === 'todos' || 
      company.regime_tributario === filters.regimeFiltro;
    
    // Filtro de segmento (para aba "todas")
    const matchesSegmento = filters.segmentoFiltro === 'todos' || 
      (filters.segmentoFiltro === 'sem_segmento' && !company.segmento) ||
      company.segmento === filters.segmentoFiltro;
    
    // Filtro de responsável (para aba "todas")
    const companyResponsavel = (company as any).responsavel_id || null;
    const matchesResponsavel = filters.responsavelFiltro === 'todos' || 
      (filters.responsavelFiltro === 'sem_responsavel' && !companyResponsavel) ||
      companyResponsavel === filters.responsavelFiltro;
    
    return matchesSearch && matchesStatus && matchesRbt12Min && matchesRbt12Max && matchesPeriodo && matchesRegime && matchesSegmento && matchesResponsavel;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (filters.sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'cnpj':
        aValue = a.cnpj || '';
        bValue = b.cnpj || '';
        break;
      case 'rbt12':
        aValue = a.latest_fiscal_data?.rbt12 || 0;
        bValue = b.latest_fiscal_data?.rbt12 || 0;
        break;
      case 'entrada':
        aValue = a.latest_fiscal_data?.entrada || 0;
        bValue = b.latest_fiscal_data?.entrada || 0;
        break;
      case 'saida':
        aValue = a.latest_fiscal_data?.saida || 0;
        bValue = b.latest_fiscal_data?.saida || 0;
        break;
      case 'imposto':
        aValue = a.latest_fiscal_data?.imposto || 0;
        bValue = b.latest_fiscal_data?.imposto || 0;
        break;
      case 'periodo':
        // Converter períodos para datas para ordenação correta
        const dateA = periodToDate(a.latest_fiscal_data?.period || '') || new Date(0);
        const dateB = periodToDate(b.latest_fiscal_data?.period || '') || new Date(0);
        aValue = dateA.getTime();
        bValue = dateB.getTime();
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }
    
    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleDeleteCompany = (companyId: string, companyName: string) => {
    // Encontrar a empresa para verificar se tem senha
    const company = companies?.find(c => c.id === companyId);
    
    // Se a empresa tem senha, exigir autenticação primeiro
    if (company && hasPassword(company)) {
      setOperationAuthCompany({ id: companyId, name: companyName, operation: 'delete' });
      setIsOperationAuthModalOpen(true);
      return;
    }
    
    // Empresa sem senha - abrir modal de confirmação
    setDeleteConfirmCompany({ id: companyId, name: companyName });
    setIsDeleteConfirmModalOpen(true);
  };

  const handleAddCompany = (data: AddCompanyForm) => {
    addCompanyMutation.mutate({
      name: data.name,
      cnpj: data.cnpj || undefined,
      sem_movimento: false,
      segmento: data.segmento || undefined,
      regime_tributario: data.regime_tributario as 'lucro_real' | 'simples_nacional' || undefined,
    }, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        reset();
      }
    });
  };

  const handleEditCompany = (data: EditCompanyForm) => {
    if (!editingCompany) return;
    
    updateCompanyMutation.mutate({
      companyId: editingCompany.id,
      name: data.name,
      cnpj: data.cnpj || undefined,
      segmento: data.segmento || undefined,
      regime_tributario: data.regime_tributario as 'lucro_real' | 'simples_nacional' || undefined,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingCompany(null);
        resetEdit();
      }
    });
  };

  const openEditDialog = (company: any) => {
    // Se a empresa tem senha, exigir autenticação primeiro
    if (hasPassword(company)) {
      setOperationAuthCompany({ id: company.id, name: company.name, operation: 'edit' });
      setIsOperationAuthModalOpen(true);
      return;
    }
    
    // Empresa sem senha - abrir diretamente
    setEditingCompany({ id: company.id, name: company.name, cnpj: company.cnpj || '', segmento: company.segmento || '', regime_tributario: company.regime_tributario || '' });
    setValueEdit('name', company.name);
    setValueEdit('cnpj', company.cnpj || '');
    setValueEdit('segmento', company.segmento || '');
    setValueEdit('regime_tributario', company.regime_tributario || '');
    setIsEditDialogOpen(true);
  };

  const handleStatusClick = (company: any) => {
    setSelectedCompany({
      id: company.id,
      name: company.name,
      currentStatus: company.sem_movimento || false
    });
    setStatusModalOpen(true);
  };

  const handleStatusChange = (newStatus: 'ativa' | 'paralizada' | 'sem_movimento') => {
    if (!selectedCompany) return;

    const sem_movimento = newStatus === 'sem_movimento' || newStatus === 'paralizada';
    
    updateStatusMutation.mutate({
      companyId: selectedCompany.id,
      sem_movimento
    }, {
      onSuccess: () => {
        setStatusModalOpen(false);
        setSelectedCompany(null);
      }
    });
  };

  const getStatusDisplay = (sem_movimento: boolean) => {
    return sem_movimento ? 'SM' : 'Ativa';
  };

  const getStatusColor = (sem_movimento: boolean) => {
    return sem_movimento 
      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20' 
      : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20';
  };

  const getStatusIcon = (sem_movimento: boolean) => {
    return sem_movimento ? PauseCircle : CheckCircle;
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'todas',
      rbt12Min: '',
      rbt12Max: '',
      periodo: 'todos',
      sortBy: 'name',
      sortOrder: 'asc',
      regimeFiltro: 'todos',
      segmentoFiltro: 'todos',
      responsavelFiltro: 'todos'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search !== '') count++;
    if (filters.status !== 'todas') count++;
    if (filters.rbt12Min !== '' || filters.rbt12Max !== '') count++;
    if (filters.periodo !== 'todos') count++;
    if (filters.regimeFiltro !== 'todos') count++;
    if (filters.segmentoFiltro !== 'todos') count++;
    if (filters.responsavelFiltro !== 'todos') count++;
    return count;
  };

  const getSegmentos = () => {
    const segmentos = companies?.map(c => c.segmento).filter(Boolean) || [];
    return [...new Set(segmentos)].sort() as string[];
  };

  const getPeriodos = () => {
    const periodos = companies?.map(c => c.latest_fiscal_data?.period).filter(Boolean) || [];
    return [...new Set(periodos)].sort();
  };


  const hasPassword = (company: any) => {
    return company.company_passwords && company.company_passwords.id !== null;
  };

  const handleCompanyClick = (company: any) => {
    // Se a empresa tem senha, sempre abrir modal de autenticação
    if (hasPassword(company)) {
      setPasswordAuthCompany({ id: company.id, name: company.name });
      setIsAuthModalOpen(true);
      return;
    }
    
    // Prosseguir normalmente (empresa sem senha)
    onSelectCompany(company.id);
  };

  const handlePasswordSuccess = () => {
    if (passwordAuthCompany) {
      onSelectCompany(passwordAuthCompany.id);
    }
    setPasswordAuthCompany(null);
    setIsAuthModalOpen(false);
  };

  const handlePasswordCancel = () => {
    setPasswordAuthCompany(null);
    setIsAuthModalOpen(false);
  };

  const handleOperationAuthSuccess = () => {
    if (!operationAuthCompany) return;
    
    if (operationAuthCompany.operation === 'edit') {
      // Abrir modal de edição
      const company = companies?.find(c => c.id === operationAuthCompany.id);
      if (company) {
        setEditingCompany({ 
          id: company.id, 
          name: company.name, 
          cnpj: company.cnpj || '', 
          segmento: company.segmento || '', 
          regime_tributario: company.regime_tributario || '' 
        });
        setValueEdit('name', company.name);
        setValueEdit('cnpj', company.cnpj || '');
        setValueEdit('segmento', company.segmento || '');
        setValueEdit('regime_tributario', company.regime_tributario || '');
        setIsEditDialogOpen(true);
      }
    } else if (operationAuthCompany.operation === 'delete') {
      // Abrir modal de confirmação de exclusão
      setDeleteConfirmCompany({ id: operationAuthCompany.id, name: operationAuthCompany.name });
      setIsDeleteConfirmModalOpen(true);
    }
    
    setOperationAuthCompany(null);
    setIsOperationAuthModalOpen(false);
  };

  const handleOperationAuthCancel = () => {
    setOperationAuthCompany(null);
    setIsOperationAuthModalOpen(false);
  };

  // Função para criar segmento durante edição
  const handleCreateSegmentFromEdit = () => {
    if (!newSegmentNameFromEdit.trim()) return;
    
    createSegmentMutation.mutate(newSegmentNameFromEdit, {
      onSuccess: (data) => {
        if (!data) return;
        // Atribuir o novo segmento à empresa que está sendo editada
        setValueEdit('segmento', data.name);
        setIsCreateSegmentFromEditOpen(false);
        setNewSegmentNameFromEdit('');
      }
    });
  };

  // Função para criar segmento durante adição
  const handleCreateSegmentFromAdd = () => {
    if (!newSegmentNameFromAdd.trim()) return;
    
    createSegmentMutation.mutate(newSegmentNameFromAdd, {
      onSuccess: (data) => {
        if (!data) return;
        // Atribuir o novo segmento à empresa que está sendo adicionada
        setValue('segmento', data.name);
        setIsCreateSegmentFromAddOpen(false);
        setNewSegmentNameFromAdd('');
      }
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmCompany) {
      deleteCompanyMutation.mutate(deleteConfirmCompany.id);
      setDeleteConfirmCompany(null);
      setIsDeleteConfirmModalOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmCompany(null);
    setIsDeleteConfirmModalOpen(false);
  };

  const clearAuthentication = (companyName: string) => {
    localStorage.removeItem(`company_auth_${companyName}`);
    // Recarregar a página para atualizar o estado
    window.location.reload();
  };

  // Funções para gerenciar responsáveis
  const handleResponsavelClick = (company: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedResponsavelCompany(company);
    setResponsavelModalOpen(true);
  };

  const handleResponsavelChange = async (responsavelId: string) => {
    if (!selectedResponsavelCompany) return;

    updateFiscalDataResponsavelMutation.mutate({
      companyId: selectedResponsavelCompany.id,
      responsavelId: responsavelId === 'none' ? null : responsavelId
    }, {
      onSuccess: () => {
        setResponsavelModalOpen(false);
        setSelectedResponsavelCompany(null);
      }
    });
  };

  const handleCreateResponsavel = async () => {
    if (!newResponsavelName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome do responsável.",
        variant: "destructive",
      });
      return;
    }

    createResponsavelMutation.mutate(newResponsavelName, {
      onSuccess: (data) => {
        if (!data) return;
        setNewResponsavelName('');
        if (selectedResponsavelCompany) {
          handleResponsavelChange(data.id);
        }
      }
    });
  };

  const getResponsavelNome = (company: any) => {
    if (!company) return null;
    const responsavelId = company.responsavel_id;
    if (!responsavelId) return null;
    const responsavel = responsaveis.find((r: any) => r.id === responsavelId);
    return responsavel?.nome || null;
  };

  // Funções para gerenciar regimes
  const getRegimeLabel = (regime: string) => {
    const labels = {
      'todas': 'Todas as Empresas',
      'lucro_real': 'Normais',
      'simples_nacional': 'Simples Nacional'
    };
    return labels[regime as keyof typeof labels] || regime;
  };

  // Função para obter badge de regime com cor
  const getRegimeBadge = (regime_tributario: string | null) => {
    if (regime_tributario === 'lucro_real') {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
          Normal
        </Badge>
      );
    }
    if (regime_tributario === 'simples_nacional') {
      return (
        <Badge className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800 text-xs">
          Simples
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        N/A
      </Badge>
    );
  };

  const handleRegimeSelection = (regime: string) => {
    setSelectedRegime(regime);
    if (regime === 'lucro_real' && onLucroRealSelect) {
      onLucroRealSelect();
    }
  };

  const handleBackToRegimeSelection = () => {
    setSelectedRegime(null);
  };

  // Função para baixar template XLSX
  const downloadTemplate = () => {
    const templateData = [
      {
        'Nome da Empresa': 'Empresa Exemplo Ltda',
        'CNPJ': '12345678000195',
        'Segmento': 'Varejo',
        'Período': '2024-01',
        'RBT12': 1000000,
        'Entrada': 50000,
        'Saída': 30000,
        'Serviços': 10000,
        'Imposto': 5000,
        'Difal': 500
      },
      {
        'Nome da Empresa': 'Outra Empresa S.A.',
        'CNPJ': '98765432000123',
        'Segmento': 'Indústria',
        'Período': '2024-01',
        'RBT12': 2000000,
        'Entrada': 80000,
        'Saída': 60000,
        'Serviços': 20000,
        'Imposto': 8000,
        'Difal': 800
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Simples Nacional');
    
    XLSX.writeFile(wb, 'template_importacao_simples_nacional.xlsx');
    
    toast({
      title: "Template baixado",
      description: "O arquivo template_importacao_simples_nacional.xlsx foi baixado com sucesso.",
    });
  };

  // Função para processar arquivo importado
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length < 1) {
          toast({
            title: "Erro na importação",
            description: "O arquivo deve conter pelo menos uma linha de dados.",
            variant: "destructive",
          });
          return;
        }

        let createdCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        // Helper function to safely parse numbers
        const parseNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '') return null;
          const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        };

        // Process each row
        for (const row of jsonData as any[]) {
          try {
            const empresa = String(row['Nome da Empresa'] || row.Empresa || row.empresa || row.nome || '').trim();
            const cnpj = String(row.CNPJ || row.cnpj || '').replace(/\D/g, '').padStart(14, '0');
            const segmento = String(row.Segmento || row.segmento || '').trim();
            const periodo = String(row.Período || row.periodo || row.Periodo || '').trim();
            
            if (!empresa) continue; // Pular linhas sem nome de empresa

            let companyId: string;
            let isNewCompany = false;

            // Check if company already exists by CNPJ
            if (cnpj) {
              const { data: existingCompany } = await supabase
                .from('companies')
                .select('id')
                .eq('cnpj', cnpj)
                .maybeSingle();

              if (existingCompany) {
                companyId = existingCompany.id;
              } else {
                isNewCompany = true;
              }
            } else {
              isNewCompany = true;
            }

            // Create company if it doesn't exist
            if (isNewCompany) {
              const companyResult = await addCompanyMutation.mutateAsync({
                name: empresa,
                cnpj: cnpj || undefined,
                sem_movimento: false,
                segmento: segmento || undefined,
                regime_tributario: 'simples_nacional',
              });
              companyId = companyResult.id;
              createdCount++;
            } else {
              updatedCount++;
            }

            // If fiscal data columns exist, import fiscal data
            if (periodo && companyId) {
              const fiscalData = {
                company_id: companyId,
                period: periodo,
                rbt12: parseNumber(row.RBT12 || row.rbt12) || 0,
                entrada: parseNumber(row.Entrada || row.entrada) || 0,
                saida: parseNumber(row.Saída || row.saída || row.saida || row.Saida) || 0,
                servicos: parseNumber(row.Serviços || row.servicos || row.Servicos) || 0,
                imposto: parseNumber(row.Imposto || row.imposto) || 0,
                difal: parseNumber(row.Difal || row.difal || row.DIFAL) || 0,
              };

              await addFiscalDataMutation.mutateAsync(fiscalData);
            }

          } catch (error) {
            errorCount++;
            console.error('Erro ao processar linha:', error);
          }
        }

        // Build success message
        const messages = [];
        if (createdCount > 0) {
          messages.push(`${createdCount} ${createdCount === 1 ? 'empresa criada' : 'empresas criadas'}`);
        }
        if (updatedCount > 0) {
          messages.push(`${updatedCount} ${updatedCount === 1 ? 'empresa atualizada' : 'empresas atualizadas'}`);
        }
        
        const description = messages.length > 0 
          ? `${messages.join(', ')}${errorCount > 0 ? `. ${errorCount} ${errorCount === 1 ? 'erro encontrado' : 'erros encontrados'}.` : '.'}`
          : `Nenhuma empresa foi processada${errorCount > 0 ? `. ${errorCount} ${errorCount === 1 ? 'erro encontrado' : 'erros encontrados'}.` : '.'}`;

        toast({
          title: "Importação concluída",
          description,
          variant: errorCount > 0 && createdCount === 0 && updatedCount === 0 ? "destructive" : "default",
        });

      } catch (error) {
        toast({
          title: "Erro ao processar arquivo",
          description: "Verifique se o arquivo está no formato correto.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    // Limpar o input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Tela inicial de seleção de regime
  if (!selectedRegime) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Empresas
          </h1>
          <p className="text-muted-foreground">
            Selecione o regime tributário para visualizar as empresas correspondentes
          </p>
        </div>

        {/* Cards de seleção de regime */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { id: 'todas', label: 'Todas as Empresas', description: 'Visualizar todas as empresas', icon: Building2, color: 'cyan' },
            { id: 'lucro_real', label: 'Normais', description: 'Empresas do regime Normal', icon: FileText, color: 'green' },
            { id: 'simples_nacional', label: 'Simples Nacional', description: 'Empresas do regime Simples Nacional', icon: FileText, color: 'purple' },
            { id: 'responsavel', label: 'Por Responsável', description: 'Empresas agrupadas por responsável', icon: User, color: 'blue' }
          ].map((regime) => {
            const IconComponent = regime.icon;
            const companyCount = regime.id === 'responsavel' ? 0 : 
              regime.id === 'todas' ? (companies?.length || 0) : getRegimeCompanies(regime.id).length;
            
            // Get color classes dynamically
            const bgColorClass = `p-3 rounded-lg ${
              regime.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
              regime.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
              regime.color === 'orange' ? 'bg-orange-100 dark:bg-orange-900/20' :
              regime.color === 'cyan' ? 'bg-cyan-100 dark:bg-cyan-900/20' :
              'bg-blue-100 dark:bg-blue-900/20'
            }`;
            
            const textColorClass = `${
              regime.color === 'green' ? 'text-green-600 dark:text-green-400' :
              regime.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
              regime.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
              regime.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
              'text-blue-600 dark:text-blue-400'
            }`;
            
            return (
              <Card 
                key={regime.id} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-primary/50"
                onClick={() => handleRegimeSelection(regime.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={bgColorClass}>
                      <IconComponent className={`h-6 w-6 ${textColorClass}`} />
                    </div>
                    {regime.id !== 'responsavel' && (
                      <Badge variant="secondary" className="text-sm">
                        {companyCount} empresa{companyCount !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">{regime.label}</h3>
                  <p className="text-sm text-muted-foreground">{regime.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Estatísticas gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resumo Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-600">{companies?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{getRegimeCompanies('lucro_real').length}</p>
                <p className="text-sm text-muted-foreground">Normais</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{getRegimeCompanies('simples_nacional').length}</p>
                <p className="text-sm text-muted-foreground">Simples Nacional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se o regime selecionado for "responsavel", mostrar o ResponsavelList
  if (selectedRegime === 'responsavel') {
    return (
      <ResponsavelList 
        onSelectCompany={onSelectCompany} 
        onBack={handleBackToRegimeSelection} 
        onLucroRealSelect={onLucroRealSelect}
        defaultResponsavelId={selectedResponsavelId || undefined}
      />
    );
  }

  // Se o regime selecionado for "lucro_real", mostrar o LucroRealList
  if (selectedRegime === 'lucro_real') {
    return <LucroRealList onSelectCompany={onSelectCompany} onBack={handleBackToRegimeSelection} />;
  }

  return (
    <div className="space-y-6">
      <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToRegimeSelection}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                {getRegimeLabel(selectedRegime)} ({filteredAndSortedCompanies?.length || 0})
              </CardTitle>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Botão para baixar template */}
            <Button
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template
            </Button>

            {/* Input oculto para importar arquivo */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />

            {/* Botão para importar planilha */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Planilha
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Empresa
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Empresa</DialogTitle>
                <DialogDescription>
                  Preencha os dados da empresa que deseja cadastrar.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleAddCompany)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Nome da empresa é obrigatório' })}
                    placeholder="Digite o nome da empresa"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    {...register('cnpj')}
                    placeholder="00.000.000/0000-00 (opcional)"
                    maxLength={18}
                  />
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="segmento">Segmento</Label>
                   <Select onValueChange={(value) => {
                     if (value === 'create_new_segment') {
                       setIsCreateSegmentFromAddOpen(true);
                     } else {
                       setValue('segmento', value === 'none' ? '' : value);
                     }
                   }}>
                     <SelectTrigger>
                       <SelectValue placeholder="Selecionar segmento" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="none">Sem segmento</SelectItem>
                       {segments.map((segment) => (
                         <SelectItem key={segment.id} value={segment.name}>
                           {segment.name}
                         </SelectItem>
                       ))}
                       <Separator />
                       <SelectItem value="create_new_segment" className="text-primary">
                         <div className="flex items-center gap-2">
                           <Plus className="h-4 w-4" />
                           Criar novo segmento
                         </div>
                       </SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="regime_tributario">Regime Tributário</Label>
                  <Select onValueChange={(value) => setValue('regime_tributario', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o regime tributário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lucro_real">Normais</SelectItem>
                      <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={addCompanyMutation.isPending}
                  >
                    {addCompanyMutation.isPending ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          {/* Barra de busca e filtros principais */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por empresa ou CNPJ..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as situações</SelectItem>
                  <SelectItem value="ativa">Ativas</SelectItem>
                  <SelectItem value="paralizada">Paralizadas</SelectItem>
                  <SelectItem value="sem_movimento">Sem Movimento</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="cnpj">CNPJ</SelectItem>
                  <SelectItem value="rbt12">RBT12</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="imposto">Imposto</SelectItem>
                  <SelectItem value="periodo">Período</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              
              <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {getActiveFiltersCount() > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                        {getActiveFiltersCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtros Avançados</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-8 px-2 text-xs"
                      >
                        Limpar tudo
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">RBT12 (R$)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            placeholder="Mínimo"
                            value={filters.rbt12Min}
                            onChange={(e) => updateFilter('rbt12Min', e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Máximo"
                            value={filters.rbt12Max}
                            onChange={(e) => updateFilter('rbt12Max', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Período</Label>
                        <Select value={filters.periodo} onValueChange={(value) => updateFilter('periodo', value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Selecionar período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos os períodos</SelectItem>
                            {getPeriodos().map(periodo => (
                              <SelectItem key={periodo} value={periodo}>{periodo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Indicadores de filtros ativos */}
          {getActiveFiltersCount() > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {filters.search}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('search', '')}
                  />
                </Badge>
              )}
              {filters.status !== 'todas' && (
                <Badge variant="secondary" className="gap-1">
                  Status: {
                    filters.status === 'ativa' ? 'Ativas' : 
                    filters.status === 'paralizada' ? 'Paralizadas' : 
                    'Sem Movimento'
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('status', 'todas')}
                  />
                </Badge>
              )}
              {(filters.rbt12Min || filters.rbt12Max) && (
                <Badge variant="secondary" className="gap-1">
                  RBT12: {filters.rbt12Min || '0'} - {filters.rbt12Max || '∞'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => {
                      updateFilter('rbt12Min', '');
                      updateFilter('rbt12Max', '');
                    }}
                  />
                </Badge>
              )}
              {filters.periodo !== 'todos' && (
                <Badge variant="secondary" className="gap-1">
                  Período: {filters.periodo}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('periodo', 'todos')}
                  />
                </Badge>
              )}
              {filters.regimeFiltro !== 'todos' && (
                <Badge variant="secondary" className="gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Regime: {filters.regimeFiltro === 'lucro_real' ? 'Normal' : 'Simples Nacional'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('regimeFiltro', 'todos')}
                  />
                </Badge>
              )}
              {filters.segmentoFiltro !== 'todos' && (
                <Badge variant="secondary" className="gap-1">
                  Segmento: {filters.segmentoFiltro === 'sem_segmento' ? 'Sem Segmento' : filters.segmentoFiltro}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('segmentoFiltro', 'todos')}
                  />
                </Badge>
              )}
              {filters.responsavelFiltro !== 'todos' && (
                <Badge variant="secondary" className="gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  Responsável: {filters.responsavelFiltro === 'sem_responsavel' ? 'Sem Responsável' : responsaveis.find(r => r.id === filters.responsavelFiltro)?.nome || filters.responsavelFiltro}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => updateFilter('responsavelFiltro', 'todos')}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/50 backdrop-blur-sm">
                <TableHead className="border-r border-border font-semibold text-foreground w-8 text-center">#</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground min-w-0 flex-1">Nome da Empresa</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">CNPJ</TableHead>
                {selectedRegime === 'todas' && (
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden md:table-cell">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-auto p-0 font-semibold hover:bg-transparent ${filters.regimeFiltro !== 'todos' ? 'text-primary' : ''}`}
                        >
                          Regime
                          <Filter className={`h-3 w-3 ml-1 ${filters.regimeFiltro !== 'todos' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-1">
                          <Button
                            variant={filters.regimeFiltro === 'todos' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('regimeFiltro', 'todos')}
                          >
                            Todos os Regimes
                          </Button>
                          <Button
                            variant={filters.regimeFiltro === 'lucro_real' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('regimeFiltro', 'lucro_real')}
                          >
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                            Normal
                          </Button>
                          <Button
                            variant={filters.regimeFiltro === 'simples_nacional' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('regimeFiltro', 'simples_nacional')}
                          >
                            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                            Simples Nacional
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                )}
                <TableHead className="border-r border-border font-semibold text-foreground w-28 hidden lg:table-cell">
                  {selectedRegime === 'todas' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-auto p-0 font-semibold hover:bg-transparent ${filters.segmentoFiltro !== 'todos' ? 'text-primary' : ''}`}
                        >
                          Segmento
                          <Filter className={`h-3 w-3 ml-1 ${filters.segmentoFiltro !== 'todos' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 max-h-64 overflow-y-auto" align="start">
                        <div className="space-y-1">
                          <Button
                            variant={filters.segmentoFiltro === 'todos' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('segmentoFiltro', 'todos')}
                          >
                            Todos os Segmentos
                          </Button>
                          <Button
                            variant={filters.segmentoFiltro === 'sem_segmento' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('segmentoFiltro', 'sem_segmento')}
                          >
                            Sem Segmento
                          </Button>
                          <Separator className="my-1" />
                          {getSegmentos().map((segmento) => (
                            <Button
                              key={segmento}
                              variant={filters.segmentoFiltro === segmento ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => updateFilter('segmentoFiltro', segmento)}
                            >
                              {segmento}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    'Segmento'
                  )}
                </TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">
                  {selectedRegime === 'todas' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-auto p-0 font-semibold hover:bg-transparent ${filters.periodo !== 'todos' ? 'text-primary' : ''}`}
                        >
                          Período
                          <Filter className={`h-3 w-3 ml-1 ${filters.periodo !== 'todos' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 max-h-64 overflow-y-auto" align="start">
                        <div className="space-y-1">
                          <Button
                            variant={filters.periodo === 'todos' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('periodo', 'todos')}
                          >
                            Todos os Períodos
                          </Button>
                          <Separator className="my-1" />
                          {getPeriodos().map((periodo) => (
                            <Button
                              key={periodo}
                              variant={filters.periodo === periodo ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => updateFilter('periodo', periodo)}
                            >
                              {periodo}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    'Período'
                  )}
                </TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">RBT12</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Entrada</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Saída</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">Imposto</TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-28 hidden lg:table-cell">
                  {selectedRegime === 'todas' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-auto p-0 font-semibold hover:bg-transparent ${filters.responsavelFiltro !== 'todos' ? 'text-primary' : ''}`}
                        >
                          Responsável
                          <Filter className={`h-3 w-3 ml-1 ${filters.responsavelFiltro !== 'todos' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2 max-h-64 overflow-y-auto" align="start">
                        <div className="space-y-1">
                          <Button
                            variant={filters.responsavelFiltro === 'todos' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('responsavelFiltro', 'todos')}
                          >
                            Todos os Responsáveis
                          </Button>
                          <Button
                            variant={filters.responsavelFiltro === 'sem_responsavel' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('responsavelFiltro', 'sem_responsavel')}
                          >
                            Sem Responsável
                          </Button>
                          <Separator className="my-1" />
                          {responsaveis.map((resp) => (
                            <Button
                              key={resp.id}
                              variant={filters.responsavelFiltro === resp.id ? 'secondary' : 'ghost'}
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => updateFilter('responsavelFiltro', resp.id)}
                            >
                              {resp.nome}
                            </Button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    'Responsável'
                  )}
                </TableHead>
                <TableHead className="border-r border-border font-semibold text-foreground w-24">
                  {selectedRegime === 'todas' ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`h-auto p-0 font-semibold hover:bg-transparent ${filters.status !== 'todas' ? 'text-primary' : ''}`}
                        >
                          Situação
                          <Filter className={`h-3 w-3 ml-1 ${filters.status !== 'todas' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2" align="start">
                        <div className="space-y-1">
                          <Button
                            variant={filters.status === 'todas' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('status', 'todas')}
                          >
                            Todas as Situações
                          </Button>
                          <Button
                            variant={filters.status === 'ativa' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('status', 'ativa')}
                          >
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                            Ativas
                          </Button>
                          <Button
                            variant={filters.status === 'sem_movimento' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => updateFilter('status', 'sem_movimento')}
                          >
                            <span className="w-2 h-2 rounded-full bg-orange-500 mr-2" />
                            Sem Movimento
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    'Situação'
                  )}
                </TableHead>
                <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCompanies?.map((company, index) => (
                <TableRow 
                  key={company.id}
                  className="cursor-pointer hover:bg-accent transition-colors border-b border-border bg-muted/30"
                  onClick={() => handleCompanyClick(company)}
                >
                  <TableCell className="border-r border-border text-center text-muted-foreground font-mono text-sm w-8">
                    {index + 1}
                  </TableCell>
                  <TableCell className="border-r border-border font-medium text-foreground min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="truncate">{company.name}</span>
                      {hasPassword(company) && (
                        <div className="flex items-center gap-1">
                          <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-border text-foreground w-24 hidden sm:table-cell">
                    <span className="truncate block text-xs">
                      {company.cnpj 
                        ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                        : 'N/A'
                      }
                    </span>
                  </TableCell>
                  {selectedRegime === 'todas' && (
                    <TableCell className="border-r border-border text-foreground w-20 hidden md:table-cell">
                      {getRegimeBadge(company.regime_tributario)}
                    </TableCell>
                  )}
                  <TableCell className="border-r border-border text-foreground w-24 hidden lg:table-cell">
                    <span className="truncate block text-xs">
                      {company.segmento || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-foreground w-24 hidden sm:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.period || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-foreground w-20 hidden md:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.rbt12 ? 
                        company.latest_fiscal_data.rbt12.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-green-600 dark:text-green-400 font-medium w-20 hidden lg:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.entrada ? 
                        company.latest_fiscal_data.entrada.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-red-600 dark:text-red-400 font-medium w-20 hidden lg:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.saida ? 
                        company.latest_fiscal_data.saida.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell className="border-r border-border text-right text-orange-600 dark:text-orange-400 font-medium w-20 hidden xl:table-cell">
                    <span className="truncate block text-xs">
                      {hasPassword(company) ? (
                        <span className="text-muted-foreground">***</span>
                      ) : company.latest_fiscal_data?.imposto ? 
                        company.latest_fiscal_data.imposto.toLocaleString('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }) : 'N/A'
                      }
                    </span>
                  </TableCell>
                  <TableCell 
                    className="border-r border-border text-foreground w-24 hidden lg:table-cell cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={(e) => handleResponsavelClick(company, e)}
                    title="Clique para selecionar ou criar responsável"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="truncate block text-xs">
                        {getResponsavelNome(company) || 'Selecionar'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="border-r border-border text-center w-24">
                    <div
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 ${getStatusColor(company.sem_movimento || false)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusClick(company);
                      }}
                      title="Clique para alterar a situação (SM = Sem Movimento)"
                    >
                      {(() => {
                        const IconComponent = getStatusIcon(company.sem_movimento || false);
                        return <IconComponent className="h-3 w-3 mr-1.5" />;
                      })()}
                      {getStatusDisplay(company.sem_movimento || false)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center w-12">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(company);
                        }}
                        title="Editar empresa"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company.id, company.name);
                        }}
                        title="Excluir empresa"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedCompanies?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={selectedRegime === 'todas' ? 13 : 12} className="text-center py-8 text-muted-foreground border-b border-border">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma empresa encontrada</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    {/* Modal de Seleção de Situação */}
    <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Alterar Situação da Empresa
          </DialogTitle>
          <DialogDescription>
            Selecione a nova situação para <strong>{selectedCompany?.name}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          {/* Opção Ativa */}
          <div
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCompany?.currentStatus === false
                ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
            }`}
            onClick={() => handleStatusChange('ativa')}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedCompany?.currentStatus === false ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <CheckCircle className={`h-5 w-5 ${selectedCompany?.currentStatus === false ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-medium text-green-700 dark:text-green-300">Ativa</h4>
                <p className="text-sm text-green-600 dark:text-green-400">Empresa em funcionamento normal</p>
              </div>
            </div>
          </div>

          {/* Opção Paralisada */}
          <div
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCompany?.currentStatus === true
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
            }`}
            onClick={() => handleStatusChange('paralizada')}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedCompany?.currentStatus === true ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <AlertCircle className={`h-5 w-5 ${selectedCompany?.currentStatus === true ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-medium text-orange-700 dark:text-orange-300">Paralisada</h4>
                <p className="text-sm text-orange-600 dark:text-orange-400">Empresa temporariamente paralisada</p>
              </div>
            </div>
          </div>

          {/* Opção Sem Movimento */}
          <div
            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedCompany?.currentStatus === true
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
            }`}
            onClick={() => handleStatusChange('sem_movimento')}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${selectedCompany?.currentStatus === true ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                <PauseCircle className={`h-5 w-5 ${selectedCompany?.currentStatus === true ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-300">Sem Movimento</h4>
                <p className="text-sm text-red-600 dark:text-red-400">Empresa sem atividade fiscal</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setStatusModalOpen(false)}
            disabled={updateStatusMutation.isPending}
          >
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Edição da Empresa */}
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>
            Altere os dados da empresa.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleEditSubmit(handleEditCompany)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome da Empresa *</Label>
            <Input
              id="edit-name"
              {...registerEdit('name', { required: 'Nome da empresa é obrigatório' })}
              placeholder="Digite o nome da empresa"
            />
            {editErrors.name && (
              <p className="text-sm text-destructive">{editErrors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-cnpj">CNPJ</Label>
            <Input
              id="edit-cnpj"
              {...registerEdit('cnpj')}
              placeholder="00.000.000/0000-00 (opcional)"
              maxLength={18}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-segmento">Segmento</Label>
            <Select
              value={editingCompany?.segmento || 'none'}
              onValueChange={(value) => {
                if (value === 'create_new_segment') {
                  setIsCreateSegmentFromEditOpen(true);
                } else {
                  setValueEdit('segmento', value === 'none' ? '' : value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem segmento</SelectItem>
                {segments.map((segment) => (
                  <SelectItem key={segment.id} value={segment.name}>
                    {segment.name}
                  </SelectItem>
                ))}
                <Separator />
                <SelectItem value="create_new_segment" className="text-primary">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Criar novo segmento
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-regime">Regime Tributário</Label>
            <Select 
              value={editingCompany?.regime_tributario || ''}
              onValueChange={(value) => setValueEdit('regime_tributario', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o regime tributário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="lucro_real">Normais</SelectItem>
                <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCompany(null);
                resetEdit();
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Modal de autenticação por senha */}
    <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Acesso Restrito
          </DialogTitle>
          <DialogDescription>
            Esta empresa requer senha para visualizar os dados
          </DialogDescription>
        </DialogHeader>
        {passwordAuthCompany && (
          <CompanyPasswordAuth
            companyName={passwordAuthCompany.name}
            companyId={passwordAuthCompany.id}
            onSuccess={handlePasswordSuccess}
            onCancel={handlePasswordCancel}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Modal de autenticação para operações sensíveis */}
    <Dialog open={isOperationAuthModalOpen} onOpenChange={setIsOperationAuthModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Operação Protegida
          </DialogTitle>
          <DialogDescription>
            Esta operação requer confirmação de senha
          </DialogDescription>
        </DialogHeader>
        {operationAuthCompany && (
          <CompanyOperationAuth
            companyName={operationAuthCompany.name}
            companyId={operationAuthCompany.id}
            operation={operationAuthCompany.operation}
            onSuccess={handleOperationAuthSuccess}
            onCancel={handleOperationAuthCancel}
          />
        )}
      </DialogContent>
    </Dialog>

    {/* Modal de confirmação de exclusão */}
    <AlertDialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a empresa <strong>"{deleteConfirmCompany?.name}"</strong>?
            <br /><br />
            Esta ação também removerá:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Todos os dados fiscais associados</li>
              <li>Histórico de períodos</li>
              <li>Configurações de senha (se houver)</li>
            </ul>
            <br />
            <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelDelete}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteCompanyMutation.isPending}
          >
            {deleteCompanyMutation.isPending ? 'Excluindo...' : 'Excluir Empresa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    {/* Dialog para criar novo segmento durante edição */}
    <Dialog open={isCreateSegmentFromEditOpen} onOpenChange={setIsCreateSegmentFromEditOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Criar Novo Segmento
          </DialogTitle>
          <DialogDescription>
            Digite o nome do novo segmento que será atribuído à empresa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newSegmentNameFromEdit">Nome do Segmento</Label>
            <Input
              id="newSegmentNameFromEdit"
              placeholder="Ex: Varejo, Indústria, Serviços..."
              value={newSegmentNameFromEdit}
              onChange={(e) => setNewSegmentNameFromEdit(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newSegmentNameFromEdit.trim()) {
                  handleCreateSegmentFromEdit();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateSegmentFromEditOpen(false);
              setNewSegmentNameFromEdit('');
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSegmentFromEdit}
            disabled={!newSegmentNameFromEdit.trim() || createSegmentMutation.isPending}
            className="min-w-[120px]"
          >
            {createSegmentMutation.isPending ? 'Criando...' : 'Criar e Atribuir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    {/* Dialog para criar novo segmento durante adição */}
    <Dialog open={isCreateSegmentFromAddOpen} onOpenChange={setIsCreateSegmentFromAddOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Criar Novo Segmento
          </DialogTitle>
          <DialogDescription>
            Digite o nome do novo segmento que será atribuído à nova empresa.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newSegmentNameFromAdd">Nome do Segmento</Label>
            <Input
              id="newSegmentNameFromAdd"
              placeholder="Ex: Varejo, Indústria, Serviços..."
              value={newSegmentNameFromAdd}
              onChange={(e) => setNewSegmentNameFromAdd(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newSegmentNameFromAdd.trim()) {
                  handleCreateSegmentFromAdd();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateSegmentFromAddOpen(false);
              setNewSegmentNameFromAdd('');
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreateSegmentFromAdd}
            disabled={!newSegmentNameFromAdd.trim() || createSegmentMutation.isPending}
            className="min-w-[120px]"
          >
            {createSegmentMutation.isPending ? 'Criando...' : 'Criar e Atribuir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal de Seleção de Responsável */}
    <Dialog open={responsavelModalOpen} onOpenChange={setResponsavelModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Selecionar Responsável
          </DialogTitle>
          <DialogDescription>
            Selecione um responsável existente ou crie um novo para <strong>{selectedResponsavelCompany?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select
              value={getResponsavelNome(selectedResponsavelCompany) || 'none'}
              onValueChange={handleResponsavelChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {responsaveis.map((responsavel: any) => (
                  <SelectItem key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="newResponsavel">Criar Novo Responsável</Label>
            <div className="flex gap-2">
              <Input
                id="newResponsavel"
                placeholder="Nome do responsável"
                value={newResponsavelName}
                onChange={(e) => setNewResponsavelName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newResponsavelName.trim()) {
                    handleCreateResponsavel();
                  }
                }}
              />
              <Button
                onClick={handleCreateResponsavel}
                disabled={!newResponsavelName.trim() || createResponsavelMutation.isPending}
              >
                {createResponsavelMutation.isPending ? 'Criando...' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setResponsavelModalOpen(false);
              setSelectedResponsavelCompany(null);
              setNewResponsavelName('');
            }}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
  );
};