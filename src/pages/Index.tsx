import { useState } from 'react';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ExcelUpload } from '@/components/ExcelUpload';
import { CompanyList } from '@/components/CompanyList';
import { CompanyDetails } from '@/components/CompanyDetails';
import { CompanyLucroRealDetails } from '@/components/CompanyLucroRealDetails';
import { CompanyProdutorRuralDetails } from '@/components/CompanyProdutorRuralDetails';
import { Settings } from '@/components/Settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
const Index = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>();
  const [activeSection, setActiveSection] = useState('companies');
  const [isLucroRealSection, setIsLucroRealSection] = useState(false);
  const [isProdutorRuralSection, setIsProdutorRuralSection] = useState(false);
  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };
  const handleBackToCompanies = () => {
    setSelectedCompanyId(undefined);
    setIsLucroRealSection(false);
    setIsProdutorRuralSection(false);
  };
  const renderContent = () => {
    switch (activeSection) {
      case 'import':
        return <ExcelUpload />;
      case 'companies':
        if (selectedCompanyId) {
          return <div className="space-y-4">
              {isLucroRealSection ? (
                <CompanyLucroRealDetails companyId={selectedCompanyId} onCompanyDeleted={handleBackToCompanies} onBack={handleBackToCompanies} />
              ) : isProdutorRuralSection ? (
                <CompanyProdutorRuralDetails companyId={selectedCompanyId} onCompanyDeleted={handleBackToCompanies} onBack={handleBackToCompanies} />
              ) : (
                <CompanyDetails companyId={selectedCompanyId} onBack={handleBackToCompanies} />
              )}
            </div>;
        }
        return <CompanyList onSelectCompany={handleSelectCompany} onLucroRealSelect={() => setIsLucroRealSection(true)} onProdutorRuralSelect={() => setIsProdutorRuralSection(true)} />;
      case 'settings':
        return <Settings />;
      default:
        return <CompanyList onSelectCompany={handleSelectCompany} onLucroRealSelect={() => setIsLucroRealSection(true)} onProdutorRuralSelect={() => setIsProdutorRuralSection(true)} />;
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight">
                {activeSection === 'import' && 'Importação de Dados'}
                {activeSection === 'companies' && (selectedCompanyId ? 'Detalhes da Empresa' : 'Empresas')}
                {activeSection === 'settings' && 'Configurações'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {activeSection === 'import' && 'Importe dados de planilhas Excel'}
                {activeSection === 'companies' && (selectedCompanyId ? 'Visualize todos os dados fiscais da empresa' : 'Gerencie empresas por regime tributário')}
                {activeSection === 'settings' && 'Gerencie senhas de acesso e configurações de segurança'}
              </p>
            </div>
          </header>
          
          <main className="flex-1 p-6">
            {renderContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default Index;