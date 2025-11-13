import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download,
  AlertCircle
} from 'lucide-react';
import { usePdfBatchImport } from '@/hooks/usePdfBatchImport';
import { cn } from '@/lib/utils';

export const PdfBatchUpload = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { files, isProcessing, summary, startBatchImport, reset } = usePdfBatchImport();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    );

    if (droppedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...droppedFiles].slice(0, 10));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        file => file.type === 'application/pdf'
      );
      setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    startBatchImport(selectedFiles);
  };

  const handleReset = () => {
    setSelectedFiles([]);
    reset();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <FileText className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-destructive';
      default:
        return 'bg-primary';
    }
  };

  const downloadErrorReport = () => {
    if (!summary) return;

    const errorLines = summary.results
      .filter(r => r.status === 'error')
      .map(r => `${r.filename},${r.message || 'Erro desconhecido'}`)
      .join('\n');

    const csv = `Arquivo,Erro\n${errorLines}`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'erros-importacao.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Importação em Massa de PDFs Fiscais</CardTitle>
          <CardDescription>
            Faça upload de até 10 PDFs por vez. A IA extrairá automaticamente os dados fiscais de cada documento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Área de Upload */}
          {!isProcessing && files.length === 0 && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
                dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                Arraste PDFs aqui ou clique para selecionar
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Máximo de 10 arquivos, 20MB cada
              </p>
              <input
                type="file"
                id="file-input"
                multiple
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button asChild variant="outline">
                <label htmlFor="file-input" className="cursor-pointer">
                  Selecionar Arquivos
                </label>
              </Button>
            </div>
          )}

          {/* Lista de Arquivos Selecionados */}
          {selectedFiles.length > 0 && files.length === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </h3>
                <Button onClick={handleReset} variant="outline" size="sm">
                  Limpar
                </Button>
              </div>
              
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleImport} className="w-full" size="lg">
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Importação
              </Button>
            </div>
          )}

          {/* Progresso da Importação */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Processando arquivos...</h3>
                {!isProcessing && (
                  <Button onClick={handleReset} variant="outline" size="sm">
                    Nova Importação
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {files.map((fileState, index) => (
                  <div key={index} className="space-y-2 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(fileState.status)}
                        <div>
                          <p className="font-medium text-sm">{fileState.file.name}</p>
                          {fileState.status === 'error' && fileState.error && (
                            <p className="text-xs text-destructive">{fileState.error}</p>
                          )}
                          {fileState.status === 'success' && fileState.extractedData && (
                            <p className="text-xs text-green-600">
                              {fileState.extractedData.empresa} - {fileState.extractedData.periodo}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium">{fileState.progress}%</span>
                    </div>
                    {fileState.status !== 'pending' && fileState.status !== 'error' && (
                      <Progress 
                        value={fileState.progress} 
                        className={cn('h-2', getStatusColor(fileState.status))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo Final */}
          {summary && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">
                    Importação concluída: {summary.success} de {summary.total} arquivos processados com sucesso
                  </p>
                  {summary.errors > 0 && (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-destructive">
                        {summary.errors} arquivo(s) com erro
                      </p>
                      <Button
                        onClick={downloadErrorReport}
                        variant="outline"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar Relatório
                      </Button>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Informações */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-2">O que a IA extrai automaticamente:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Nome da empresa e CNPJ</li>
                <li>Período/competência (mês/ano)</li>
                <li>Valores de entradas, saídas e serviços</li>
                <li>Impostos (ICMS, PIS, COFINS quando disponíveis)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
