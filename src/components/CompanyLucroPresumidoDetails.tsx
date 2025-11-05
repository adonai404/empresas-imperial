import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Plus, FileText, Calendar, Upload, Download, Edit3, Trash2, ArrowUpDown, ArrowLeft, CheckCircle, AlertCircle, PauseCircle, Settings } from 'lucide-react';
import { useCompanyWithData, useLucroPresumidoDataByCompany, useAddLucroPresumidoData, useUpdateLucroPresumidoData, useDeleteLucroPresumidoData, useImportLucroPresumidoExcel, useDeleteCompany, useUpdateCompanyStatus } from '@/hooks/useFiscalData';
import { CompanyLucroPresumidoEvolutionChart } from './CompanyLucroPresumidoEvolutionChart';
import * as XLSX from 'xlsx';

interface CompanyLucroPresumidoDetailsProps {
  companyId: string;
  onCompanyDeleted?: () => void;
  onBack?: () => void;
}

interface AddLucroPresumidoForm {
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

interface EditLucroPresumidoForm {
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

export const CompanyLucroPresumidoDetails = ({
  companyId,
  onCompanyDeleted,
  onBack
}: CompanyLucroPresumidoDetailsProps) => {
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
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string; currentStatus: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: company,
    isLoading: companyLoading
  } = useCompanyWithData(companyId);

  const {
    data: lucroPresumidoData,
    isLoading: dataLoading
  } = useLucroPresumidoDataByCompany(companyId);

  const addMutation = useAddLucroPresumidoData();
  const updateMutation = useUpdateLucroPresumidoData();
  const deleteMutation = useDeleteLucroPresumidoData();
  const deleteCompanyMutation = useDeleteCompany();
  const importMutation = useImportLucroPresumidoExcel();
  const updateStatusMutation = useUpdateCompanyStatus();

