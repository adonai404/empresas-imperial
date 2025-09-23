import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Building2, Eye, Lock, Trash2 } from 'lucide-react';
import { useCompanies, useDeleteCompany } from '@/hooks/useFiscalData';
import { CompanyPasswordAuth } from './CompanyPasswordAuth';
import { CompanyOperationAuth } from './CompanyOperationAuth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface LucroRealListProps {
  onSelectCompany?: (companyId: string) => void;
}

export const LucroRealList = ({ onSelectCompany }: LucroRealListProps) => {
  const [passwordAuthCompany, setPasswordAuthCompany] = useState<{ id: string; name: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [operationAuthCompany, setOperationAuthCompany] = useState<{ id: string; name: string; operation: 'delete' } | null>(null);
  const [isOperationAuthModalOpen, setIsOperationAuthModalOpen] = useState(false);
  const [deleteConfirmCompany, setDeleteConfirmCompany] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);

  const { data: companies, isLoading } = useCompanies();
  const deleteCompanyMutation = useDeleteCompany();

  // Filtrar apenas empresas do regime lucro_real
  const lucroRealCompanies = companies?.filter(company => company.regime_tributario === 'lucro_real') || [];

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Empresas Lucro Real</CardTitle>
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
                Empresas Lucro Real ({lucroRealCompanies.length})
              </CardTitle>
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
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">CNPJ</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden lg:table-cell">Segmento</TableHead>
                  <TableHead className="border-r border-border font-semibold text-foreground w-24 hidden sm:table-cell">Regime</TableHead>
                  <TableHead className="w-12 font-semibold text-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lucroRealCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground/50" />
                        <p>Nenhuma empresa do regime Lucro Real encontrada</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  lucroRealCompanies.map((company, index) => (
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
                      <TableCell className="border-r border-border text-muted-foreground text-sm hidden sm:table-cell">
                        {company.cnpj ? company.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5') : 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-border text-muted-foreground text-sm hidden lg:table-cell">
                        {company.segmento ? (
                          <Badge variant="secondary" className="text-xs">
                            {company.segmento}
                          </Badge>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell className="border-r border-border text-muted-foreground text-sm hidden sm:table-cell">
                        <Badge variant="secondary" className="text-xs">
                          Lucro Real
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompanyClick(company);
                            }}
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
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
      {passwordAuthCompany && (
        <CompanyPasswordAuth
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setPasswordAuthCompany(null);
          }}
          onSuccess={handlePasswordSuccess}
          companyId={passwordAuthCompany.id}
          companyName={passwordAuthCompany.name}
        />
      )}

      {/* Modal de autenticação para operações */}
      {operationAuthCompany && (
        <CompanyOperationAuth
          isOpen={isOperationAuthModalOpen}
          onClose={() => {
            setIsOperationAuthModalOpen(false);
            setOperationAuthCompany(null);
          }}
          onSuccess={handleOperationAuthSuccess}
          companyId={operationAuthCompany.id}
          companyName={operationAuthCompany.name}
          operation={operationAuthCompany.operation}
        />
      )}

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
    </div>
  );
};