import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, FileText, Calendar, Upload, Download, ArrowLeft, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { useLucroRealData, useAddLucroRealData, useCompanies, useImportLucroRealExcel } from '@/hooks/useFiscalData';
import * as XLSX from 'xlsx';

export const LucroRealList = () => {
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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

  // Get companies with Lucro Real regime
  const lucroRealCompanies = companies?.filter(c => c.regime_tributario === 'lucro_real') || [];

  // Group data by company
  const groupDataByCompany = () => {
    const grouped: { [key: string]: any[] } = {};
    lucroRealData?.forEach(item => {
      const companyId = item.company_id;
      if (!grouped[companyId]) {
        grouped[companyId] = [];
      }
      grouped[companyId].push(item);
    });
    return grouped;
  };

  const groupedData = groupDataByCompany();

  // Get company info with data
  const getCompanyWithData = (companyId: string) => {
    const company = lucroRealCompanies.find(c => c.id === companyId);
    const companyData = groupedData[companyId] || [];
    
    if (!company) return null;

    // Calculate totals
    const totals = companyData.reduce((acc, item) => ({
      entradas: acc.entradas + (item.entradas || 0),
      saidas: acc.saidas + (item.saidas || 0),
      pis: acc.pis + (item.pis || 0),
      cofins: acc.cofins + (item.cofins || 0),
      icms: acc.icms + (item.icms || 0),
      irpj_primeiro: acc.irpj_primeiro + (item.irpj_primeiro_trimestre || 0),
      csll_primeiro: acc.csll_primeiro + (item.csll_primeiro_trimestre || 0),
      irpj_segundo: acc.irpj_segundo + (item.irpj_segundo_trimestre || 0),
      csll_segundo: acc.csll_segundo + (item.csll_segundo_trimestre || 0),
    }), {
      entradas: 0,
      saidas: 0,
      pis: 0,
      cofins: 0,
      icms: 0,
      irpj_primeiro: 0,
      csll_primeiro: 0,
      irpj_segundo: 0,
      csll_segundo: 0,
    });

    return {
      ...company,
      data: companyData,
      totals,
      periodCount: companyData.length
    };
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // Company list view
  if (!selectedCompany) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h2 className="text-2xl font-bold">Empresas de Lucro Real</h2>
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

        {/* Company Cards */}
        {lucroRealCompanies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma empresa de Lucro Real encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Adicione empresas com regime tributário de Lucro Real
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {lucroRealCompanies.map(company => {
              const companyWithData = getCompanyWithData(company.id);
              if (!companyWithData) return null;

              return (
                <Card key={company.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-lg">{company.name}</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCompany(company.id)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Ver dados
                      </Button>
                    </div>

                    {company.cnpj && (
                      <p className="text-sm text-muted-foreground mb-2">
                        CNPJ: {company.cnpj}
                      </p>
                    )}

                    {company.segmento && (
                      <Badge variant="secondary" className="mb-4">
                        {company.segmento}
                      </Badge>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Períodos registrados:</span>
                        <span className="font-semibold">{companyWithData.periodCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Entradas:</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(companyWithData.totals.entradas)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Saídas:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(companyWithData.totals.saidas)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm font-medium">Resultado:</span>
                      <div className="flex items-center gap-1">
                        {(companyWithData.totals.entradas - companyWithData.totals.saidas) >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${
                          (companyWithData.totals.entradas - companyWithData.totals.saidas) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {formatCurrency(companyWithData.totals.entradas - companyWithData.totals.saidas)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Company detail view
  const selectedCompanyData = getCompanyWithData(selectedCompany);
  if (!selectedCompanyData) return null;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => setSelectedCompany(null)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{selectedCompanyData.name}</h2>
        </div>
      </div>

      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium">{selectedCompanyData.cnpj || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Segmento</p>
              <p className="font-medium">{selectedCompanyData.segmento || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Regime Tributário</p>
              <Badge variant="outline">Lucro Real</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Períodos</p>
              <p className="font-medium">{selectedCompanyData.periodCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Fiscais por Período</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCompanyData.data.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Adicione dados para esta empresa
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {selectedCompanyData.data.map((item) => (
                    <TableRow key={item.id}>
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