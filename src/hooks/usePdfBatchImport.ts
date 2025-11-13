import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PdfFileState, ProcessingStatus, ExtractedFiscalData, ImportSummary } from '@/types/pdfImport';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const usePdfBatchImport = () => {
  const [files, setFiles] = useState<PdfFileState[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const updateFileStatus = (index: number, updates: Partial<PdfFileState>) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const parsePdfDocument = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extrair texto de cada página (máximo 50 páginas)
      const numPages = Math.min(pdf.numPages, 50);
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Erro ao fazer parse do PDF:', error);
      throw new Error('Falha ao extrair texto do PDF');
    }
  };

  const extractDataWithAI = async (filename: string, extractedText: string): Promise<ExtractedFiscalData> => {
    const { data, error } = await supabase.functions.invoke('extract-fiscal-pdf', {
      body: { filename, extractedText }
    });

    if (error) {
      console.error('Erro ao invocar função:', error);
      throw new Error(error.message || 'Erro ao extrair dados com IA');
    }

    if (!data.success) {
      throw new Error(data.error || 'Falha na extração de dados');
    }

    return data.data;
  };

  const findOrCreateCompany = async (cnpj: string, name: string): Promise<string> => {
    // Buscar empresa existente
    const { data: existing, error: searchError } = await supabase
      .from('companies')
      .select('id')
      .eq('cnpj', cnpj)
      .maybeSingle();

    if (searchError) {
      console.error('Erro ao buscar empresa:', searchError);
      throw new Error('Erro ao buscar empresa no banco de dados');
    }

    if (existing) {
      return existing.id;
    }

    // Criar nova empresa
    const { data: newCompany, error: insertError } = await supabase
      .from('companies')
      .insert({ cnpj, name })
      .select('id')
      .single();

    if (insertError) {
      console.error('Erro ao criar empresa:', insertError);
      throw new Error('Erro ao criar empresa no banco de dados');
    }

    return newCompany.id;
  };

  const saveFiscalData = async (companyId: string, data: ExtractedFiscalData): Promise<void> => {
    // Verificar se já existe dados para este período
    const { data: existing } = await supabase
      .from('fiscal_data')
      .select('id')
      .eq('company_id', companyId)
      .eq('period', data.periodo)
      .maybeSingle();

    const fiscalRecord = {
      company_id: companyId,
      period: data.periodo,
      entrada: data.entradas || 0,
      saida: data.saidas || 0,
      servicos: data.servicos || 0,
      imposto: data.icms || 0,
      rbt12: 0, // Valor padrão
    };

    if (existing) {
      // Atualizar registro existente
      const { error } = await supabase
        .from('fiscal_data')
        .update(fiscalRecord)
        .eq('id', existing.id);

      if (error) {
        console.error('Erro ao atualizar dados fiscais:', error);
        throw new Error('Erro ao atualizar dados fiscais');
      }
    } else {
      // Inserir novo registro
      const { error } = await supabase
        .from('fiscal_data')
        .insert(fiscalRecord);

      if (error) {
        console.error('Erro ao inserir dados fiscais:', error);
        throw new Error('Erro ao inserir dados fiscais');
      }
    }
  };

  const processFile = async (file: File, index: number, retryCount = 0): Promise<void> => {
    const maxRetries = 2;

    try {
      // 1. Parse do PDF
      updateFileStatus(index, { status: 'parsing', progress: 25 });
      const extractedText = await parsePdfDocument(file);

      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('Não foi possível extrair texto do PDF');
      }

      // 2. Extração com IA
      updateFileStatus(index, { status: 'extracting', progress: 50 });
      const fiscalData = await extractDataWithAI(file.name, extractedText);

      // 3. Salvar no banco
      updateFileStatus(index, { status: 'saving', progress: 75 });
      const companyId = await findOrCreateCompany(fiscalData.cnpj, fiscalData.empresa);
      await saveFiscalData(companyId, fiscalData);

      // 4. Sucesso
      updateFileStatus(index, { 
        status: 'success', 
        progress: 100,
        extractedData: fiscalData 
      });

    } catch (error) {
      console.error(`Erro ao processar ${file.name}:`, error);

      // Retry logic para erros de rate limit
      if (retryCount < maxRetries && error instanceof Error) {
        const isRateLimit = error.message.includes('429') || error.message.includes('limite');
        
        if (isRateLimit) {
          const waitTime = (retryCount + 1) * 2000; // 2s, 4s
          console.log(`Aguardando ${waitTime}ms antes de tentar novamente...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return processFile(file, index, retryCount + 1);
        }
      }

      updateFileStatus(index, { 
        status: 'error', 
        progress: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  };

  const startBatchImport = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }

    if (selectedFiles.length > 10) {
      toast.error('Máximo de 10 arquivos por vez');
      return;
    }

    // Validar tamanho dos arquivos
    const oversizedFiles = selectedFiles.filter(f => f.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Arquivos muito grandes (máx 20MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Inicializar estado dos arquivos
    const initialFiles: PdfFileState[] = selectedFiles.map(file => ({
      file,
      status: 'pending' as ProcessingStatus,
      progress: 0,
    }));

    setFiles(initialFiles);
    setIsProcessing(true);
    setSummary(null);

    // Processar arquivos sequencialmente para evitar rate limits
    for (let i = 0; i < initialFiles.length; i++) {
      await processFile(selectedFiles[i], i);
      // Pequeno delay entre arquivos
      if (i < initialFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Gerar resumo
    const results = initialFiles.map((f, i) => {
      const finalState = files[i] || f;
      return {
        filename: f.file.name,
        status: finalState.status === 'success' ? 'success' as const : 'error' as const,
        message: finalState.error || (finalState.status === 'success' ? 'Importado com sucesso' : undefined)
      };
    });

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    setSummary({
      total: selectedFiles.length,
      success: successCount,
      errors: errorCount,
      results
    });

    setIsProcessing(false);

    if (successCount > 0) {
      toast.success(`${successCount} de ${selectedFiles.length} arquivos importados com sucesso`);
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} arquivos com erro`);
    }
  };

  const reset = () => {
    setFiles([]);
    setIsProcessing(false);
    setSummary(null);
  };

  return {
    files,
    isProcessing,
    summary,
    startBatchImport,
    reset
  };
};
