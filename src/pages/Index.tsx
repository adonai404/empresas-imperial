import { useState } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Dashboard } from '@/components/Dashboard';
import { ExcelUpload } from '@/components/ExcelUpload';
import { CompanyList } from '@/components/CompanyList';
import { CompanyDetails } from '@/components/CompanyDetails';
import { CompanyLucroRealDetails } from '@/components/CompanyLucroRealDetails';
import { Settings } from '@/components/Settings';
import { Systems } from '@/components/Systems';
import { PdfBatchUpload } from '@/components/PdfBatchUpload';
import { OperationalCalendar } from '@/components/OperationalCalendar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Index = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isLucroRealSection, setIsLucroRealSection] = useState(false);
  const [selectedResponsavelId, setSelectedResponsavelId] = useState<string | null>(null);
  
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };
  
  const handleBackToCompanies = () => {
    setSelectedCompanyId(undefined);
    setIsLucroRealSection(false);
  };
  
  // Nova função para voltar apenas para a empresa selecionada, mantendo o contexto da aba
  const handleBackToPrevious = () => {
    setSelectedCompanyId(undefined);
    // Não resetamos isLucroRealSection para manter o contexto da aba
  };
  
  const handleResponsavelSelect = (responsavelId: string) => {
    setSelectedResponsavelId(responsavelId);
    // Quando um responsável é selecionado, vamos para a seção de responsáveis
    setActiveSection('responsavel');
  };
  
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveSection} />;
      case 'responsavel':
        // Para a seção "Por Responsável", precisamos mostrar o CompanyList com o regime "responsavel" selecionado
        if (selectedCompanyId) {
          return (
            <div className="space-y-4">
              {isLucroRealSection ? (
                <CompanyLucroRealDetails companyId={selectedCompanyId} onCompanyDeleted={handleBackToCompanies} onBack={handleBackToPrevious} />
              ) : (
                <CompanyDetails companyId={selectedCompanyId} onBack={handleBackToPrevious} />
              )}
            </div>
          );
        }
        return <CompanyList 
          onSelectCompany={handleSelectCompany} 
          onLucroRealSelect={() => setIsLucroRealSection(true)} 
          defaultRegime="responsavel"
          selectedResponsavelId={selectedResponsavelId}
        />;
      case 'companies':
        if (selectedCompanyId) {
          return (
            <div className="space-y-4">
              {isLucroRealSection ? (
                <CompanyLucroRealDetails companyId={selectedCompanyId} onCompanyDeleted={handleBackToCompanies} onBack={handleBackToPrevious} />
              ) : (
                <CompanyDetails companyId={selectedCompanyId} onBack={handleBackToPrevious} />
              )}
            </div>
          );
        }
        return (
          <CompanyList 
            onSelectCompany={handleSelectCompany} 
            onLucroRealSelect={() => setIsLucroRealSection(true)} 
            selectedResponsavelId={selectedResponsavelId}
            onResponsavelBack={() => setSelectedResponsavelId(null)}
          />
        );
      case 'systems':
        return <Systems />;
      case 'operational-calendar':
        return <OperationalCalendar />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <CompanyList 
            onSelectCompany={handleSelectCompany} 
            onLucroRealSelect={() => setIsLucroRealSection(true)} 
            selectedResponsavelId={selectedResponsavelId}
            onResponsavelBack={() => setSelectedResponsavelId(null)}
          />
        );
    }
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
          onResponsavelSelect={handleResponsavelSelect}
        />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {activeSection === 'dashboard' && 'Página Inicial'}
                {activeSection === 'responsavel' && (selectedCompanyId ? 'Detalhes da Empresa' : 'Empresas por Responsável')}
                {activeSection === 'companies' && (selectedCompanyId ? 'Detalhes da Empresa' : 'Empresas')}
                {activeSection === 'settings' && 'Configurações'}
                {activeSection === 'systems' && 'Sistemas'}
                {activeSection === 'operational-calendar' && 'Calendário de Tarefas Operacionais'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeSection === 'dashboard' && 'Visão geral do sistema e estatísticas fiscais'}
                {activeSection === 'responsavel' && (selectedCompanyId ? 'Visualize todos os dados fiscais da empresa' : 'Gerencie empresas por responsável')}
                {activeSection === 'companies' && (selectedCompanyId ? 'Visualize todos os dados fiscais da empresa' : 'Gerencie empresas por regime tributário')}
                {activeSection === 'settings' && 'Gerencie senhas de acesso e configurações de segurança'}
                {activeSection === 'systems' && 'Gerencie seus sistemas e links de acesso'}
                {activeSection === 'operational-calendar' && 'Gerencie tarefas operacionais organizadas por período'}
              </p>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;