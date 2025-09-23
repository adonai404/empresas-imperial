import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Building2, Plus, FileText, Calendar, Upload, Download, Search, Filter, X, ArrowUpDown, Lock, Edit3, Trash2 } from 'lucide-react';
import { useLucroRealData, useAddLucroRealData, useCompanies, useImportLucroRealExcel, useDeleteCompany } from '@/hooks/useFiscalData';
import { CompanyPasswordAuth } from './CompanyPasswordAuth';
import { CompanyOperationAuth } from './CompanyOperationAuth';
import * as XLSX from 'xlsx';

interface FilterState {
  search: string;
  periodo: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface LucroRealListProps {
  onSelectCompany?: (companyId: string) => void;
}

export const LucroRealList = ({ onSelectCompany }: LucroRealListProps) => {
  const [selectedRegime, setSelectedRegime] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    periodo: 'todos',
    sortBy: 'empresa',
    sortOrder: 'asc'
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [passwordAuthCompany, setPasswordAuthCompany] = useState<{ id: string; name: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [operationAuthCompany, setOperationAuthCompany] = useState<{ id: string; name: string; operation: 'delete' } | null>(null);
  const [isOperationAuthModalOpen, setIsOperationAuthModalOpen] = useState(false);
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [newData, setNewData] = useState({
    company_id: '',
    period: '',
    entradas: '',
    saidas: '',
    pis: '',
    cofins: '',
    icms: '',
    irpj_primeiro_trimestre: '',
    csll_primeiro_trimestre: '',
    irpj_segundo_trimestre: '',
    csll_segundo_trimestre: '',
  });

  const { data: lucroRealData, isLoading } = useLucroRealData();
  const { data: companies } = useCompanies();
  const addMutation = useAddLucroRealData();
  const importMutation = useImportLucroRealExcel();
  const deleteCompanyMutation = useDeleteCompany();

  // Funções para gerenciar regimes
  const getRegimeCompanies = (regime: string) => {
    if (!companies) return [];
    
    switch (regime) {
      case 'todas':
        return companies;
      case 'lucro_real':
        return companies.filter(company => company.regime_tributario === 'lucro_real');
      case 'lucro_presumido':
        return companies.filter(company => company.regime_tributario === 'lucro_presumido');
      case 'simples_nacional':
        return companies.filter(company => company.regime_tributario === 'simples_nacional');
      case 'mei':
        return companies.filter(company => company.regime_tributario === 'mei');
      case 'normais':
        return companies.filter(company => 
          company.regime_tributario === 'lucro_real' || 
          company.regime_tributario === 'lucro_presumido'
        );
      default:
        return companies;
    }
  };

  // Filtrar dados de lucro real baseado no regime selecionado e filtros
  const regimeFilteredCompanies = selectedRegime ? getRegimeCompanies(selectedRegime) : companies || [];
  
  const filteredAndSortedData = lucroRealData?.filter(item => {
    const company = companies?.find(c => c.id === item.company_id);
    if (!company) return false;
    
    // Verificar se a empresa está no regime selecionado
    const isInSelectedRegime = !selectedRegime || regimeFilteredCompanies.some(c => c.id === company.id);
    if (!isInSelectedRegime) return false;
    
    // Filtro de busca
    const matchesSearch = filters.search === '' || 
      company.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (company.cnpj && company.cnpj.includes(filters.search));
    
    // Filtro de período
    const matchesPeriodo = filters.periodo === 'todos' || item.period === filters.periodo;
    
    return matchesSearch && matchesPeriodo;
  }).sort((a, b) => {
    const companyA = companies?.find(c => c.id === a.company_id);
    const companyB = companies?.find(c => c.id === b.company_id);
    
    let aValue: any, bValue: any;
    
    switch (filters.sortBy) {
      case 'empresa':
        aValue = companyA?.name?.toLowerCase() || '';
        bValue = companyB?.name?.toLowerCase() || '';
        break;
      case 'cnpj':
        aValue = companyA?.cnpj || '';
        bValue = companyB?.cnpj || '';
        break;
      case 'periodo':
        aValue = a.period || '';
        bValue = b.period || '';
        break;
      case 'entradas':
        aValue = a.entradas || 0;
        bValue = b.entradas || 0;
        break;
      case 'saidas':
        aValue = a.saidas || 0;
        bValue = b.saidas || 0;
        break;
      default:
        aValue = companyA?.name?.toLowerCase() || '';
        bValue = companyB?.name?.toLowerCase() || '';
    }
    
    if (filters.sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      periodo: 'todos',
      sortBy: 'empresa',
      sortOrder: 'asc'
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search !== '') count++;
    if (filters.periodo !== 'todos') count++;
    return count;
  };

  const getPeriodos = () => {
    const periodos = lucroRealData?.map(item => item.period).filter(Boolean) || [];
    return [...new Set(periodos)].sort();
  };

  const getRegimeLabel = (regime: string) => {
    const labels = {
      'todas': 'Todas as empresas',
      'lucro_real': 'Lucro Real',
      'lucro_presumido': 'Lucro Presumido',
      'simples_nacional': 'Simples Nacional',
      'normais': 'Normais (Lucro Real + Lucro Presumido)'
    };
    return labels[regime as keyof typeof labels] || regime;
  };

  const handleRegimeSelection = (regime: string) => {
    setSelectedRegime(regime);
  };

  const handleBackToRegimeSelection = () => {
    setSelectedRegime(null);
  };

  const handleCompanyClick = (company: any) => {
    // Se a empresa tem senha, sempre abrir modal de autenticação
    if (hasPassword(company)) {
      setPasswordAuthCompany({ id: company.id, name: company.name });
      setIsAuthModalOpen(true);
      return;
    }
    
    // Prosseguir normalmente (empresa sem senha)
    if (onSelectCompany) {
      onSelectCompany(company.id);
    }
  };

  const hasPassword = (company: any) => {
    return company?.company_passwords && company.company_passwords.id !== null;
  };

  const handlePasswordSuccess = () => {
    if (passwordAuthCompany && onSelectCompany) {
      onSelectCompany(passwordAuthCompany.id);
    }
    setPasswordAuthCompany(null);
    setIsAuthModalOpen(false);
  };

  const handlePasswordCancel = () => {
    setPasswordAuthCompany(null);
    setIsAuthModalOpen(false);
  };

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

  const handleOperationAuthSuccess = () => {
    if (!operationAuthCompany) return;
    
    if (operationAuthCompany.operation === 'delete') {
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

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newData.company_id || !newData.period.trim()) {
      alert('Empresa e período são campos obrigatórios');
      return;
    }

    const dataToSubmit = {
      company_id: newData.company_id,
      period: newData.period.trim(),
      entradas: newData.entradas ? parseFloat(newData.entradas) : undefined,
      saidas: newData.saidas ? parseFloat(newData.saidas) : undefined,
      pis: newData.pis ? parseFloat(newData.pis) : undefined,
      cofins: newData.cofins ? parseFloat(newData.cofins) : undefined,
      icms: newData.icms ? parseFloat(newData.icms) : undefined,
      irpj_primeiro_trimestre: newData.irpj_primeiro_trimestre ? parseFloat(newData.irpj_primeiro_trimestre) : undefined,
      csll_primeiro_trimestre: newData.csll_primeiro_trimestre ? parseFloat(newData.csll_primeiro_trimestre) : undefined,
      irpj_segundo_trimestre: newData.irpj_segundo_trimestre ? parseFloat(newData.irpj_segundo_trimestre) : undefined,
      csll_segundo_trimestre: newData.csll_segundo_trimestre ? parseFloat(newData.csll_segundo_trimestre) : undefined,
    };

    try {
      await addMutation.mutateAsync(dataToSubmit);
      setIsAddDialogOpen(false);
      setNewData({
        company_id: '',
        period: '',
        entradas: '',
        saidas: '',
        pis: '',
        cofins: '',
        icms: '',
        irpj_primeiro_trimestre: '',
        csll_primeiro_trimestre: '',
        irpj_segundo_trimestre: '',
        csll_segundo_trimestre: '',
      });
    } catch (error) {
      console.error('Error adding lucro real data:', error);
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processedData = jsonData.map((row: any) => {
        const parseNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '') return null;
          const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        };

        return {
          empresa: String(row.Empresa || row.empresa || '').trim(),
          cnpj: String(row.CNPJ || row.cnpj || '').replace(/\D/g, ''),
          periodo: String(row.Competência || row.competência || row.competencia || row.Período || row.periodo || row.Periodo || '').trim(),
          entradas: parseNumber(row.Entradas || row.entradas),
          saidas: parseNumber(row.Saídas || row.saídas || row.saidas || row.Saidas),
          pis: parseNumber(row.PIS || row.pis),
          cofins: parseNumber(row.COFINS || row.cofins),
          icms: parseNumber(row.ICMS || row.icms),
          irpj_primeiro_trimestre: parseNumber(row['IRPJ 1º trimestre'] || row['irpj_primeiro_trimestre'] || row['IRPJ_1_trimestre']),
          csll_primeiro_trimestre: parseNumber(row['CSLL 1º trimestre'] || row['csll_primeiro_trimestre'] || row['CSLL_1_trimestre']),
          irpj_segundo_trimestre: parseNumber(row['IRPJ 2º trimestre'] || row['irpj_segundo_trimestre'] || row['IRPJ_2_trimestre']),
          csll_segundo_trimestre: parseNumber(row['CSLL 2º trimestre'] || row['csll_segundo_trimestre'] || row['CSLL_2_trimestre']),
          segmento: String(row.Segmento || row.segmento || '').trim(),
        };
      });

      const validRowsCount = processedData.filter(row => 
        row.empresa && row.empresa.trim() !== ''
      ).length;

      if (validRowsCount === 0) {
        alert('Nenhum dado válido encontrado no arquivo. Verifique se a coluna Empresa está preenchida.');
        return;
      }

      await importMutation.mutateAsync(processedData);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
    }
  };

  const downloadTemplate = () => {
    const lucroRealData = [
      {
        Empresa: 'Empresa Lucro Real Ltda',
        CNPJ: '11222333000144',
        Competência: '2024-01',
        Entradas: 1500000,
        Saídas: 1200000,
        PIS: 15000,
        COFINS: 70000,
        ICMS: 180000,
        'IRPJ 1º trimestre': 45000,
        'CSLL 1º trimestre': 27000,
        'IRPJ 2º trimestre': 50000,
        'CSLL 2º trimestre': 30000,
        Segmento: 'Indústria'
      },
      {
        Empresa: 'Comercial Lucro Real S.A.',
        CNPJ: '44555666000177',
        Competência: '2024-01',
        Entradas: 2000000,
        Saídas: 1800000,
        PIS: 20000,
        COFINS: 92000,
        ICMS: 240000,
        'IRPJ 1º trimestre': 60000,
        'CSLL 1º trimestre': 36000,
        'IRPJ 2º trimestre': 65000,
        'CSLL 2º trimestre': 39000,
        Segmento: 'Comércio'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(lucroRealData);
    XLSX.utils.book_append_sheet(wb, ws, 'Lucro Real');
    XLSX.writeFile(wb, 'template_lucro_real.xlsx');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dados de Lucro Real</CardTitle>
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Dados de Lucro Real ({filteredAndSortedData?.length || 0})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar Template
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileSelect(file);
                  };
                  input.click();
                }}
                disabled={importMutation.isPending}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {importMutation.isPending ? 'Importando...' : 'Importar XLSX'}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Dados
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Dados de Lucro Real</DialogTitle>
                    <DialogDescription>
                      Preencha os dados fiscais da empresa para o período selecionado.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Empresa *</Label>
                        <Select 
                          value={newData.company_id} 
                          onValueChange={(value) => setNewData(prev => ({ ...prev, company_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies?.filter(c => c.regime_tributario === 'lucro_real').map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="period">Competência *</Label>
                        <Input
                          id="period"
                          value={newData.period}
                          onChange={(e) => setNewData(prev => ({ ...prev, period: e.target.value }))}
                          placeholder="Ex: 2024-01"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="entradas">Entradas</Label>
                        <Input
                          id="entradas"
                          type="number"
                          step="0.01"
                          value={newData.entradas}
                          onChange={(e) => setNewData(prev => ({ ...prev, entradas: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="saidas">Saídas</Label>
                        <Input
                          id="saidas"
                          type="number"
                          step="0.01"
                          value={newData.saidas}
                          onChange={(e) => setNewData(prev => ({ ...prev, saidas: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="pis">PIS</Label>
                        <Input
                          id="pis"
                          type="number"
                          step="0.01"
                          value={newData.pis}
                          onChange={(e) => setNewData(prev => ({ ...prev, pis: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cofins">COFINS</Label>
                        <Input
                          id="cofins"
                          type="number"
                          step="0.01"
                          value={newData.cofins}
                          onChange={(e) => setNewData(prev => ({ ...prev, cofins: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="icms">ICMS</Label>
                        <Input
                          id="icms"
                          type="number"
                          step="0.01"
                          value={newData.icms}
                          onChange={(e) => setNewData(prev => ({ ...prev, icms: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="irpj1">IRPJ 1º Trimestre</Label>
                        <Input
                          id="irpj1"
                          type="number"
                          step="0.01"
                          value={newData.irpj_primeiro_trimestre}
                          onChange={(e) => setNewData(prev => ({ ...prev, irpj_primeiro_trimestre: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="csll1">CSLL 1º Trimestre</Label>
                        <Input
                          id="csll1"
                          type="number"
                          step="0.01"
                          value={newData.csll_primeiro_trimestre}
                          onChange={(e) => setNewData(prev => ({ ...prev, csll_primeiro_trimestre: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="irpj2">IRPJ 2º Trimestre</Label>
                        <Input
                          id="irpj2"
                          type="number"
                          step="0.01"
                          value={newData.irpj_segundo_trimestre}
                          onChange={(e) => setNewData(prev => ({ ...prev, irpj_segundo_trimestre: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="csll2">CSLL 2º Trimestre</Label>
                        <Input
                          id="csll2"
                          type="number"
                          step="0.01"
                          value={newData.csll_segundo_trimestre}
                          onChange={(e) => setNewData(prev => ({ ...prev, csll_segundo_trimestre: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addMutation.isPending}
                      >
                        {addMutation.isPending ? 'Salvando...' : 'Salvar'}
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
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="periodo">Período</SelectItem>
                    <SelectItem value="entradas">Entradas</SelectItem>
                    <SelectItem value="saidas">Saídas</SelectItem>
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
                {filters.periodo !== 'todos' && (
                  <Badge variant="secondary" className="gap-1">
                    Período: {filters.periodo}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('periodo', 'todos')}
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
                  <TableHead className="border-r border-border font-semibold text-foreground min-w-0 flex-1">Empresa</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">CNPJ</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden lg:table-cell">Segmento</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">Período</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">Entradas</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">Saídas</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">PIS</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">COFINS</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">ICMS</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">IRPJ 1º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">CSLL 1º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">IRPJ 2º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">CSLL 2º</TableHead>
                  <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData?.map((item, index) => {
                  const company = companies?.find(c => c.id === item.company_id);
                  return (
                    <TableRow 
                      key={item.id}
                      className="cursor-pointer hover:bg-accent transition-colors border-b border-border bg-muted/30"
                      onClick={() => handleCompanyClick(company)}
                    >
                      <TableCell className="border-r border-border text-center text-muted-foreground font-mono text-sm w-8">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-r border-border font-medium text-foreground min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="truncate">{company?.name || 'N/A'}</span>
                          {company && hasPassword(company) && (
                            <div className="flex items-center gap-1">
                              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border text-foreground w-24 hidden sm:table-cell">
                        <span className="truncate block text-xs">
                          {company?.cnpj 
                            ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                            : 'N/A'
                          }
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-foreground w-24 hidden lg:table-cell">
                        <span className="truncate block text-xs">
                          {company?.segmento ? (
                            <Badge variant="secondary" className="text-xs">
                              {company.segmento}
                            </Badge>
                          ) : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-foreground w-24 hidden sm:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span className="truncate block text-xs">{item.period}</span>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-green-600 dark:text-green-400 font-medium w-20 hidden md:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.entradas)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-red-600 dark:text-red-400 font-medium w-20 hidden lg:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.saidas)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden lg:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.pis)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.cofins)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.icms)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.irpj_primeiro_trimestre)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.csll_primeiro_trimestre)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.irpj_segundo_trimestre)}
                        </span>
                      </TableCell>
                      <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                        <span className="truncate block text-xs">
                          {formatCurrency(item.csll_segundo_trimestre)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center w-12">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Aqui poderia adicionar funcionalidade de editar empresa se necessário
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
                              if (company) {
                                handleDeleteCompany(company.id, company.name);
                              }
                            }}
                            title="Excluir empresa"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredAndSortedData?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8 text-muted-foreground border-b border-border">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum dado de Lucro Real encontrado</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
                <li>Todos os dados de Lucro Real associados</li>
                <li>Histórico de períodos fiscais</li>
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
    </div>
  );
};