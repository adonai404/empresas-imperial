import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, ExternalLink, Download } from 'lucide-react';
import { useImportExcel, useImportLucroRealExcel } from '@/hooks/useFiscalData';
import * as XLSX from 'xlsx';

export const ExcelUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [dataType, setDataType] = useState<'simples_nacional' | 'lucro_real'>('simples_nacional');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportExcel();
  const importLucroRealMutation = useImportLucroRealExcel();

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Check data type based on columns
      const firstRow = jsonData[0] as any;
      const hasLucroRealColumns = firstRow && (
        'PIS' in firstRow || 'COFINS' in firstRow || 'ICMS' in firstRow ||
        'IRPJ 1º trimestre' in firstRow || 'CSLL 1º trimestre' in firstRow
      );
      
      if (hasLucroRealColumns) {
        // Process Lucro Real data
        const processedLucroRealData = jsonData.map((row: any) => {
          const parseNumber = (value: any): number | null => {
            if (value === null || value === undefined || value === '') return null;
            const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
            return isNaN(parsed) ? null : parsed;
          };

          return {
            empresa: String(row.Empresa || row.empresa || '').trim(),
            cnpj: String(row.CNPJ || row.cnpj || '').replace(/\D/g, ''),
            periodo: String(row.Competência || row.competência || row.competencia || row.Período || row.periodo || row.Periodo || '').trim(),
            entradas: parseNumber(row.Entradas || row.entradas),
            saidas: parseNumber(row.Saídas || row.saídas || row.saidas || row.Saidas),
            servicos: parseNumber(row.Serviços || row.servicos || row.Servicos),
            pis: parseNumber(row.PIS || row.pis),
            cofins: parseNumber(row.COFINS || row.cofins),
            icms: parseNumber(row.ICMS || row.icms),
            irpj_primeiro_trimestre: parseNumber(row['IRPJ 1º trimestre'] || row['irpj_primeiro_trimestre'] || row['IRPJ_1_trimestre']),
            csll_primeiro_trimestre: parseNumber(row['CSLL 1º trimestre'] || row['csll_primeiro_trimestre'] || row['CSLL_1_trimestre']),
            irpj_segundo_trimestre: parseNumber(row['IRPJ 2º trimestre'] || row['irpj_segundo_trimestre'] || row['IRPJ_2_trimestre']),
            csll_segundo_trimestre: parseNumber(row['CSLL 2º trimestre'] || row['csll_segundo_trimestre'] || row['CSLL_2_trimestre']),
            tvi: parseNumber(row.TVI || row.tvi),
            segmento: String(row.Segmento || row.segmento || '').trim(),
          };
        });

        const validLucroRealRowsCount = processedLucroRealData.filter(row => 
          row.empresa && row.empresa.trim() !== ''
        ).length;

        if (validLucroRealRowsCount === 0) {
          alert('Nenhum dado válido encontrado no arquivo. Verifique se a coluna Empresa está preenchida.');
          return;
        }

        await importLucroRealMutation.mutateAsync(processedLucroRealData);
        return;
      }

      // Transform data to match expected structure with flexible parsing for Simples Nacional
      const processedData = jsonData.map((row: any) => {
        // Helper function to safely parse numbers
        const parseNumber = (value: any): number | null => {
          if (value === null || value === undefined || value === '') return null;
          const parsed = parseFloat(String(value).replace(/[^\d.,-]/g, '').replace(',', '.'));
          return isNaN(parsed) ? null : parsed;
        };

        // Helper function to parse company status
        const parseSemMovimento = (value: any): boolean => {
          if (value === null || value === undefined || value === '') return false; // Default: ativa
          const str = String(value).toLowerCase().trim();
          return str === 'paralizada' || str === 'sem movimento' || str === 'paralisada';
        };

        return {
          empresa: String(row['Nome da Empresa'] || row.Empresa || row.empresa || '').trim(),
          cnpj: String(row.CNPJ || row.cnpj || '').replace(/\D/g, ''),
          periodo: String(row.Período || row.periodo || row.Periodo || '').trim(),
          rbt12: parseNumber(row.RBT12 || row.rbt12),
          entrada: parseNumber(row.Entrada || row.entrada),
          saida: parseNumber(row.Saída || row.saída || row.saida || row.Saida),
          servicos: parseNumber(row.Serviços || row.servicos || row.Servicos),
          imposto: parseNumber(row.Imposto || row.imposto),
          difal: parseNumber(row.Difal || row.difal || row.DIFAL),
          sem_movimento: parseSemMovimento(row['situação'] || row['Situação'] || row['situacao'] || row['Situacao'] || row['status'] || row['Status']),
          segmento: String(row.Segmento || row.segmento || '').trim(),
        };
      });

      // Check if we have any valid rows (only empresa is required)
      const validRowsCount = processedData.filter(row => 
        row.empresa && row.empresa.trim() !== ''
      ).length;

      if (validRowsCount === 0) {
        alert('Nenhum dado válido encontrado no arquivo. Verifique se a coluna Empresa está preenchida.');
        return;
      }

      await importMutation.mutateAsync(processedData);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleExtractionToolClick = () => {
    window.open('https://extracao.streamlit.app/', '_blank');
  };

  const downloadTemplate = () => {
    const simplesNacionalData = [
      { 
        'Nome da Empresa': 'Empresa Exemplo Ltda', 
        CNPJ: '12345678000195',
        Segmento: 'Varejo',
        Período: '2024-01', 
        RBT12: 1000000, 
        Entrada: 50000, 
        Saída: 30000,
        Serviços: 10000,
        Imposto: 5000,
        Difal: 500
      },
      { 
        'Nome da Empresa': 'Outra Empresa S.A.', 
        CNPJ: '98765432000123',
        Segmento: 'Indústria',
        Período: '2024-01', 
        RBT12: 2000000, 
        Entrada: 80000, 
        Saída: 60000,
        Serviços: 20000,
        Imposto: 8000,
        Difal: 800
      }
    ];

    const lucroRealData = [
      {
        Empresa: 'Empresa Lucro Real Ltda',
        CNPJ: '11222333000144',
        Competência: '2024-01',
        Entradas: 1500000,
        Saídas: 1200000,
        PIS: 15000,
        COFINS: 70000,
        ICMS: 180000,
        'IRPJ 1º trimestre': 45000,
        'CSLL 1º trimestre': 27000,
        'IRPJ 2º trimestre': 50000,
        'CSLL 2º trimestre': 30000,
        Segmento: 'Indústria'
      },
      {
        Empresa: 'Comercial Lucro Real S.A.',
        CNPJ: '44555666000177',
        Competência: '2024-01',
        Entradas: 2000000,
        Saídas: 1800000,
        PIS: 20000,
        COFINS: 92000,
        ICMS: 240000,
        'IRPJ 1º trimestre': 60000,
        'CSLL 1º trimestre': 36000,
        'IRPJ 2º trimestre': 65000,
        'CSLL 2º trimestre': 39000,
        Segmento: 'Comércio'
      }
    ];

    const wb = XLSX.utils.book_new();
    
    const wsSimplesNacional = XLSX.utils.json_to_sheet(simplesNacionalData);
    XLSX.utils.book_append_sheet(wb, wsSimplesNacional, 'Simples Nacional');
    
    const wsLucroReal = XLSX.utils.json_to_sheet(lucroRealData);
    XLSX.utils.book_append_sheet(wb, wsLucroReal, 'Lucro Real');
    
    XLSX.writeFile(wb, 'template_importacao_dados_fiscais.xlsx');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileSpreadsheet className="h-6 w-6" />
            Importar Dados do Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Botão para baixar template */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template XLSX
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Baixe o template com o formato correto para importar seus dados
            </p>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              Arraste e solte seu arquivo Excel aqui
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique para selecionar um arquivo (.xlsx, .xls)
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending || importLucroRealMutation.isPending}
            >
              {(importMutation.isPending || importLucroRealMutation.isPending) ? 'Importando...' : 'Selecionar Arquivo'}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">Formatos aceitos:</h4>
          <div className="text-sm text-muted-foreground space-y-3">
            <div>
              <p className="font-medium">Simples Nacional:</p>
              <p><strong>Colunas:</strong> Nome da Empresa, CNPJ, Segmento, Período, RBT12, Entrada, Saída, Serviços, Imposto, Difal</p>
            </div>
            <div>
              <p className="font-medium">Lucro Real:</p>
              <p><strong>Colunas:</strong> Empresa, CNPJ, Competência, Entradas, Saídas, Serviços, PIS, COFINS, ICMS, IRPJ 1º trimestre, CSLL 1º trimestre, IRPJ 2º trimestre, CSLL 2º trimestre, TVI, Segmento</p>
            </div>
            <div>
              <p><strong>Detecção automática:</strong> O sistema detecta automaticamente o tipo de dados baseado nas colunas presentes</p>
              <p><strong>Flexível:</strong> Valores em branco são aceitos e tratados como null</p>
              <p><strong>Obrigatório:</strong> Apenas o nome da Empresa é campo obrigatório</p>
            </div>
          </div>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Download className="h-6 w-6" />
            Extrair Dados de Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Use nossa ferramenta de extração para processar documentos fiscais e gerar planilhas automaticamente.
            </p>
            <div className="flex justify-start">
              <Button 
                onClick={handleExtractionToolClick}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Ferramenta de Extração
              </Button>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">Como usar:</h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Clique no botão acima para abrir a ferramenta</li>
                <li>Faça upload dos seus documentos fiscais</li>
                <li>A ferramenta extrairá os dados automaticamente</li>
                <li>Baixe a planilha gerada</li>
                <li>Volte aqui e importe a planilha usando o formulário acima</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};