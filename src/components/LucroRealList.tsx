import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, FileText, Calendar, Upload, Download, ArrowUpDown, Search, Filter } from 'lucide-react';
import { useLucroRealData, useAddLucroRealData, useCompanies, useImportLucroRealExcel } from '@/hooks/useFiscalData';
import * as XLSX from 'xlsx';

type ViewMode = 'overview' | 'detailed';

export const LucroRealList = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  const lucroRealCompanies = companies?.filter(c => c.regime_tributario === 'lucro_real') || [];

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

  const filteredData = lucroRealData?.filter(item => {
    if (!searchTerm) return true;
    const company = (item as any).companies;
    return (
      company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company?.cnpj?.includes(searchTerm) ||
      item.period?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Visão geral - cards de resumo
  if (viewMode === 'overview') {
    const totalRegistros = lucroRealData?.length || 0;
    const totalEmpresas = lucroRealCompanies.length;
    
    const totalEntradas = lucroRealData?.reduce((sum, item) => sum + (item.entradas || 0), 0) || 0;
    const totalSaidas = lucroRealData?.reduce((sum, item) => sum + (item.saidas || 0), 0) || 0;
    const totalPIS = lucroRealData?.reduce((sum, item) => sum + (item.pis || 0), 0) || 0;
    const totalCOFINS = lucroRealData?.reduce((sum, item) => sum + (item.cofins || 0), 0) || 0;
    const totalICMS = lucroRealData?.reduce((sum, item) => sum + (item.icms || 0), 0) || 0;

    return (
      <div className="space-y-6">
        {/* Header com botões de ação */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                <CardTitle>Empresas de Lucro Real</CardTitle>
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
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Dados
                    </Button>
                  </DialogTrigger>
                  {/* ... restante do dialog igual ao anterior ... */}
                </Dialog>
                <Button
                  variant="outline"
                  onClick={() => setViewMode('detailed')}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Resumo Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de Empresas:</span>
                  <span className="font-semibold text-blue-600">{totalEmpresas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total de Registros:</span>
                  <span className="font-semibold text-green-600">{totalRegistros}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Movimentação Financeira */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Movimentação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Entradas:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(totalEntradas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Saídas:</span>
                  <span className="font-semibold text-red-600">{formatCurrency(totalSaidas)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Resultado:</span>
                  <span className={`font-semibold ${totalEntradas - totalSaidas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalEntradas - totalSaidas)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Tributos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Tributos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PIS:</span>
                  <span className="font-semibold">{formatCurrency(totalPIS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">COFINS:</span>
                  <span className="font-semibold">{formatCurrency(totalCOFINS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">ICMS:</span>
                  <span className="font-semibold">{formatCurrency(totalICMS)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Tributos:</span>
                    <span className="font-bold text-primary">{formatCurrency(totalPIS + totalCOFINS + totalICMS)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de empresas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Empresas Cadastradas ({lucroRealCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lucroRealCompanies.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma empresa de Lucro Real encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione empresas do regime de Lucro Real para começar
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lucroRealCompanies.map((company) => {
                  const companyData = lucroRealData?.filter(data => (data as any).companies?.id === company.id) || [];
                  const lastPeriod = companyData[0]?.period || 'Sem dados';
                  
                  return (
                    <Card key={company.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">{company.name}</h4>
                          {company.cnpj && (
                            <p className="text-xs text-muted-foreground">{company.cnpj}</p>
                          )}
                          {company.segmento && (
                            <Badge variant="secondary" className="text-xs">
                              {company.segmento}
                            </Badge>
                          )}
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Registros:</span>
                            <span className="font-medium">{companyData.length}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Último período:</span>
                            <span className="font-medium">{lastPeriod}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Visão detalhada - tabela completa
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('overview')}
                className="flex items-center gap-2"
              >
                <ArrowUpDown className="h-4 w-4" />
                Voltar
              </Button>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5" />
                Dados de Lucro Real ({filteredData?.length || 0})
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Template
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
                {importMutation.isPending ? 'Importando...' : 'Importar'}
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Adicionar Dados de Lucro Real</DialogTitle>
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
                            {lucroRealCompanies.map((company) => (
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

                    <div className="flex justify-end gap-2">
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
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Barra de pesquisa */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por empresa, CNPJ ou período..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredData || filteredData.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum dado de Lucro Real encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione dados de empresas do regime de Lucro Real
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead>Entradas</TableHead>
                    <TableHead>Saídas</TableHead>
                    <TableHead>PIS</TableHead>
                    <TableHead>COFINS</TableHead>
                    <TableHead>ICMS</TableHead>
                    <TableHead>IRPJ 1º Trim</TableHead>
                    <TableHead>CSLL 1º Trim</TableHead>
                    <TableHead>IRPJ 2º Trim</TableHead>
                    <TableHead>CSLL 2º Trim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {(item as any).companies?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {(item as any).companies?.cnpj || '-'}
                      </TableCell>
                      <TableCell>
                        {(item as any).companies?.segmento ? (
                          <Badge variant="secondary">
                            {(item as any).companies.segmento}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.period}
                        </div>
                      </TableCell>
                      <TableCell className="text-green-600 dark:text-green-400">
                        {formatCurrency(item.entradas)}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        {formatCurrency(item.saidas)}
                      </TableCell>
                      <TableCell>{formatCurrency(item.pis)}</TableCell>
                      <TableCell>{formatCurrency(item.cofins)}</TableCell>
                      <TableCell>{formatCurrency(item.icms)}</TableCell>
                      <TableCell>{formatCurrency(item.irpj_primeiro_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(item.csll_primeiro_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(item.irpj_segundo_trimestre)}</TableCell>
                      <TableCell>{formatCurrency(item.csll_segundo_trimestre)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};