import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Edit, Lock, Trash2, ArrowLeft, Search, Filter, CheckCircle, PauseCircle, AlertCircle, User } from 'lucide-react';
import { useResponsaveis, useCompaniesByResponsavel, useDeleteCompany, useUpdateCompanyStatus, useUpdateCompany, useSegments, useCreateResponsavel } from '@/hooks/useFiscalData';
import { CompanyPasswordAuth } from './CompanyPasswordAuth';
import { CompanyOperationAuth } from './CompanyOperationAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ResponsavelListProps {
  onSelectCompany?: (companyId: string) => void;
  onBack?: () => void;
}

export const ResponsavelList = ({ onSelectCompany, onBack }: ResponsavelListProps) => {
  const [selectedResponsavel, setSelectedResponsavel] = useState<any>(null);
  const [passwordAuthCompany, setPasswordAuthCompany] = useState<{ id: string; name: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [operationAuthCompany, setOperationAuthCompany] = useState<{ id: string; name: string; operation: 'delete' } | null>(null);
  const [isOperationAuthModalOpen, setIsOperationAuthModalOpen] = useState(false);
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSegment, setSelectedSegment] = useState('');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<{ id: string; name: string; cnpj: string; segmento: string; regime_tributario: string } | null>(null);

  const { data: responsaveis, isLoading: isLoadingResponsaveis } = useResponsaveis();
  const { data: companies = [], isLoading: isLoadingCompanies } = useCompaniesByResponsavel(selectedResponsavel?.id || '');
  const { data: segments = [] } = useSegments();
  const deleteCompanyMutation = useDeleteCompany();
  const updateCompanyMutation = useUpdateCompanyStatus();
  const updateCompanyInfoMutation = useUpdateCompany();

  // Aplicar filtros de busca e segmento
  const filteredCompanies = companies.filter((company: any) => {
    const matchesSearch = !searchTerm || 
      company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.cnpj?.includes(searchTerm);
    
    const matchesSegment = !selectedSegment || company.segmento === selectedSegment;
    
    return matchesSearch && matchesSegment;
  });

  // Obter segmentos únicos para o filtro
  const availableSegments = [...new Set(companies.map((company: any) => company.segmento).filter(Boolean))];

  const handleResponsavelSelect = (responsavel: any) => {
    setSelectedResponsavel(responsavel);
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
    
    updateCompanyMutation.mutate({
      companyId: selectedCompany.id,
      sem_movimento
    }, {
      onSuccess: () => {
        setStatusModalOpen(false);
        setSelectedCompany(null);
      }
    });
  };

  const handleEditCompany = (company: any) => {
    setEditingCompany({
      id: company.id,
      name: company.name,
      cnpj: company.cnpj || '',
      segmento: company.segmento || '',
      regime_tributario: company.regime_tributario || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateCompany = () => {
    if (!editingCompany) return;

    updateCompanyInfoMutation.mutate({
      companyId: editingCompany.id,
      name: editingCompany.name,
      cnpj: editingCompany.cnpj || undefined,
      segmento: editingCompany.segmento || undefined,
      regime_tributario: editingCompany.regime_tributario as 'lucro_real' | 'simples_nacional' | 'produtor_rural' || undefined,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingCompany(null);
      }
    });
  };

  const handlePasswordSuccess = () => {
    if (passwordAuthCompany && onSelectCompany) {
      onSelectCompany(passwordAuthCompany.id);
    }
    setIsAuthModalOpen(false);
    setPasswordAuthCompany(null);
  };

  const handleDeleteCompany = (company: any) => {
    if (hasPassword(company)) {
      setOperationAuthCompany({ id: company.id, name: company.name, operation: 'delete' });
      setIsOperationAuthModalOpen(true);
    } else {
      setDeleteConfirmCompany({ id: company.id, name: company.name });
      setIsDeleteConfirmModalOpen(true);
    }
  };

  const handleOperationAuthSuccess = () => {
    if (operationAuthCompany) {
      setDeleteConfirmCompany({ id: operationAuthCompany.id, name: operationAuthCompany.name });
      setIsDeleteConfirmModalOpen(true);
    }
    setIsOperationAuthModalOpen(false);
    setOperationAuthCompany(null);
  };

  const confirmDeleteCompany = async () => {
    if (!deleteConfirmCompany) return;

    try {
      await deleteCompanyMutation.mutateAsync(deleteConfirmCompany.id);
      setIsDeleteConfirmModalOpen(false);
      setDeleteConfirmCompany(null);
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  if (isLoadingResponsaveis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Responsáveis</CardTitle>
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

  // Tela inicial de seleção de responsável
  if (!selectedResponsavel) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                )}
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Responsáveis
                </CardTitle>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome do responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/50 backdrop-blur-sm">
                    <TableHead className="border-r border-border font-semibold text-foreground w-8 text-center">#</TableHead>
                    <TableHead className="border-r border-border font-semibold text-foreground min-w-0 flex-1">Nome do Responsável</TableHead>
                    <TableHead className="border-r border-border font-semibold text-foreground w-24 text-center">Empresas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responsaveis && responsaveis.length > 0 ? (
                    responsaveis
                      .filter((responsavel: any) => 
                        !searchTerm || responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((responsavel: any, index: number) => (
                        <TableRow 
                          key={responsavel.id}
                          className="cursor-pointer hover:bg-accent transition-colors border-b border-border bg-muted/30"
                          onClick={() => handleResponsavelSelect(responsavel)}
                        >
                          <TableCell className="border-r border-border text-center text-muted-foreground font-mono text-sm w-8">
                            {index + 1}
                          </TableCell>
                          <TableCell className="border-r border-border font-medium text-foreground min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="truncate">{responsavel.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell className="border-r border-border text-center text-foreground w-24">
                            <Badge variant="secondary">
                              {responsavel.id ? 'Carregando...' : '0'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <User className="h-8 w-8 text-muted-foreground/50" />
                          <p>Nenhum responsável encontrado</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lista de empresas por responsável
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedResponsavel(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Empresas de {selectedResponsavel.nome} ({filteredCompanies.length})
                </CardTitle>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou CNPJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[150px]"
                  >
                    <option value="">Todos os segmentos</option>
                    {availableSegments.map((segment: any) => (
                      <option key={segment} value={segment}>{segment}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/50 backdrop-blur-sm">
                  <TableHead className="border-r border-border font-semibold text-foreground w-8 text-center">#</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground min-w-0 flex-1">Empresa</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-40 hidden sm:table-cell">CNPJ</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-36">Segmento</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-36">Regime Tributário</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24">Situação</TableHead>
                  <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground/50" />
                        <p>
                          {companies.length === 0 
                            ? "Nenhuma empresa encontrada para este responsável"
                            : "Nenhuma empresa encontrada com os filtros aplicados"
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company: any, index: number) => (
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
                          <span className="truncate">{company.name || 'N/A'}</span>
                          {hasPassword(company) && (
                            <div className="flex items-center gap-1">
                              <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border text-muted-foreground text-sm hidden sm:table-cell whitespace-nowrap">
                        {company.cnpj ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-border text-muted-foreground text-sm">
                        {company.segmento ? (
                          <Badge variant="secondary" className="text-xs">
                            {company.segmento}
                          </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-border text-muted-foreground text-sm">
                        {company.regime_tributario ? (
                          <Badge variant="outline" className="text-xs capitalize">
                            {company.regime_tributario.replace('_', ' ')}
                          </Badge>
                        ) : 'N/A'}
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCompany(company);
                            }}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCompany(company);
                            }}
                            className="h-8 w-8 p-0 hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de autenticação por senha */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acesso Protegido</DialogTitle>
            <DialogDescription>
              Esta empresa possui proteção por senha. Insira a senha para continuar.
            </DialogDescription>
          </DialogHeader>
          {passwordAuthCompany && (
            <CompanyPasswordAuth
              companyId={passwordAuthCompany.id}
              companyName={passwordAuthCompany.name}
              onSuccess={handlePasswordSuccess}
              onCancel={() => setIsAuthModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de autenticação para operações */}
      <Dialog open={isOperationAuthModalOpen} onOpenChange={setIsOperationAuthModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Operação Protegida</DialogTitle>
            <DialogDescription>
              Esta operação requer autenticação.
            </DialogDescription>
          </DialogHeader>
          {operationAuthCompany && (
            <CompanyOperationAuth
              companyId={operationAuthCompany.id}
              companyName={operationAuthCompany.name}
              operation={operationAuthCompany.operation}
              onSuccess={handleOperationAuthSuccess}
              onCancel={() => setIsOperationAuthModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={isDeleteConfirmModalOpen} onOpenChange={setIsDeleteConfirmModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>{deleteConfirmCompany?.name}</strong>?
              <br />
              <br />
              Esta ação irá remover permanentemente:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Dados da empresa</li>
                <li>Todos os dados fiscais associados</li>
                <li>Histórico de períodos</li>
              </ul>
              <br />
              <strong>Esta ação não pode ser desfeita.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteCompanyMutation.isPending}
            >
              {deleteCompanyMutation.isPending ? 'Excluindo...' : 'Excluir Empresa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Alteração de Situação */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              Alterar Situação
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
              disabled={updateCompanyMutation.isPending}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Empresa *</Label>
              <Input
                id="edit-name"
                value={editingCompany?.name || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cnpj">CNPJ</Label>
              <Input
                id="edit-cnpj"
                value={editingCompany?.cnpj || ''}
                onChange={(e) => setEditingCompany(prev => prev ? { ...prev, cnpj: e.target.value } : null)}
                placeholder="00.000.000/0000-00 (opcional)"
                maxLength={18}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-segmento">Segmento</Label>
              <Select
                value={editingCompany?.segmento || 'none'}
                onValueChange={(value) => setEditingCompany(prev => prev ? { ...prev, segmento: value === 'none' ? '' : value } : null)}
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-regime">Regime Tributário</Label>
              <Select 
                value={editingCompany?.regime_tributario || ''}
                onValueChange={(value) => setEditingCompany(prev => prev ? { ...prev, regime_tributario: value } : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime tributário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="lucro_real">Normais</SelectItem>
                  <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                  <SelectItem value="produtor_rural">Produtor Rural</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCompany(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleUpdateCompany}
              disabled={updateCompanyInfoMutation.isPending || !editingCompany?.name}
            >
              {updateCompanyInfoMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};