  const [newData, setNewData] = useState<AddLucroPresumidoForm>({
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

  const [editData, setEditData] = useState<EditLucroPresumidoForm>({
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
    if (value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const filteredAndSortedData = React.useMemo(() => {
    if (!lucroPresumidoData) return [];

    let filtered = lucroPresumidoData;

    if (filterPeriod) {
      filtered = filtered.filter(item =>
        item.period.toLowerCase().includes(filterPeriod.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      let aValue, bValue;

      if (sortField === 'period') {
        aValue = a.period;
        bValue = b.period;
      } else {
        aValue = a[sortField] || 0;
        bValue = b[sortField] || 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [lucroPresumidoData, sortField, sortDirection, filterPeriod]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      company_id: companyId,
      period: newData.period,
      entradas: parseFloat(newData.entradas) || null,
      saidas: parseFloat(newData.saidas) || null,
      servicos: parseFloat(newData.servicos) || null,
      pis: parseFloat(newData.pis) || null,
      cofins: parseFloat(newData.cofins) || null,
      icms: parseFloat(newData.icms) || null,
      irpj_primeiro_trimestre: parseFloat(newData.irpj_primeiro_trimestre) || null,
      csll_primeiro_trimestre: parseFloat(newData.csll_primeiro_trimestre) || null,
      irpj_segundo_trimestre: parseFloat(newData.irpj_segundo_trimestre) || null,
      csll_segundo_trimestre: parseFloat(newData.csll_segundo_trimestre) || null,
      tvi: parseFloat(newData.tvi) || null,
    }, {
      onSuccess: () => {
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
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;

    updateMutation.mutate({
      id: editingData.id,
      period: editData.period,
      entradas: parseFloat(editData.entradas) || null,
      saidas: parseFloat(editData.saidas) || null,
      servicos: parseFloat(editData.servicos) || null,
      pis: parseFloat(editData.pis) || null,
      cofins: parseFloat(editData.cofins) || null,
      icms: parseFloat(editData.icms) || null,
      irpj_primeiro_trimestre: parseFloat(editData.irpj_primeiro_trimestre) || null,
      csll_primeiro_trimestre: parseFloat(editData.csll_primeiro_trimestre) || null,
      irpj_segundo_trimestre: parseFloat(editData.irpj_segundo_trimestre) || null,
      csll_segundo_trimestre: parseFloat(editData.csll_segundo_trimestre) || null,
      tvi: parseFloat(editData.tvi) || null,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingData(null);
      }
    });
  };

  const handleEdit = (data: any) => {
    setEditingData(data);
    setEditData({
      period: data.period || '',
      entradas: data.entradas?.toString() || '',
      saidas: data.saidas?.toString() || '',
      servicos: data.servicos?.toString() || '',
      pis: data.pis?.toString() || '',
      cofins: data.cofins?.toString() || '',
      icms: data.icms?.toString() || '',
      irpj_primeiro_trimestre: data.irpj_primeiro_trimestre?.toString() || '',
      csll_primeiro_trimestre: data.csll_primeiro_trimestre?.toString() || '',
      irpj_segundo_trimestre: data.irpj_segundo_trimestre?.toString() || '',
      csll_segundo_trimestre: data.csll_segundo_trimestre?.toString() || '',
      tvi: data.tvi?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleDeleteCompany = () => {
    setIsDeleteCompanyDialogOpen(true);
  };

  const handleConfirmDeleteCompany = () => {
    deleteCompanyMutation.mutate(companyId, {
      onSuccess: () => {
        setIsDeleteCompanyDialogOpen(false);
        if (onCompanyDeleted) {
          onCompanyDeleted();
        }
      }
    });
  };

  const handleStatusClick = () => {
    if (company) {
      const currentStatus = company.sem_movimento ? 'sem_movimento' : 'ativa';
      setSelectedCompany({
        id: company.id,
        name: company.name,
        currentStatus: currentStatus
      });
      setStatusModalOpen(true);
    }
  };

  const handleStatusChange = (newStatus: 'ativa' | 'paralizada' | 'sem_movimento') => {
    if (!selectedCompany) return;

    updateStatusMutation.mutate({
      companyId: selectedCompany.id,
      sem_movimento: newStatus === 'sem_movimento'
    }, {
      onSuccess: () => {
        setStatusModalOpen(false);
        setSelectedCompany(null);
      }
    });
  };

  const getStatusDisplay = (status?: string) => {
    if (!status || status === 'ativa') return 'Ativa';
    if (status === 'paralizada') return 'Paralisada';
    if (status === 'sem_movimento') return 'Sem Movimento';
    return 'Ativa';
  };

  const getStatusColor = (status?: string) => {
    if (!status || status === 'ativa') return 'bg-green-100 text-green-800 hover:bg-green-200';
    if (status === 'paralizada') return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    if (status === 'sem_movimento') return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    return 'bg-green-100 text-green-800 hover:bg-green-200';
  };

  const getStatusIcon = (status?: string) => {
    if (!status || status === 'ativa') return <CheckCircle className="h-4 w-4" />;
    if (status === 'paralizada') return <PauseCircle className="h-4 w-4" />;
    if (status === 'sem_movimento') return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
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

      const processedData = jsonData.map((row: any) => {
        const parseNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '') return null;
          const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        };

        return {
          empresa: company?.name || '',
          cnpj: company?.cnpj || '',
          periodo: String(row.Período || row.periodo || row.Periodo || '').trim(),
          entradas: parseNumber(row.Entradas || row.entradas),
          saidas: parseNumber(row.Saídas || row.saidas || row.Saidas),
          servicos: parseNumber(row.Serviços || row.servicos || row.Servicos),
          pis: parseNumber(row.PIS || row.pis),
          cofins: parseNumber(row.COFINS || row.cofins),
          icms: parseNumber(row.ICMS || row.icms),
          irpj_primeiro_trimestre: parseNumber(row['IRPJ 1º Tri'] || row.irpj_primeiro_trimestre),
          csll_primeiro_trimestre: parseNumber(row['CSLL 1º Tri'] || row.csll_primeiro_trimestre),
          irpj_segundo_trimestre: parseNumber(row['IRPJ 2º Tri'] || row.irpj_segundo_trimestre),
          csll_segundo_trimestre: parseNumber(row['CSLL 2º Tri'] || row.csll_segundo_trimestre),
          tvi: parseNumber(row.TVI || row.tvi),
        };
      });

      const validRows = processedData.filter(row =>
        row.periodo && row.periodo.trim()
      );

      if (validRows.length === 0) {
        alert('Nenhum registro válido encontrado. Verifique se a coluna Período está preenchida.');
        return;
      }

      await importMutation.mutateAsync(validRows);

      setIsImportDialogOpen(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Período': 'Janeiro/2024',
        'Entradas': 100000,
        'Saídas': 80000,
        'Serviços': 20000,
        'PIS': 1650,
        'COFINS': 7600,
        'ICMS': 12000,
        'IRPJ 1º Tri': 2400,
        'CSLL 1º Tri': 1080,
        'IRPJ 2º Tri': 0,
        'CSLL 2º Tri': 0,
        'TVI': 500
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Lucro Presumido');

    const fileName = `template_lucro_presumido_${company?.name?.replace(/\s+/g, '_') || 'empresa'}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  if (companyLoading || dataLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!company) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p>Empresa não encontrada</p>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = company.sem_movimento ? 'sem_movimento' : 'ativa';

  return (
    <div className="space-y-4">
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

      <CompanyLucroPresumidoEvolutionChart
        companyId={companyId}
        companyName={company.name}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>{company.name}</span>
              <Badge
                className={`flex items-center gap-1 cursor-pointer ${getStatusColor(currentStatus)}`}
                onClick={handleStatusClick}
              >
                {getStatusIcon(currentStatus)}
                {getStatusDisplay(currentStatus)}
                <Settings className="h-3 w-3 ml-1" />
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={downloadTemplate}
                title="Baixar template XLSX"
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>

              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Dados - Lucro Presumido</DialogTitle>
                    <DialogDescription>
                      Importe dados de Lucro Presumido para {company.name} a partir de uma planilha Excel.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".xlsx,.xls"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Selecionar Arquivo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Período
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Dados - Lucro Presumido</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="period">Período</Label>
                        <Input
                          id="period"
                          value={newData.period}
                          onChange={(e) => setNewData({ ...newData, period: e.target.value })}
                          placeholder="Janeiro/2024"
                          required
                        />
                      </div>
                      <div>
                        <Label>Entradas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.entradas}
                          onChange={(e) => setNewData({ ...newData, entradas: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Saídas</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.saidas}
                          onChange={(e) => setNewData({ ...newData, saidas: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Serviços</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.servicos}
                          onChange={(e) => setNewData({ ...newData, servicos: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>PIS</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.pis}
                          onChange={(e) => setNewData({ ...newData, pis: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>COFINS</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.cofins}
                          onChange={(e) => setNewData({ ...newData, cofins: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>ICMS</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.icms}
                          onChange={(e) => setNewData({ ...newData, icms: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>IRPJ 1º Trimestre</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.irpj_primeiro_trimestre}
                          onChange={(e) => setNewData({ ...newData, irpj_primeiro_trimestre: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>CSLL 1º Trimestre</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.csll_primeiro_trimestre}
                          onChange={(e) => setNewData({ ...newData, csll_primeiro_trimestre: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>IRPJ 2º Trimestre</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.irpj_segundo_trimestre}
                          onChange={(e) => setNewData({ ...newData, irpj_segundo_trimestre: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>CSLL 2º Trimestre</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.csll_segundo_trimestre}
                          onChange={(e) => setNewData({ ...newData, csll_segundo_trimestre: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>TVI</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newData.tvi}
                          onChange={(e) => setNewData({ ...newData, tvi: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Adicionar</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              placeholder="Filtrar por período..."
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
            />

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Entradas</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead>PIS</TableHead>
                    <TableHead>COFINS</TableHead>
                    <TableHead>ICMS</TableHead>
                    <TableHead>IRPJ 1º Tri</TableHead>
                    <TableHead>CSLL 1º Tri</TableHead>
                    <TableHead>IRPJ 2º Tri</TableHead>
                    <TableHead>CSLL 2º Tri</TableHead>
                    <TableHead>TVI</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((data) => (
                    <TableRow key={data.id}>
                      <TableCell>{data.period}</TableCell>
                      <TableCell>{formatCurrency(data.entradas)}</TableCell>
                      <TableCell>{formatCurrency(data.saidas)}</TableCell>
                      <TableCell>{formatCurrency(data.servicos)}</TableCell>
                      <TableCell>{formatCurrency(data.pis)}</TableCell>
                      <TableCell>{formatCurrency(data.cofins)}</TableCell>
                      <TableCell>{formatCurrency(data.icms)}</TableCell>
                      <TableCell>{formatCurrency(data.irpj_primeiro_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(data.csll_primeiro_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(data.irpj_segundo_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(data.csll_segundo_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(data.tvi)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(data)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir os dados do período {data.period}?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(data.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Dados - Lucro Presumido</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-period">Período</Label>
                <Input
                  id="edit-period"
                  value={editData.period}
                  onChange={(e) => setEditData({ ...editData, period: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Entradas</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.entradas}
                  onChange={(e) => setEditData({ ...editData, entradas: e.target.value })}
                />
              </div>
              <div>
                <Label>Saídas</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.saidas}
                  onChange={(e) => setEditData({ ...editData, saidas: e.target.value })}
                />
              </div>
              <div>
                <Label>Serviços</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.servicos}
                  onChange={(e) => setEditData({ ...editData, servicos: e.target.value })}
                />
              </div>
              <div>
                <Label>PIS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.pis}
                  onChange={(e) => setEditData({ ...editData, pis: e.target.value })}
                />
              </div>
              <div>
                <Label>COFINS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.cofins}
                  onChange={(e) => setEditData({ ...editData, cofins: e.target.value })}
                />
              </div>
              <div>
                <Label>ICMS</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.icms}
                  onChange={(e) => setEditData({ ...editData, icms: e.target.value })}
                />
              </div>
              <div>
                <Label>IRPJ 1º Trimestre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.irpj_primeiro_trimestre}
                  onChange={(e) => setEditData({ ...editData, irpj_primeiro_trimestre: e.target.value })}
                />
              </div>
              <div>
                <Label>CSLL 1º Trimestre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.csll_primeiro_trimestre}
                  onChange={(e) => setEditData({ ...editData, csll_primeiro_trimestre: e.target.value })}
                />
              </div>
              <div>
                <Label>IRPJ 2º Trimestre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.irpj_segundo_trimestre}
                  onChange={(e) => setEditData({ ...editData, irpj_segundo_trimestre: e.target.value })}
                />
              </div>
              <div>
                <Label>CSLL 2º Trimestre</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.csll_segundo_trimestre}
                  onChange={(e) => setEditData({ ...editData, csll_segundo_trimestre: e.target.value })}
                />
              </div>
              <div>
                <Label>TVI</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.tvi}
                  onChange={(e) => setEditData({ ...editData, tvi: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status da Empresa</DialogTitle>
            <DialogDescription>
              Selecione o novo status para {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleStatusChange('ativa')}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Ativa
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleStatusChange('paralizada')}
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              Paralisada
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => handleStatusChange('sem_movimento')}
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Sem Movimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
