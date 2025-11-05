import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useLucroPresumidoDataByCompany } from '@/hooks/useFiscalData';
import { TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const chartConfig = {
  entradas: {
    label: 'Entradas',
    color: 'hsl(var(--chart-1))',
  },
  saidas: {
    label: 'Saídas',
    color: 'hsl(var(--chart-2))',
  },
  servicos: {
    label: 'Serviços',
    color: 'hsl(var(--chart-3))',
  },
};

interface CompanyLucroPresumidoEvolutionChartProps {
  companyId: string;
  companyName: string;
  className?: string;
}

export const CompanyLucroPresumidoEvolutionChart = ({
  companyId,
  companyName,
  className,
}: CompanyLucroPresumidoEvolutionChartProps) => {
  const { data: lucroPresumidoData, isLoading, error } = useLucroPresumidoDataByCompany(companyId);
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const availableYears = useMemo(() => {
    if (!lucroPresumidoData) return [];
    const years = new Set<string>();
    lucroPresumidoData.forEach((item) => {
      const yearMatch = item.period.match(/\d{4}/);
      if (yearMatch) {
        years.add(yearMatch[0]);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [lucroPresumidoData]);

  const chartData = useMemo(() => {
    if (!lucroPresumidoData) return [];

    let filtered = lucroPresumidoData;

    if (yearFilter !== 'all') {
      filtered = filtered.filter((item) => item.period.includes(yearFilter));
    }

    return filtered
      .map((item) => ({
        period: item.period,
        entradas: item.entradas || 0,
        saidas: item.saidas || 0,
        servicos: item.servicos || 0,
      }))
      .sort((a, b) => {
        const [monthA, yearA] = a.period.split('/');
        const [monthB, yearB] = b.period.split('/');
        return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() -
               new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
      });
  }, [lucroPresumidoData, yearFilter]);

  const totals = useMemo(() => {
    if (!chartData.length) return { entradas: 0, saidas: 0, servicos: 0 };
    return chartData.reduce(
      (acc, curr) => ({
        entradas: acc.entradas + curr.entradas,
        saidas: acc.saidas + curr.saidas,
        servicos: acc.servicos + curr.servicos,
      }),
      { entradas: 0, saidas: 0, servicos: 0 }
    );
  }, [chartData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/3 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
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
          <CardDescription>Dados de Lucro Presumido ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Nenhum dado disponível para exibir</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Fiscal - {companyName}
            </CardTitle>
            <CardDescription>Lucro Presumido - Entradas, Saídas e Serviços</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>

        {showFilters && (
          <div className="flex gap-4 mt-4">
            <div className="flex-1">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Entradas</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.entradas)}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Saídas</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.saidas)}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Total Serviços</p>
            <p className="text-lg font-semibold">{formatCurrency(totals.servicos)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="period"
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="entradas"
                stroke="var(--color-entradas)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-entradas)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Entradas"
              />
              <Line
                type="monotone"
                dataKey="saidas"
                stroke="var(--color-saidas)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-saidas)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Saídas"
              />
              <Line
                type="monotone"
                dataKey="servicos"
                stroke="var(--color-servicos)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-servicos)', r: 4 }}
                activeDot={{ r: 6 }}
                name="Serviços"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
