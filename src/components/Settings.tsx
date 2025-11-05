import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompaniesWithLatestFiscalData, useSetCompanyPassword, useRemoveCompanyPassword, useCnpjRegimes, useSaveCnpjRegime, useRemoveCnpjRegime, useSegments, useCreateSegment, useUpdateCompanySegment, useDeleteSegment } from '@/hooks/useFiscalData';
import { Settings as SettingsIcon, Lock, Key, Building2, Trash2, Shield, Search, Filter, Eye, EyeOff, AlertTriangle, Users, Database, Plus, X, FileText, Download, Upload, FileSpreadsheet, Tag } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { CompanyOperationAuth } from './CompanyOperationAuth';
import { PasswordChangeAuth } from './PasswordChangeAuth';

interface SettingsProps {}

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

interface CompanyRegime {
  id: string;
  cnpj: string;
  regime: 'lucro_real' | 'lucro_presumido' | 'simples_nacional';
}

interface RegimeForm {
  regime: 'lucro_real' | 'lucro_presumido' | 'simples_nacional';
  cnpjs: string[];
}

export const Settings = ({}: SettingsProps) => {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'protected' | 'unprotected'>('all');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados para gerenciamento de regimes
  const [newCnpj, setNewCnpj] = useState('');
  const [selectedRegime, setSelectedRegime] = useState<'lucro_real' | 'lucro_presumido' | 'simples_nacional'>('lucro_real');
  
  // Estados para Kanban e importação
  const [isAddCnpjDialogOpen, setIsAddCnpjDialogOpen] = useState(false);
  const [currentRegimeForAdd, setCurrentRegimeForAdd] = useState<'lucro_real' | 'lucro_presumido' | 'simples_nacional'>('lucro_real');
  const [tempCnpj, setTempCnpj] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [operationAuthCompany, setOperationAuthCompany] = useState<{ id: string; name: string; operation: 'remove_password' } | null>(null);
  const [isOperationAuthModalOpen, setIsOperationAuthModalOpen] = useState(false);
  const [passwordChangeAuthCompany, setPasswordChangeAuthCompany] = useState<{ id: string; name: string; operation: 'change' | 'remove' } | null>(null);
  const [isPasswordChangeAuthModalOpen, setIsPasswordChangeAuthModalOpen] = useState(false);

  // Estados para gerenciamento de segmentos
  const [selectedCompanyForSegment, setSelectedCompanyForSegment] = useState<string>('');
  const [newSegmentName, setNewSegmentName] = useState('');
  const [isCreateSegmentDialogOpen, setIsCreateSegmentDialogOpen] = useState(false);
  const [deleteSegmentConfirm, setDeleteSegmentConfirm] = useState<{ id: string; name: string } | null>(null);
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  
  const { data: companies, isLoading } = useCompaniesWithLatestFiscalData();
  const { data: cnpjRegimes = [] } = useCnpjRegimes();
  const { data: segments = [] } = useSegments();
  const setPasswordMutation = useSetCompanyPassword();
  const removePasswordMutation = useRemoveCompanyPassword();
  const saveCnpjRegimeMutation = useSaveCnpjRegime();
  const removeCnpjRegimeMutation = useRemoveCnpjRegime();
  const createSegmentMutation = useCreateSegment();
  const updateCompanySegmentMutation = useUpdateCompanySegment();
  const deleteSegmentMutation = useDeleteSegment();
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm<PasswordForm>();
  const password = watch('password');

  const handleSetPassword = (company: any) => {
    // Se a empresa já tem senha, exigir autenticação para alterar
    if (hasPassword(company)) {
      setPasswordChangeAuthCompany({ id: company.id, name: company.name, operation: 'change' });
      setIsPasswordChangeAuthModalOpen(true);
      return;
    }
    
    // Empresa sem senha - definir senha diretamente
    setSelectedCompany({ id: company.id, name: company.name });
    setIsPasswordDialogOpen(true);
  };

  const handleRemovePassword = (company: any) => {
    // Exigir autenticação para remover senha
    setPasswordChangeAuthCompany({ id: company.id, name: company.name, operation: 'remove' });
    setIsPasswordChangeAuthModalOpen(true);
  };

  // Funções para gerenciar regimes
  const addCnpjToRegime = () => {
    if (!newCnpj.trim()) return;
    
    const cnpj = newCnpj.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (cnpj.length !== 14) {
      toast({
        title: "Erro",
        description: "CNPJ deve ter 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se CNPJ já existe
    if (cnpjRegimes.some(cr => cr.cnpj === cnpj)) {
      toast({
        title: "Erro",
        description: "Este CNPJ já foi adicionado.",
        variant: "destructive",
      });
      return;
    }

    // Salvar no banco de dados
    saveCnpjRegimeMutation.mutate({
      cnpj,
      regime: selectedRegime
    }, {
      onSuccess: () => {
        setNewCnpj('');
      }
    });
  };

  const removeCnpjFromRegime = (cnpj: string) => {
    removeCnpjRegimeMutation.mutate(cnpj);
  };

  const getRegimeLabel = (regime: string) => {
    const labels = {
      'lucro_real': 'Normais',
      'simples_nacional': 'Simples Nacional'
    };
    return labels[regime as keyof typeof labels] || regime;
  };

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const getRegimeCompanies = (regime: string) => {
    return cnpjRegimes.filter(cr => cr.regime === regime);
  };

  // Funções para Kanban
  const openAddCnpjDialog = (regime: 'lucro_real' | 'simples_nacional') => {
    setCurrentRegimeForAdd(regime);
    setTempCnpj('');
    setIsAddCnpjDialogOpen(true);
  };

  const addCnpjToRegimeFromKanban = () => {
    if (!tempCnpj.trim()) return;
    
    const cnpj = tempCnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) {
      toast({
        title: "Erro",
        description: "CNPJ deve ter 14 dígitos.",
        variant: "destructive",
      });
      return;
    }

    if (cnpjRegimes.some(cr => cr.cnpj === cnpj)) {
      toast({
        title: "Erro",
        description: "Este CNPJ já foi adicionado.",
        variant: "destructive",
      });
      return;
    }

    // Salvar no banco de dados
    saveCnpjRegimeMutation.mutate({
      cnpj,
      regime: currentRegimeForAdd
    }, {
      onSuccess: () => {
        setTempCnpj('');
        setIsAddCnpjDialogOpen(false);
      }
    });
  };

  // Funções para importação/exportação
  const downloadTemplate = () => {
    const templateData = [
      { CNPJ: '00000000000100', Regime: 'lucro_real' },
      { CNPJ: '00000000000200', Regime: 'simples_nacional' }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Regimes');
    
    XLSX.writeFile(wb, 'template_regimes_empresas.xlsx');
    
    toast({
      title: "Template baixado",
      description: "O template foi baixado com sucesso. Preencha com os dados das suas empresas.",
    });
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          toast({
            title: "Erro",
            description: "Planilha vazia ou formato inválido.",
            variant: "destructive",
          });
          return;
        }

        const validRegimes = ['lucro_real', 'simples_nacional'];
        const importedRegimes: Array<{ cnpj: string, regime: 'lucro_real' | 'simples_nacional' }> = [];
        const errors: string[] = [];

        jsonData.forEach((row: any, index: number) => {
          const cnpj = String(row.CNPJ || '').replace(/\D/g, '');
          const regime = String(row.Regime || '').toLowerCase().replace(/\s+/g, '_');

          if (cnpj.length !== 14) {
            errors.push(`Linha ${index + 2}: CNPJ inválido (${row.CNPJ})`);
            return;
          }

          if (!validRegimes.includes(regime)) {
            errors.push(`Linha ${index + 2}: Regime inválido (${row.Regime}). Use: Normais ou Simples Nacional`);
            return;
          }

          if (cnpjRegimes.some(cr => cr.cnpj === cnpj)) {
            errors.push(`Linha ${index + 2}: CNPJ já existe (${cnpj})`);
            return;
          }

          importedRegimes.push({
            cnpj,
            regime: regime as 'lucro_real' | 'simples_nacional'
          });
        });

        // Salvar no banco de dados em lote
        if (importedRegimes.length > 0) {
          // Usar uma abordagem mais simples para importação em lote
          importedRegimes.forEach(regimeData => {
            saveCnpjRegimeMutation.mutate(regimeData);
          });
          
          toast({
            title: "Importação iniciada",
            description: `${importedRegimes.length} empresa(s) sendo processada(s).`,
          });
        }

        if (errors.length > 0) {
          toast({
            title: "Avisos na importação",
            description: `${errors.length} linha(s) com problemas. Verifique os dados.`,
            variant: "destructive",
          });
          console.warn('Erros na importação:', errors);
        }

      } catch (error) {
        toast({
          title: "Erro na importação",
          description: "Não foi possível processar o arquivo. Verifique o formato.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    
    // Limpar o input para permitir importar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmitPassword = (data: PasswordForm) => {
    if (!selectedCompany) return;

    if (data.password !== data.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setPasswordMutation.mutate({
      companyId: selectedCompany.id,
      password: data.password
    }, {
      onSuccess: () => {
        setIsPasswordDialogOpen(false);
        setSelectedCompany(null);
        reset();
      }
    });
  };

  const handleOperationAuthSuccess = () => {
    if (!operationAuthCompany) return;
    
    if (operationAuthCompany.operation === 'remove_password') {
      // Remover senha
      removePasswordMutation.mutate(operationAuthCompany.id);
    }
    
    setOperationAuthCompany(null);
    setIsOperationAuthModalOpen(false);
  };

  const handleOperationAuthCancel = () => {
    setOperationAuthCompany(null);
    setIsOperationAuthModalOpen(false);
  };

  const handlePasswordChangeAuthSuccess = () => {
    if (!passwordChangeAuthCompany) return;
    
    if (passwordChangeAuthCompany.operation === 'change') {
      // Abrir modal de alteração de senha
      setSelectedCompany({ id: passwordChangeAuthCompany.id, name: passwordChangeAuthCompany.name });
      setIsPasswordDialogOpen(true);
    } else if (passwordChangeAuthCompany.operation === 'remove') {
      // Remover senha diretamente
      removePasswordMutation.mutate(passwordChangeAuthCompany.id);
    }
    
    setPasswordChangeAuthCompany(null);
    setIsPasswordChangeAuthModalOpen(false);
  };

  const handlePasswordChangeAuthCancel = () => {
    setPasswordChangeAuthCompany(null);
    setIsPasswordChangeAuthModalOpen(false);
  };

  // Função para criar novo segmento
  const handleCreateSegment = () => {
    if (!newSegmentName.trim()) return;
    
    createSegmentMutation.mutate(newSegmentName, {
      onSuccess: (data) => {
        // Se havia uma empresa selecionada, atribuir o novo segmento a ela
        if (selectedCompanyForSegment) {
          updateCompanySegmentMutation.mutate({
            companyId: selectedCompanyForSegment,
            segmento: data.name
          });
        }
        
        setIsCreateSegmentDialogOpen(false);
        setNewSegmentName('');
        setSelectedCompanyForSegment('');
      }
    });
  };

  // Função para deletar segmento
  const handleDeleteSegment = (segmentId: string) => {
    deleteSegmentMutation.mutate(segmentId, {
      onSuccess: () => {
        setDeleteSegmentConfirm(null);
      }
    });
  };


  const hasPassword = (company: any) => {
    return company.company_passwords && company.company_passwords.id !== null;
  };

  // Filtrar empresas
  const filteredCompanies = companies?.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (company.cnpj && company.cnpj.includes(searchTerm));
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'protected' && hasPassword(company)) ||
                         (filterStatus === 'unprotected' && !hasPassword(company));
    
    return matchesSearch && matchesFilter;
  }) || [];

  // Calcular estatísticas
  const totalCompanies = companies?.length || 0;
  const protectedCompanies = companies?.filter(hasPassword).length || 0;
  const unprotectedCompanies = totalCompanies - protectedCompanies;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Opções
          </CardTitle>
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
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Opções
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações de segurança e regimes das empresas
        </p>
      </div>

      {/* Tabs para as subseções */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="regimes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Definir Regime das Empresas
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Segmentos das Empresas
          </TabsTrigger>
        </TabsList>

        {/* Subseção Segurança */}
        <TabsContent value="security" className="space-y-6">
          {/* Estatísticas de Segurança */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Empresas</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas Protegidas</p>
                <p className="text-2xl font-bold text-green-600">{protectedCompanies}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sem Proteção</p>
                <p className="text-2xl font-bold text-orange-600">{unprotectedCompanies}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Gerenciamento de Senhas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Gerenciamento de Senhas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure senhas de acesso para proteger os dados das empresas. Empresas com senha definida 
            exigirão autenticação para visualizar seus dados.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todas ({totalCompanies})
              </Button>
              <Button
                variant={filterStatus === 'protected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('protected')}
                className="text-green-600"
              >
                Protegidas
              </Button>
              <Button
                variant={filterStatus === 'unprotected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('unprotected')}
                className="text-orange-600"
              >
                Sem Proteção
              </Button>
            </div>
          </div>

          <Separator />

          {/* Tabela de Empresas */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Empresa</TableHead>
                  <TableHead className="font-semibold">CNPJ</TableHead>
                  <TableHead className="font-semibold">Status de Segurança</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">ID: {company.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {company.cnpj 
                          ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
                          : 'N/A'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      {hasPassword(company) ? (
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
                          <Lock className="h-3 w-3" />
                          Protegida
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-orange-600 border-orange-200">
                          <Key className="h-3 w-3" />
                          Sem senha
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetPassword(company)}
                          className="text-xs"
                        >
                          {hasPassword(company) ? 'Alterar Senha' : 'Definir Senha'}
                        </Button>
                        {hasPassword(company) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remover
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover senha</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover a senha da empresa "{company.name}"? 
                                  Após a remoção, os dados da empresa ficarão acessíveis sem autenticação.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemovePassword(company)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover Senha
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCompanies.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Não há empresas cadastradas no sistema.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

          {/* Dialog para definir/alterar senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {selectedCompany?.name && hasPassword(companies?.find(c => c.id === selectedCompany.id))
                ? 'Alterar Senha' 
                : 'Definir Senha'
              }
            </DialogTitle>
            <DialogDescription>
              {selectedCompany?.name && hasPassword(companies?.find(c => c.id === selectedCompany.id))
                ? `Altere a senha de acesso para a empresa "${selectedCompany.name}".`
                : `Defina uma senha de acesso para a empresa "${selectedCompany?.name}".`
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-6">
            {/* Informações da Empresa */}
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedCompany?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCompany?.id ? `ID: ${selectedCompany.id.slice(0, 8)}...` : ''}
                </p>
              </div>
            </div>

            {/* Campos de Senha */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: { value: 4, message: 'Senha deve ter pelo menos 4 caracteres' },
                      maxLength: { value: 50, message: 'Senha deve ter no máximo 50 caracteres' }
                    })}
                    placeholder="Digite a senha"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  {...register('confirmPassword', { 
                    required: 'Confirmação de senha é obrigatória',
                    validate: value => value === password || 'As senhas não coincidem'
                  })}
                  placeholder="Confirme a senha"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {/* Informações de Segurança */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Importante:</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    Após definir a senha, os dados desta empresa ficarão protegidos e será necessário 
                    inserir a senha sempre que quiser visualizar os dados.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPasswordDialogOpen(false);
                  setSelectedCompany(null);
                  reset();
                  setShowPassword(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={setPasswordMutation.isPending}
                className="min-w-[120px]"
              >
                {setPasswordMutation.isPending ? 'Salvando...' : 'Salvar Senha'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* Subseção Definir Regime das Empresas */}
        <TabsContent value="regimes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Definir Regime das Empresas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure os regimes tributários das empresas usando o formato Kanban ou importe uma planilha.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Botões de Importação/Exportação */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Baixar Template XLSX
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importar Planilha XLSX
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </div>

              <Separator />

              {/* Kanban Board */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['lucro_real', 'simples_nacional'].map((regime) => {
                  const regimeCompanies = getRegimeCompanies(regime);
                  const regimeKey = regime as 'lucro_real' | 'simples_nacional';
                  
                  return (
                    <Card key={regime} className="flex flex-col h-fit">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {getRegimeLabel(regime)}
                          </CardTitle>
                          <Badge variant="secondary">
                            {regimeCompanies.length}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddCnpjDialog(regimeKey)}
                          className="w-full mt-2"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Incluir CNPJ
                        </Button>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="space-y-2 min-h-[200px]">
                           {regimeCompanies.length > 0 ? (
                             regimeCompanies.map((company, index) => (
                               <div
                                 key={`${company.cnpj}-${index}`}
                                 className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                               >
                                 <div className="flex items-center gap-3">
                                   <Building2 className="h-4 w-4 text-primary" />
                                   <span className="font-mono text-sm">
                                     {formatCnpj(company.cnpj)}
                                   </span>
                                 </div>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => removeCnpjFromRegime(company.cnpj)}
                                   className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                                 >
                                   <X className="h-3 w-3" />
                                 </Button>
                               </div>
                             ))
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">Nenhuma empresa</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {cnpjRegimes.length === 0 && (
                <div className="text-center py-12">
                  <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-medium mb-2">Nenhum regime configurado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece adicionando CNPJs manualmente ou importe uma planilha com os dados das empresas.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => openAddCnpjDialog('lucro_real')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Primeira Empresa
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar Template
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog para adicionar CNPJ no Kanban */}
          <Dialog open={isAddCnpjDialogOpen} onOpenChange={setIsAddCnpjDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Incluir CNPJ - {getRegimeLabel(currentRegimeForAdd)}
                </DialogTitle>
                <DialogDescription>
                  Adicione um CNPJ ao regime {getRegimeLabel(currentRegimeForAdd)}.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tempCnpj">CNPJ da Empresa</Label>
                  <Input
                    id="tempCnpj"
                    placeholder="00.000.000/0000-00"
                    value={tempCnpj}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 14) {
                        setTempCnpj(value);
                      }
                    }}
                    maxLength={14}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddCnpjDialogOpen(false);
                    setTempCnpj('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addCnpjToRegimeFromKanban}
                  disabled={!tempCnpj.trim()}
                  className="min-w-[120px]"
                >
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Subseção Segmentos das Empresas */}
        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Segmentos das Empresas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gerencie os segmentos das empresas. Você pode selecionar segmentos existentes ou criar novos segmentos conforme necessário.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Lista de Segmentos Existentes - MOVIDO PARA O TOPO */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Segmentos Cadastrados</h3>
                  <Button
                    onClick={() => {
                      setSelectedCompanyForSegment('');
                      setIsCreateSegmentDialogOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Segmento
                  </Button>
                </div>
                
                {segments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {segments.map((segment) => {
                      const companiesInSegment = companies?.filter(c => c.segmento === segment.name) || [];
                      
                      return (
                        <Card key={segment.id} className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                {segment.name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {companiesInSegment.length}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteSegmentConfirm({ id: segment.id, name: segment.name })}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                                  title="Excluir segmento"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {companiesInSegment.length === 0 
                                ? 'Nenhuma empresa neste segmento'
                                : `${companiesInSegment.length} empresa(s) neste segmento`
                              }
                            </p>
                            {companiesInSegment.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {companiesInSegment.slice(0, 3).map(c => c.name).join(', ')}
                                {companiesInSegment.length > 3 && `... e mais ${companiesInSegment.length - 3}`}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum segmento cadastrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie segmentos para organizar suas empresas por categoria.
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedCompanyForSegment('');
                        setIsCreateSegmentDialogOpen(true);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Criar Primeiro Segmento
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Lista de Empresas com Segmentos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Atribuir Segmentos às Empresas</h3>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar empresa..."
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
                
                {companies && companies.length > 0 ? (
                  (() => {
                    // Filtrar empresas baseado no termo de pesquisa
                    const filteredCompanies = companies.filter(company => 
                      company.name.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
                      (company.cnpj && company.cnpj.includes(companySearchTerm)) ||
                      (company.segmento && company.segmento.toLowerCase().includes(companySearchTerm.toLowerCase()))
                    );

                    return (
                      <div className="space-y-4">
                        {filteredCompanies.length > 0 ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredCompanies.map((company) => (
                      <Card key={company.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <h4 className="font-medium">{company.name}</h4>
                          </div>
                          
                          {company.cnpj && (
                            <p className="text-sm text-muted-foreground">
                              CNPJ: {company.cnpj}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Select
                              value={company.segmento || 'none'}
                              onValueChange={(value) => {
                                if (value === 'new_segment') {
                                  setSelectedCompanyForSegment(company.id);
                                  setIsCreateSegmentDialogOpen(true);
                                } else {
                                  updateCompanySegmentMutation.mutate({
                                    companyId: company.id,
                                    segmento: value === 'none' ? '' : value
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="flex-1">
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
                                <SelectItem value="new_segment" className="text-primary">
                                  <div className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar novo segmento
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {company.segmento && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {company.segmento}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
                            <p className="text-muted-foreground">
                              Não há empresas que correspondam ao termo de pesquisa "{companySearchTerm}".
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma empresa encontrada</h3>
                    <p className="text-muted-foreground">
                      Não há empresas cadastradas no sistema.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dialog para criar novo segmento */}
          <Dialog open={isCreateSegmentDialogOpen} onOpenChange={setIsCreateSegmentDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Criar Novo Segmento
                </DialogTitle>
                <DialogDescription>
                  Digite o nome do novo segmento para sua empresa.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newSegmentName">Nome do Segmento</Label>
                  <Input
                    id="newSegmentName"
                    placeholder="Ex: Varejo, Indústria, Serviços..."
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSegmentName.trim()) {
                        handleCreateSegment();
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
                    setIsCreateSegmentDialogOpen(false);
                    setNewSegmentName('');
                    setSelectedCompanyForSegment('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateSegment}
                  disabled={!newSegmentName.trim() || createSegmentMutation.isPending}
                  className="min-w-[120px]"
                >
                  {createSegmentMutation.isPending ? 'Criando...' : 'Criar Segmento'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de confirmação para excluir segmento */}
          <AlertDialog open={!!deleteSegmentConfirm} onOpenChange={() => setDeleteSegmentConfirm(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Excluir Segmento
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o segmento "{deleteSegmentConfirm?.name}"?
                  {deleteSegmentConfirm && (
                    (() => {
                      const companiesInSegment = companies?.filter(c => c.segmento === deleteSegmentConfirm.name) || [];
                      return companiesInSegment.length > 0 ? (
                        <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                            Atenção: {companiesInSegment.length} empresa(s) estão neste segmento.
                          </p>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            Elas ficarão sem segmento após a exclusão.
                          </p>
                        </div>
                      ) : null;
                    })()
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDeleteSegmentConfirm(null)}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSegmentConfirm && handleDeleteSegment(deleteSegmentConfirm.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir Segmento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>

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

      {/* Modal de autenticação para alteração/remoção de senha */}
      <Dialog open={isPasswordChangeAuthModalOpen} onOpenChange={setIsPasswordChangeAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Confirmação de Senha
            </DialogTitle>
            <DialogDescription>
              Confirme sua senha atual para continuar
            </DialogDescription>
          </DialogHeader>
          {passwordChangeAuthCompany && (
            <PasswordChangeAuth
              companyName={passwordChangeAuthCompany.name}
              companyId={passwordChangeAuthCompany.id}
              operation={passwordChangeAuthCompany.operation}
              onSuccess={handlePasswordChangeAuthSuccess}
              onCancel={handlePasswordChangeAuthCancel}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
