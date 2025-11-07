import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLucroRealEvolutionData } from '@/hooks/useFiscalData';
import { TrendingUp, TrendingDown, Filter, X, Building2 } from 'lucide-react';

const chartConfig = {
  entradas: {
    label: 'Entradas',
    theme: {
      light: 'hsl(142, 76%, 36%)',
      dark: 'hsl(142, 70%, 45%)',
    },
  },
  saidas: {
    label: 'Saídas',
    theme: {
      light: 'hsl(0, 84%, 60%)',
      dark: 'hsl(0, 84%, 60%)',
    },
  },
  servicos: {
    label: 'Serviços',
    theme: {
      light: 'hsl(270, 100%, 60%)',
      dark: 'hsl(270, 100%, 60%)',
    },
  },
  imposto: {
    label: 'Total Impostos',
    theme: {
      light: 'hsl(38, 92%, 50%)',
      dark: 'hsl(38, 92%, 50%)',
    },
  },
  pis: {
    label: 'PIS',
    theme: {
      light: 'hsl(217, 91%, 60%)',
      dark: 'hsl(217, 91%, 60%)',
    },
  },
  cofins: {
    label: 'COFINS',
    theme: {
      light: 'hsl(280, 100%, 70%)',
      dark: 'hsl(280, 100%, 70%)',
    },
  },
  icms: {
    label: 'ICMS',
    theme: {
      light: 'hsl(24, 100%, 50%)',
      dark: 'hsl(24, 100%, 50%)',
    },
  },
};

interface CompanyLucroRealEvolutionChartProps {
  companyId: string;
  companyName: string;
  className?: string;
}

export const CompanyLucroRealEvolutionChart = ({ 
  companyId, 
  companyName, 
  className 
}: CompanyLucroRealEvolutionChartProps) => {
  const { data: evolutionData, isLoading, error } = useLucroRealEvolutionData(companyId);
  const [yearFilter, setYearFilter] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [showDetailedTaxes, setShowDetailedTaxes] = useState(false);

  const availableYears = useMemo(() => {
    if (!evolutionData) return [];
    
    const years = new Set<string>();
    evolutionData.forEach(item => {
      const year = item.period.split('/').pop() || item.period.split('-')[0];
      if (year && year.length === 4) {
        years.add(year);
      }
    });
    
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [evolutionData]);

  const chartData = useMemo(() => {
    if (!evolutionData) return [];

    let filteredData = evolutionData;
    
    if (yearFilter !== 'todos') {
      filteredData = evolutionData.filter(item => 
        item.period.includes(yearFilter)
      );
    }

    return filteredData;
  }, [evolutionData, yearFilter]);

  const totals = useMemo(() => {
    if (!chartData.length) return { 
      entradas: 0, 
      saidas: 0, 
      servicos: 0,
      imposto: 0,
      pis: 0,
      cofins: 0,
      icms: 0,
      irpj_primeiro_trimestre: 0,
      csll_primeiro_trimestre: 0,
      irpj_segundo_trimestre: 0,
      csll_segundo_trimestre: 0
    };
    
    return chartData.reduce(
      (acc, curr) => ({
        entradas: acc.entradas + (curr.entradas || 0),
        saidas: acc.saidas + (curr.saidas || 0),
        servicos: acc.servicos + (curr.servicos || 0),
        imposto: acc.imposto + (curr.imposto || 0),
        pis: acc.pis + (curr.pis || 0),
        cofins: acc.cofins + (curr.cofins || 0),
        icms: acc.icms + (curr.icms || 0),
        irpj_primeiro_trimestre: acc.irpj_primeiro_trimestre + (curr.irpj_primeiro_trimestre || 0),
        csll_primeiro_trimestre: acc.csll_primeiro_trimestre + (curr.csll_primeiro_trimestre || 0),
        irpj_segundo_trimestre: acc.irpj_segundo_trimestre + (curr.irpj_segundo_trimestre || 0),
        csll_segundo_trimestre: acc.csll_segundo_trimestre + (curr.csll_segundo_trimestre || 0),
      }),
      { 
        entradas: 0, 
        saidas: 0, 
        servicos: 0,
        imposto: 0,
        pis: 0,
        cofins: 0,
        icms: 0,
        irpj_primeiro_trimestre: 0,
        csll_primeiro_trimestre: 0,
        irpj_segundo_trimestre: 0,
        csll_segundo_trimestre: 0
      }
    );
  }, [chartData]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal - {companyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal - {companyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-destructive">Erro ao carregar dados do gráfico</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Fiscal - {companyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-muted-foreground">Nenhum dado fiscal disponível para esta empresa</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Evolução Fiscal - {companyName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailedTaxes(!showDetailedTaxes)}
              className="relative"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {showDetailedTaxes ? 'Impostos Básicos' : 'Impostos Detalhados'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {(yearFilter !== 'todos') && (
                <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"></div>
              )}
            </Button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Filtrar por Ano</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setYearFilter('todos');
                    setShowFilters(false);
                  }}
                  className="h-10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Total Entradas
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {(totals.entradas || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              Total Saídas
            </div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {(totals.saidas || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              Total Serviços
            </div>
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {(totals.servicos || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              Total Impostos
            </div>
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {(totals.imposto || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              })}
            </div>
          </div>
        </div>

        {showDetailedTaxes && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                PIS
              </div>
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {(totals.pis || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                COFINS
              </div>
              <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                {(totals.cofins || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                ICMS
              </div>
              <div className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                {(totals.icms || 0).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                IRPJ + CSLL
              </div>
              <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                {((totals.irpj_primeiro_trimestre || 0) + (totals.csll_primeiro_trimestre || 0) + (totals.irpj_segundo_trimestre || 0) + (totals.csll_segundo_trimestre || 0)).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })}
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[500px] w-full">
          <LineChart data={chartData} margin={{ top: 20, right: 50, left: 50, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="period" 
              className="text-xs fill-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickFormatter={(value) => 
                value.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                })
              }
            />
            <ChartTooltip 
              content={<ChartTooltipContent 
                formatter={(value, name) => [
                  (value as number).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }),
                  chartConfig[name as keyof typeof chartConfig]?.label || name
                ]}
              />} 
            />
            <ChartLegend 
              content={<ChartLegendContent nameKey="dataKey" />}
              className="mt-4"
            />
            <Line
              type="monotone"
              dataKey="entradas"
              stroke="var(--color-entradas)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-entradas)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-entradas)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="saidas"
              stroke="var(--color-saidas)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-saidas)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-saidas)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="servicos"
              stroke="var(--color-servicos)"
              strokeWidth={2}
              dot={{ fill: 'var(--color-servicos)', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: 'var(--color-servicos)', strokeWidth: 2 }}
            />
            {!showDetailedTaxes ? (
              <Line
                type="monotone"
                dataKey="imposto"
                stroke="var(--color-imposto)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-imposto)', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: 'var(--color-imposto)', strokeWidth: 2 }}
              />
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="pis"
                  stroke="var(--color-pis)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-pis)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--color-pis)', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="cofins"
                  stroke="var(--color-cofins)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-cofins)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--color-cofins)', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="icms"
                  stroke="var(--color-icms)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-icms)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--color-icms)', strokeWidth: 2 }}
                />
              </>
            )}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
