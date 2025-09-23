import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, FileText, Calendar } from 'lucide-react';
import { useLucroRealData, useAddLucroRealData, useCompanies } from '@/hooks/useFiscalData';

export const LucroRealList = () => {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              <CardTitle>Empresas de Lucro Real</CardTitle>
            </div>
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
        </CardHeader>
        <CardContent>
          {!lucroRealData || lucroRealData.length === 0 ? (
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
                  {lucroRealData.map((item) => (
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