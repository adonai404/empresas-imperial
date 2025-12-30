import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFiscalStats } from '@/hooks/useFiscalData';
import { Building2, Upload, Settings, Wrench, Calendar, FileText, Users, AlertCircle, PauseCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardProps {
  onNavigate?: (section: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const {
    data: stats,
    isLoading,
    error
  } = useFiscalStats();
  if (isLoading) {
    return <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>)}
        </div>
      </div>;
  }
  if (error) {
    return <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Erro ao carregar informações</p>
        </CardContent>
      </Card>;
  }

  const empresasAtivas = stats?.empresasAtivas || 0;
  const empresasParalisadas = stats?.empresasParalisadas || 0;
  const empresasSemMovimento = stats?.empresasSemMovimento || 0;

  const quickActions = [
    {
      id: 'companies',
      title: 'Gerenciar Empresas',
      description: 'Visualize e gerencie todas as empresas cadastradas',
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: 'operational-calendar',
      title: 'Calendário de Tarefas',
      description: 'Gerencie tarefas operacionais e prazos',
      icon: Calendar,
      color: 'text-orange-600 dark:text-orange-400'
    },
    {
      id: 'systems',
      title: 'Sistemas',
      description: 'Acesse sistemas e links externos',
      icon: Wrench,
      color: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      id: 'settings',
      title: 'Configurações',
      description: 'Configure senhas e opções do sistema',
      icon: Settings,
      color: 'text-gray-600 dark:text-gray-400'
    }
  ];

  return <div className="space-y-6">
      {/* Bem-vindo */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bem-vindo ao Hub Fiscal</h2>
        <p className="text-muted-foreground">
          Acesso rápido às principais funcionalidades do sistema
        </p>
      </div>

      {/* Atalhos Rápidos */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Atalhos Rápidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Card key={action.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate?.(action.id)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <action.icon className={`h-8 w-8 ${action.color}`} />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full">
                  Acessar →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Status das Empresas */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Status das Empresas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {empresasAtivas}
            </div>
            <p className="text-xs text-muted-foreground">
              em funcionamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Paralisadas</CardTitle>
            <PauseCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {empresasParalisadas}
            </div>
            <p className="text-xs text-muted-foreground">
              temporariamente paralisadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Movimento</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {empresasSemMovimento}
            </div>
            <p className="text-xs text-muted-foreground">
              sem atividade fiscal
            </p>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>;
};