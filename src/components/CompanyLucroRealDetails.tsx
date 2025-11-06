import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Building2, Plus, FileText, Calendar, Upload, Download, Edit3, Trash2, ArrowUpDown, ArrowLeft, CheckCircle, AlertCircle, PauseCircle, Settings } from 'lucide-react';
import { useCompanyWithData, useLucroRealDataByCompany, useAddLucroRealData, useUpdateLucroRealData, useDeleteLucroRealData, useImportLucroRealExcel, useDeleteCompany, useUpdateCompanyStatus } from '@/hooks/useFiscalData';
import { CompanyLucroRealEvolutionChart } from './CompanyLucroRealEvolutionChart';
import * as XLSX from 'xlsx';
import { periodToDate } from '@/lib/periodUtils';
interface CompanyLucroRealDetailsProps {
  companyId: string;
  onCompanyDeleted?: () => void;
  onBack?: () => void;
}
interface AddLucroRealForm {
  period: string;
  entradas: string;
  saidas: string;
  servicos: string;
  pis: string;
  cofins: string;
  icms: string;
  irpj_primeiro_trimestre: string;
  csll_primeiro_trimestre: string;
  irpj_segundo_trimestre: string;
  csll_segundo_trimestre: string;
  tvi: string;
}
interface EditLucroRealForm {
  period: string;
  entradas: string;
  saidas: string;
  servicos: string;
  pis: string;
  cofins: string;
  icms: string;
  irpj_primeiro_trimestre: string;
  csll_primeiro_trimestre: string;
  irpj_segundo_trimestre: string;
  csll_segundo_trimestre: string;
  tvi: string;
}
export const CompanyLucroRealDetails = ({
  companyId,
  onCompanyDeleted,
  onBack
}: CompanyLucroRealDetailsProps) => {
  const [sortField, setSortField] = useState<'period' | 'entradas' | 'saidas' | 'servicos' | 'pis' | 'cofins' | 'icms' | 'irpj_primeiro_trimestre' | 'csll_primeiro_trimestre' | 'irpj_segundo_trimestre' | 'csll_segundo_trimestre' | 'tvi'>('period');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleteCompanyDialogOpen, setIsDeleteCompanyDialogOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string; currentStatus: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    data: company,
    isLoading: companyLoading
  } = useCompanyWithData(companyId);
  const {
    data: lucroRealData,
    isLoading: dataLoading
  } = useLucroRealDataByCompany(companyId);
  const addMutation = useAddLucroRealData();
  const updateMutation = useUpdateLucroRealData();
  const deleteMutation = useDeleteLucroRealData();
  const deleteCompanyMutation = useDeleteCompany();
  const importMutation = useImportLucroRealExcel();
  const updateStatusMutation = useUpdateCompanyStatus();
  const [newData, setNewData] = useState<AddLucroRealForm>({
    period: '',
    entradas: '',
    saidas: '',
    servicos: '',
    pis: '',
    cofins: '',
    icms: '',
    irpj_primeiro_trimestre: '',
    csll_primeiro_trimestre: '',
    irpj_segundo_trimestre: '',
    csll_segundo_trimestre: '',
    tvi: ''
  });
  const [editData, setEditData] = useState<EditLucroRealForm>({
    period: '',
    entradas: '',
    saidas: '',
    servicos: '',
    pis: '',
    cofins: '',
    icms: '',
    irpj_primeiro_trimestre: '',
    csll_primeiro_trimestre: '',
    irpj_segundo_trimestre: '',
    csll_segundo_trimestre: '',
    tvi: ''
  });
  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filtrar e ordenar dados
  const filteredAndSortedData = lucroRealData?.filter(item => {
    if (filterPeriod && !item.period.includes(filterPeriod)) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    let aValue: any, bValue: any;
    switch (sortField) {
      case 'period':
        // Converter períodos para datas para ordenação correta
        const dateA = periodToDate(a.period) || new Date(0);
        const dateB = periodToDate(b.period) || new Date(0);
        aValue = dateA.getTime();
        bValue = dateB.getTime();
        break;
      case 'entradas':
        aValue = a.entradas || 0;
        bValue = b.entradas || 0;
        break;
      case 'saidas':
        aValue = a.saidas || 0;
        bValue = b.saidas || 0;
        break;
      case 'servicos':
        aValue = a.servicos || 0;
        bValue = b.servicos || 0;
        break;
      case 'pis':
        aValue = a.pis || 0;
        bValue = b.pis || 0;
        break;
      case 'cofins':
        aValue = a.cofins || 0;
        bValue = b.cofins || 0;
        break;
      case 'icms':
        aValue = a.icms || 0;
        bValue = b.icms || 0;
        break;
      case 'irpj_primeiro_trimestre':
        aValue = a.irpj_primeiro_trimestre || 0;
        bValue = b.irpj_primeiro_trimestre || 0;
        break;
      case 'csll_primeiro_trimestre':
        aValue = a.csll_primeiro_trimestre || 0;
        bValue = b.csll_primeiro_trimestre || 0;
        break;
      case 'irpj_segundo_trimestre':
        aValue = a.irpj_segundo_trimestre || 0;
        bValue = b.irpj_segundo_trimestre || 0;
        break;
      case 'csll_segundo_trimestre':
        aValue = a.csll_segundo_trimestre || 0;
        bValue = b.csll_segundo_trimestre || 0;
        break;
      case 'tvi':
        aValue = a.tvi || 0;
        bValue = b.tvi || 0;
        break;
      default:
        // Para o período por padrão, também converter para datas
        const defaultDateA = periodToDate(a.period) || new Date(0);
        const defaultDateB = periodToDate(b.period) || new Date(0);
        aValue = defaultDateA.getTime();
        bValue = defaultDateB.getTime();
    }
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) || [];
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newData.period.trim()) {
      alert('Período é obrigatório');
      return;
    }
    const dataToSubmit = {
      company_id: companyId,
      period: newData.period.trim(),
      entradas: newData.entradas ? parseFloat(newData.entradas) : undefined,
      saidas: newData.saidas ? parseFloat(newData.saidas) : undefined,
      servicos: newData.servicos ? parseFloat(newData.servicos) : undefined,
      pis: newData.pis ? parseFloat(newData.pis) : undefined,
      cofins: newData.cofins ? parseFloat(newData.cofins) : undefined,
      icms: newData.icms ? parseFloat(newData.icms) : undefined,
      irpj_primeiro_trimestre: newData.irpj_primeiro_trimestre ? parseFloat(newData.irpj_primeiro_trimestre) : undefined,
      csll_primeiro_trimestre: newData.csll_primeiro_trimestre ? parseFloat(newData.csll_primeiro_trimestre) : undefined,
      irpj_segundo_trimestre: newData.irpj_segundo_trimestre ? parseFloat(newData.irpj_segundo_trimestre) : undefined,
      csll_segundo_trimestre: newData.csll_segundo_trimestre ? parseFloat(newData.csll_segundo_trimestre) : undefined,
      tvi: newData.tvi ? parseFloat(newData.tvi) : undefined
    };
    try {
      await addMutation.mutateAsync(dataToSubmit);
      setIsAddDialogOpen(false);
      setNewData({
        period: '',
        entradas: '',
        saidas: '',
        servicos: '',
        pis: '',
        cofins: '',
        icms: '',
        irpj_primeiro_trimestre: '',
        csll_primeiro_trimestre: '',
        irpj_segundo_trimestre: '',
        csll_segundo_trimestre: '',
        tvi: ''
      });
    } catch (error) {
      console.error('Error adding lucro real data:', error);
    }
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData || !editData.period.trim()) {
      alert('Período é obrigatório');
      return;
    }
    const dataToSubmit = {
      id: editingData.id,
      period: editData.period.trim(),
      entradas: editData.entradas ? parseFloat(editData.entradas) : undefined,
      saidas: editData.saidas ? parseFloat(editData.saidas) : undefined,
      servicos: editData.servicos ? parseFloat(editData.servicos) : undefined,
      pis: editData.pis ? parseFloat(editData.pis) : undefined,
      cofins: editData.cofins ? parseFloat(editData.cofins) : undefined,
      icms: editData.icms ? parseFloat(editData.icms) : undefined,
      irpj_primeiro_trimestre: editData.irpj_primeiro_trimestre ? parseFloat(editData.irpj_primeiro_trimestre) : undefined,
      csll_primeiro_trimestre: editData.csll_primeiro_trimestre ? parseFloat(editData.csll_primeiro_trimestre) : undefined,
      irpj_segundo_trimestre: editData.irpj_segundo_trimestre ? parseFloat(editData.irpj_segundo_trimestre) : undefined,
      csll_segundo_trimestre: editData.csll_segundo_trimestre ? parseFloat(editData.csll_segundo_trimestre) : undefined,
      tvi: editData.tvi ? parseFloat(editData.tvi) : undefined
    };
    try {
      await updateMutation.mutateAsync(dataToSubmit);
      setIsEditDialogOpen(false);
      setEditingData(null);
    } catch (error) {
      console.error('Error updating lucro real data:', error);
    }
  };
  const handleEdit = (item: any) => {
    setEditingData(item);
    setEditData({
      period: item.period || '',
      entradas: item.entradas?.toString() || '',
      saidas: item.saidas?.toString() || '',
      servicos: item.servicos?.toString() || '',
      pis: item.pis?.toString() || '',
      cofins: item.cofins?.toString() || '',
      icms: item.icms?.toString() || '',
      irpj_primeiro_trimestre: item.irpj_primeiro_trimestre?.toString() || '',
      csll_primeiro_trimestre: item.csll_primeiro_trimestre?.toString() || '',
      irpj_segundo_trimestre: item.irpj_segundo_trimestre?.toString() || '',
      csll_segundo_trimestre: item.csll_segundo_trimestre?.toString() || '',
      tvi: item.tvi?.toString() || ''
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting lucro real data:', error);
      }
    }
  };
  const handleDeleteCompany = () => {
    setIsDeleteCompanyDialogOpen(true);
  };
  const handleConfirmDeleteCompany = async () => {
    try {
      await deleteCompanyMutation.mutateAsync(companyId);
      setIsDeleteCompanyDialogOpen(false);
      if (onCompanyDeleted) {
        onCompanyDeleted();
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const handleStatusClick = () => {
    if (!company) return;
    
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
  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }
    
    try {
      setIsImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const parseNumber = (value: any): number | null => {
        if (value === null || value === undefined || value === '') return null;
        const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
        return isNaN(parsed) ? null : parsed;
      };
      
      const processedData = jsonData.map((row: any) => {
        return {
          periodo: String(row.Competência || row.competência || row.competencia || row.Período || row.periodo || row.Periodo || '').trim(),
          entradas: parseNumber(row.Entradas || row.entradas),
          saidas: parseNumber(row.Saídas || row.saídas || row.saidas || row.Saidas),
          servicos: parseNumber(row.Serviços || row.servicos || row.Servicos),
          pis: parseNumber(row.PIS || row.pis),
          cofins: parseNumber(row.COFINS || row.cofins),
          icms: parseNumber(row.ICMS || row.icms),
          irpj_primeiro_trimestre: parseNumber(row['IRPJ 1º trimestre'] || row['irpj_primeiro_trimestre'] || row['IRPJ_1_trimestre']),
          csll_primeiro_trimestre: parseNumber(row['CSLL 1º trimestre'] || row['csll_primeiro_trimestre'] || row['CSLL_1_trimestre']),
          irpj_segundo_trimestre: parseNumber(row['IRPJ 2º trimestre'] || row['irpj_segundo_trimestre'] || row['IRPJ_2_trimestre']),
          csll_segundo_trimestre: parseNumber(row['CSLL 2º trimestre'] || row['csll_segundo_trimestre'] || row['CSLL_2_trimestre']),
          tvi: parseNumber(row.TVI || row.tvi)
        };
      });

      const validRows = processedData.filter(row => row.periodo && row.periodo.trim());
      
      if (validRows.length === 0) {
        alert('Nenhum registro válido encontrado. Verifique se a coluna Período/Competência está preenchida.');
        setIsImporting(false);
        return;
      }

      // Adicionar cada registro usando a mutation
      for (const row of validRows) {
        await addMutation.mutateAsync({
          company_id: companyId,
          period: row.periodo,
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
        });
      }

      alert(`${validRows.length} registros importados com sucesso!`);
      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
    } finally {
      setIsImporting(false);
    }
  };
  const downloadTemplate = () => {
    const templateData = [{
      Empresa: company?.name || 'Nome da Empresa',
      CNPJ: company?.cnpj || '00000000000000',
      Competência: '2024-01',
      Entradas: 1500000,
      Saídas: 1200000,
      Serviços: 300000,
      PIS: 15000,
      COFINS: 70000,
      ICMS: 180000,
      'IRPJ 1º trimestre': 45000,
      'CSLL 1º trimestre': 27000,
      'IRPJ 2º trimestre': 50000,
      'CSLL 2º trimestre': 30000,
      TVI: 25000
    }];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, 'Normais');
    XLSX.writeFile(wb, `template_normais_${company?.name?.replace(/\s+/g, '_') || 'empresa'}.xlsx`);
  };
  if (companyLoading || dataLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Carregando dados da empresa...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-muted rounded"></div>)}
          </div>
        </CardContent>
      </Card>;
  }
  if (!company) {
    return <Card>
        <CardHeader>
          <CardTitle>Empresa não encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A empresa solicitada não foi encontrada.</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Botão de Voltar */}
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista de empresas
        </Button>
      )}
      
      {/* Gráfico de Evolução Fiscal da Empresa */}
      <CompanyLucroRealEvolutionChart 
        companyId={companyId} 
        companyName={company?.name || 'Empresa'} 
      />
      
      {/* Header da Empresa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">{company.name}</CardTitle>
                <div className="text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span>
                    {company.cnpj ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : 'CNPJ não informado'}
                  </span>
                  {company.segmento && <Badge variant="secondary">{company.segmento}</Badge>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Situação da Empresa */}
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-105 ${getStatusColor(company.sem_movimento || false)}`}
                onClick={handleStatusClick}
                title="Clique para alterar a situação (SM = Sem Movimento)"
              >
                {(() => {
                  const IconComponent = getStatusIcon(company.sem_movimento || false);
                  return <IconComponent className="h-3 w-3 mr-1.5" />;
                })()}
                {getStatusDisplay(company.sem_movimento || false)}
              </div>
              
              <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Baixar Template
              </Button>
              <Button variant="outline" onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = e => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleFileSelect(file);
              };
              input.click();
            }} disabled={importMutation.isPending} className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {importMutation.isPending ? 'Importando...' : 'Importar XLSX'}
              </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Dados
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Dados Normais</DialogTitle>
                    <DialogDescription>
                      Preencha os dados fiscais para o período selecionado.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="period">Competência *</Label>
                        <Input id="period" value={newData.period} onChange={e => setNewData(prev => ({
                        ...prev,
                        period: e.target.value
                      }))} placeholder="Ex: 2024-01" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="entradas">Entradas</Label>
                        <Input id="entradas" type="number" step="0.01" value={newData.entradas} onChange={e => setNewData(prev => ({
                        ...prev,
                        entradas: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="saidas">Saídas</Label>
                        <Input id="saidas" type="number" step="0.01" value={newData.saidas} onChange={e => setNewData(prev => ({
                        ...prev,
                        saidas: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="servicos">Serviços</Label>
                        <Input id="servicos" type="number" step="0.01" value={newData.servicos} onChange={e => setNewData(prev => ({
                        ...prev,
                        servicos: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="pis">PIS</Label>
                        <Input id="pis" type="number" step="0.01" value={newData.pis} onChange={e => setNewData(prev => ({
                        ...prev,
                        pis: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="cofins">COFINS</Label>
                        <Input id="cofins" type="number" step="0.01" value={newData.cofins} onChange={e => setNewData(prev => ({
                        ...prev,
                        cofins: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="icms">ICMS</Label>
                        <Input id="icms" type="number" step="0.01" value={newData.icms} onChange={e => setNewData(prev => ({
                        ...prev,
                        icms: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="irpj1">IRPJ 1º Trimestre</Label>
                        <Input id="irpj1" type="number" step="0.01" value={newData.irpj_primeiro_trimestre} onChange={e => setNewData(prev => ({
                        ...prev,
                        irpj_primeiro_trimestre: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="csll1">CSLL 1º Trimestre</Label>
                        <Input id="csll1" type="number" step="0.01" value={newData.csll_primeiro_trimestre} onChange={e => setNewData(prev => ({
                        ...prev,
                        csll_primeiro_trimestre: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="irpj2">IRPJ 2º Trimestre</Label>
                        <Input id="irpj2" type="number" step="0.01" value={newData.irpj_segundo_trimestre} onChange={e => setNewData(prev => ({
                        ...prev,
                        irpj_segundo_trimestre: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                      <div>
                        <Label htmlFor="csll2">CSLL 2º Trimestre</Label>
                        <Input id="csll2" type="number" step="0.01" value={newData.csll_segundo_trimestre} onChange={e => setNewData(prev => ({
                        ...prev,
                        csll_segundo_trimestre: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label htmlFor="tvi">TVI</Label>
                        <Input id="tvi" type="number" step="0.01" value={newData.tvi} onChange={e => setNewData(prev => ({
                        ...prev,
                        tvi: e.target.value
                      }))} placeholder="0.00" />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={addMutation.isPending}>
                        {addMutation.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros e Ordenação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Dados Fiscais Normais</CardTitle>
            <div className="flex items-center gap-2">
              <Input placeholder="Filtrar por período..." value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)} className="w-48" />
              <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="period">Período</SelectItem>
                  <SelectItem value="entradas">Entradas</SelectItem>
                  <SelectItem value="saidas">Saídas</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="pis">PIS</SelectItem>
                  <SelectItem value="cofins">COFINS</SelectItem>
                  <SelectItem value="icms">ICMS</SelectItem>
                  <SelectItem value="irpj_primeiro_trimestre">IRPJ 1º</SelectItem>
                  <SelectItem value="csll_primeiro_trimestre">CSLL 1º</SelectItem>
                  <SelectItem value="irpj_segundo_trimestre">IRPJ 2º</SelectItem>
                  <SelectItem value="csll_segundo_trimestre">CSLL 2º</SelectItem>
                  <SelectItem value="tvi">TVI</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')} className="px-2">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 backdrop-blur-sm">
                  <TableHead className="border-r border-border font-semibold text-foreground w-8 text-center">#</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24">Período</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">Entradas</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">Saídas</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden md:table-cell">Serviços</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">PIS</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden lg:table-cell">COFINS</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">ICMS</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">IRPJ 1º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">CSLL 1º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">IRPJ 2º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">CSLL 2º</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-20 hidden xl:table-cell">TVI</TableHead>
                  <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData?.map((item, index) => <TableRow key={item.id} className="hover:bg-accent transition-colors border-b border-border bg-muted/30">
                    <TableCell className="border-r border-border text-center text-muted-foreground font-mono text-sm w-8">
                      {index + 1}
                    </TableCell>
                    <TableCell className="border-r border-border text-foreground w-24">
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
                    <TableCell className="border-r border-border text-right text-red-600 dark:text-red-400 font-medium w-20 hidden md:table-cell">
                      <span className="truncate block text-xs">
                        {formatCurrency(item.saidas)}
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-border text-right text-blue-600 dark:text-blue-400 font-medium w-20 hidden md:table-cell">
                      <span className="truncate block text-xs">
                        {formatCurrency(item.servicos)}
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-border text-right text-foreground w-20 hidden lg:table-cell">
                      <span className="truncate block text-xs">
                        {formatCurrency(item.pis)}
                      </span>
                    </TableCell>
                    <TableCell className="border-r border-border text-right text-foreground w-20 hidden lg:table-cell">
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
                    <TableCell className="border-r border-border text-right text-foreground w-20 hidden xl:table-cell">
                      <span className="truncate block text-xs">
                        {formatCurrency(item.tvi)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center w-12">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-8 w-8 p-0" onClick={() => handleEdit(item)} title="Editar dados">
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0" onClick={() => handleDelete(item.id)} title="Excluir dados">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>)}
                {filteredAndSortedData?.length === 0 && <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground border-b border-border">
                      <FileText className="h-12 w-12 mx-auto mb-4" />
                      <p>Nenhum dado Normal encontrado</p>
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Dados Normais</DialogTitle>
            <DialogDescription>
              Altere os dados fiscais para o período selecionado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-period">Competência *</Label>
                <Input id="edit-period" value={editData.period} onChange={e => setEditData(prev => ({
                ...prev,
                period: e.target.value
              }))} placeholder="Ex: 2024-01" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-entradas">Entradas</Label>
                <Input id="edit-entradas" type="number" step="0.01" value={editData.entradas} onChange={e => setEditData(prev => ({
                ...prev,
                entradas: e.target.value
              }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="edit-saidas">Saídas</Label>
                <Input id="edit-saidas" type="number" step="0.01" value={editData.saidas} onChange={e => setEditData(prev => ({
                ...prev,
                saidas: e.target.value
              }))} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="edit-servicos">Serviços</Label>
                <Input id="edit-servicos" type="number" step="0.01" value={editData.servicos} onChange={e => setEditData(prev => ({
                ...prev,
                servicos: e.target.value
              }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="edit-pis">PIS</Label>
                <Input id="edit-pis" type="number" step="0.01" value={editData.pis} onChange={e => setEditData(prev => ({
                ...prev,
                pis: e.target.value
              }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="edit-cofins">COFINS</Label>
                <Input id="edit-cofins" type="number" step="0.01" value={editData.cofins} onChange={e => setEditData(prev => ({
                ...prev,
                cofins: e.target.value
              }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="edit-icms">ICMS</Label>
                <Input id="edit-icms" type="number" step="0.01" value={editData.icms} onChange={e => setEditData(prev => ({
                ...prev,
                icms: e.target.value
              }))} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-irpj1">IRPJ 1º Trimestre</Label>
                <Input id="edit-irpj1" type="number" step="0.01" value={editData.irpj_primeiro_trimestre} onChange={e => setEditData(prev => ({
                ...prev,
                irpj_primeiro_trimestre: e.target.value
              }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="edit-csll1">CSLL 1º Trimestre</Label>
                <Input id="edit-csll1" type="number" step="0.01" value={editData.csll_primeiro_trimestre} onChange={e => setEditData(prev => ({
                ...prev,
                csll_primeiro_trimestre: e.target.value
              }))} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-irpj2">IRPJ 2º Trimestre</Label>
                <Input id="edit-irpj2" type="number" step="0.01" value={editData.irpj_segundo_trimestre} onChange={e => setEditData(prev => ({
                ...prev,
                irpj_segundo_trimestre: e.target.value
              }))} placeholder="0.00" />
              </div>
              <div>
                <Label htmlFor="edit-csll2">CSLL 2º Trimestre</Label>
                <Input id="edit-csll2" type="number" step="0.01" value={editData.csll_segundo_trimestre} onChange={e => setEditData(prev => ({
                ...prev,
                csll_segundo_trimestre: e.target.value
              }))} placeholder="0.00" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="edit-tvi">TVI</Label>
                <Input id="edit-tvi" type="number" step="0.01" value={editData.tvi} onChange={e => setEditData(prev => ({
                ...prev,
                tvi: e.target.value
              }))} placeholder="0.00" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão da empresa */}
      <AlertDialog open={isDeleteCompanyDialogOpen} onOpenChange={setIsDeleteCompanyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmar Exclusão da Empresa
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>"{company?.name}"</strong>?
              <br /><br />
              Esta ação também removerá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Todos os dados Normais associados</li>
                <li>Histórico de períodos fiscais</li>
                <li>Configurações de senha (se houver)</li>
              </ul>
              <br />
              <strong className="text-destructive">Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteCompanyDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCompany} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteCompanyMutation.isPending}>
              {deleteCompanyMutation.isPending ? 'Excluindo...' : 'Excluir Empresa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Seleção de Situação */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Alterar Situação da Empresa
            </DialogTitle>
            <DialogDescription>
              Selecione a nova situação para <strong>{selectedCompany?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
    </div>;
};