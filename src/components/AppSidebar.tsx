import { useState } from "react";
import { Upload, Building2, Settings, User, Wrench } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useResponsaveis } from "@/hooks/useFiscalData";

interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onResponsavelSelect?: (responsavelId: string) => void;
}

const sections = [{
  id: "companies",
  title: "Empresas",
  icon: Building2
}, {
  id: "import",
  title: "Importação",
  icon: Upload
}, {
  id: "utilities",
  title: "Utilitários",
  icon: Wrench
}, {
  id: "settings",
  title: "Opções",
  icon: Settings
}];

export function AppSidebar({
  activeSection,
  onSectionChange,
  onResponsavelSelect
}: AppSidebarProps) {
  const {
    state
  } = useSidebar();
  const location = useLocation();
  const isActive = (sectionId: string) => activeSection === sectionId;
  const isCollapsed = state === 'collapsed';
  
  const { data: responsaveis } = useResponsaveis();

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-border w-56 data-[state=collapsed]:w-16">
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Empresas</h2>
          </div>
        )}
        <ThemeToggle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map(section => (
                <SidebarMenuItem key={section.id}>
                  <SidebarMenuButton 
                    onClick={() => onSectionChange(section.id)} 
                    isActive={isActive(section.id)} 
                    className="w-full justify-start"
                  >
                    <section.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{section.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {responsaveis && responsaveis.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Por Responsável</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {responsaveis.map(responsavel => (
                  <SidebarMenuItem key={responsavel.id}>
                    <SidebarMenuButton 
                      onClick={() => {
                        // Usar um pequeno atraso para garantir que a seção seja alterada antes de selecionar o responsável
                        setTimeout(() => {
                          if (onResponsavelSelect) {
                            onResponsavelSelect(responsavel.id);
                          }
                        }, 100);
                      }} 
                      isActive={false}
                      className="w-full justify-start"
                    >
                      <User className="h-4 w-4" />
                      {!isCollapsed && <span className="truncate">{responsavel.nome}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}