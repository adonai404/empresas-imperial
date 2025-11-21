import { useState } from "react";
import { Upload, Building2, Settings, User, Wrench, Calendar, Home } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { useResponsaveis } from "@/hooks/useFiscalData";
interface AppSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onResponsavelSelect?: (responsavelId: string) => void;
}
const sections = [
  {
    id: "dashboard",
    title: "Página Inicial",
    icon: Home,
  },
  {
    id: "companies",
    title: "Empresas",
    icon: Building2,
  },
  {
    id: "settings",
    title: "Opções",
    icon: Settings,
  },
];
const utilitiesSubSections = [
  {
    id: "systems",
    title: "Processos",
    icon: Wrench,
  },
  {
    id: "operational-calendar",
    title: "Calendário",
    icon: Calendar,
  },
];
export function AppSidebar({ activeSection, onSectionChange, onResponsavelSelect }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const isActive = (sectionId: string) => activeSection === sectionId;
  const isCollapsed = state === "collapsed";
  const { data: responsaveis } = useResponsaveis();
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between p-4">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">Hub Fiscal </h2>
          </div>
        )}
        <ThemeToggle />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sections.map((section) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>Utilitários</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {utilitiesSubSections.map((subSection) => (
                <SidebarMenuItem key={subSection.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(subSection.id)}
                    isActive={isActive(subSection.id)}
                    className="w-full justify-start"
                  >
                    <subSection.icon className="h-4 w-4" />
                    {!isCollapsed && <span>{subSection.title}</span>}
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
                {responsaveis.map((responsavel) => (
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
