import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Calendar, FolderOpen, X, Check, Printer, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useOperationalTasks,
  useAddOperationalTask,
  useUpdateOperationalTask,
  useDeleteOperationalTask,
  OperationalTask,
} from "@/hooks/useOperationalTasks";
import {
  useCompetencias,
  useAddCompetencia,
  useUpdateCompetencia,
  useDeleteCompetencia,
  Competencia,
} from "@/hooks/useCompetencias";
import { useSeAplicaOptions, useAddSeAplicaOption } from "@/hooks/useSeAplicaOptions";
import { useResponsaveis, useAddResponsavel } from "@/hooks/useResponsaveis";

export function OperationalCalendar() {
  const [selectedCompetencia, setSelectedCompetencia] = useState<string | null>(null);
  const [isCompetenciaDialogOpen, setIsCompetenciaDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingCompetencia, setEditingCompetencia] = useState<Competencia | null>(null);
  const [editingTask, setEditingTask] = useState<OperationalTask | null>(null);
  
  const [competenciaFormData, setCompetenciaFormData] = useState({ nome: "" });
  const [taskFormData, setTaskFormData] = useState({
    periodo: "",
    tarefa: "",
    se_aplica: "",
    responsaveis: [] as string[],
    order_index: 0,
    completed: false,
  });
  const [newSeAplica, setNewSeAplica] = useState("");
  const [newResponsavel, setNewResponsavel] = useState("");
  const [showNewSeAplica, setShowNewSeAplica] = useState(false);
  const [showNewResponsavel, setShowNewResponsavel] = useState(false);
  const [isResponsaveisOpen, setIsResponsaveisOpen] = useState(false);
  const [isSeAplicaOpen, setIsSeAplicaOpen] = useState(false);
  
  // Filtros
  const [filterResponsavel, setFilterResponsavel] = useState<string>("todos");
  const [filterSeAplica, setFilterSeAplica] = useState<string>("todos");
  const [filterSituacao, setFilterSituacao] = useState<string>("todos");

  const { data: competencias, isLoading: isLoadingCompetencias } = useCompetencias();
  const { data: tasks, isLoading: isLoadingTasks } = useOperationalTasks(selectedCompetencia || undefined);
  const { data: seAplicaOptions } = useSeAplicaOptions();
  const { data: responsaveis } = useResponsaveis();
  const addCompetencia = useAddCompetencia();
  const updateCompetencia = useUpdateCompetencia();
  const deleteCompetencia = useDeleteCompetencia();
  const addTask = useAddOperationalTask();
  const updateTask = useUpdateOperationalTask();
  const deleteTask = useDeleteOperationalTask();
  const addSeAplicaOption = useAddSeAplicaOption();
  const addResponsavel = useAddResponsavel();

  const resetCompetenciaForm = () => {
    setCompetenciaFormData({ nome: "" });
    setEditingCompetencia(null);
  };

  const resetTaskForm = () => {
    setTaskFormData({
      periodo: "",
      tarefa: "",
      se_aplica: "",
      responsaveis: [],
      order_index: 0,
      completed: false,
    });
    setEditingTask(null);
    setNewSeAplica("");
    setNewResponsavel("");
    setShowNewSeAplica(false);
    setShowNewResponsavel(false);
    setIsResponsaveisOpen(false);
    setIsSeAplicaOpen(false);
  };

  const handleOpenCompetenciaDialog = (competencia?: Competencia) => {
    if (competencia) {
      setEditingCompetencia(competencia);
      setCompetenciaFormData({ nome: competencia.nome });
    } else {
      resetCompetenciaForm();
    }
    setIsCompetenciaDialogOpen(true);
  };

  const handleOpenTaskDialog = (task?: OperationalTask) => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        periodo: task.periodo,
        tarefa: task.tarefa,
        se_aplica: task.se_aplica,
        responsaveis: task.responsaveis ? task.responsaveis.split(", ") : [],
        order_index: task.order_index,
        completed: task.completed,
      });
    } else {
      resetTaskForm();
    }
    setIsTaskDialogOpen(true);
  };

  const handleSubmitCompetencia = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCompetencia) {
      await updateCompetencia.mutateAsync({ id: editingCompetencia.id, ...competenciaFormData });
    } else {
      await addCompetencia.mutateAsync(competenciaFormData);
    }
    
    setIsCompetenciaDialogOpen(false);
    resetCompetenciaForm();
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCompetencia) {
      return;
    }

    const taskData = {
      ...taskFormData,
      responsaveis: taskFormData.responsaveis.join(", "),
      competencia_id: selectedCompetencia,
    };
    
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, ...taskData });
    } else {
      await addTask.mutateAsync(taskData);
    }
    
    setIsTaskDialogOpen(false);
    resetTaskForm();
  };

  const handleDeleteCompetencia = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta competência? Todas as tarefas associadas serão removidas.")) {
      await deleteCompetencia.mutateAsync(id);
      if (selectedCompetencia === id) {
        setSelectedCompetencia(null);
      }
    }
  };

  const handleDeleteTask = async (task: OperationalTask) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await deleteTask.mutateAsync({ id: task.id, competencia_id: task.competencia_id });
    }
  };

  const handlePrintTasks = () => {
    if (!tasks || tasks.length === 0) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tarefas Operacionais - ${currentCompetencia?.nome}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            h1 {
              text-align: center;
              font-size: 20px;
              margin-bottom: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #333;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
          </style>
        </head>
        <body>
          <h1>Tarefas Operacionais - ${currentCompetencia?.nome}</h1>
          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Período/Dia</th>
                <th style="width: 40%;">Tarefa</th>
                <th style="width: 20%;">Se Aplica</th>
                <th style="width: 25%;">Responsáveis</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(task => `
                <tr>
                  <td>${task.periodo}</td>
                  <td>${task.tarefa}</td>
                  <td>${task.se_aplica}</td>
                  <td>${task.responsaveis}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Aplicar filtros
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      // Filtro por Responsável
      if (filterResponsavel !== "todos") {
        const taskResponsaveis = task.responsaveis.split(", ").map(r => r.trim());
        if (!taskResponsaveis.includes(filterResponsavel)) {
          return false;
        }
      }
      
      // Filtro por Se Aplica
      if (filterSeAplica !== "todos" && task.se_aplica !== filterSeAplica) {
        return false;
      }
      
      // Filtro por Situação
      if (filterSituacao !== "todos") {
        const isCompleted = filterSituacao === "concluida";
        if (task.completed !== isCompleted) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, filterResponsavel, filterSeAplica, filterSituacao]);

  // Agrupar tarefas por período
  const groupedTasks = filteredTasks?.reduce((acc, task) => {
    if (!acc[task.periodo]) {
      acc[task.periodo] = [];
    }
    acc[task.periodo].push(task);
    return acc;
  }, {} as Record<string, OperationalTask[]>);

  if (isLoadingCompetencias) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  // Se não há competência selecionada, mostrar lista de competências
  if (!selectedCompetencia) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendário de Tarefas Operacionais</h1>
            <p className="text-muted-foreground mt-1">
              Selecione uma competência para visualizar suas tarefas
            </p>
          </div>
          <Dialog open={isCompetenciaDialogOpen} onOpenChange={setIsCompetenciaDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenCompetenciaDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Competência
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <form onSubmit={handleSubmitCompetencia}>
                <DialogHeader>
                  <DialogTitle>{editingCompetencia ? "Editar Competência" : "Nova Competência"}</DialogTitle>
                  <DialogDescription>
                    Preencha o nome da competência (ex: Janeiro/2025, 01/2025)
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">Nome da Competência *</Label>
                    <Input
                      id="nome"
                      placeholder="Ex: Janeiro/2025"
                      value={competenciaFormData.nome}
                      onChange={(e) => setCompetenciaFormData({ nome: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCompetenciaDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCompetencia ? "Atualizar" : "Adicionar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!competencias || competencias.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhuma competência cadastrada ainda.
                <br />
                Clique em "Nova Competência" para começar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competencias.map((competencia) => (
              <Card key={competencia.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle 
                      className="text-xl cursor-pointer flex-1"
                      onClick={() => setSelectedCompetencia(competencia.id)}
                    >
                      {competencia.nome}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenCompetenciaDialog(competencia)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteCompetencia(competencia.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => setSelectedCompetencia(competencia.id)}>
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Tarefas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mostrar tarefas da competência selecionada
  const currentCompetencia = competencias?.find(c => c.id === selectedCompetencia);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedCompetencia(null)}
            className="mb-2"
          >
            ← Voltar para Competências
          </Button>
          <h1 className="text-3xl font-bold text-foreground">{currentCompetencia?.nome}</h1>
          <p className="text-muted-foreground mt-1">
            Tarefas operacionais desta competência
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrintTasks}
            disabled={!filteredTasks || filteredTasks.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenTaskDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmitTask}>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
                <DialogDescription>
                  Preencha os campos para {editingTask ? "atualizar" : "adicionar"} uma tarefa operacional
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="periodo">Período/Dia *</Label>
                  <Input
                    id="periodo"
                    placeholder="Ex: Dia 01, Dia 01 a 05"
                    value={taskFormData.periodo}
                    onChange={(e) => setTaskFormData({ ...taskFormData, periodo: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tarefa">Tarefa *</Label>
                  <Textarea
                    id="tarefa"
                    placeholder="O que deve ser feito"
                    value={taskFormData.tarefa}
                    onChange={(e) => setTaskFormData({ ...taskFormData, tarefa: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="se_aplica">Se Aplica *</Label>
                  <Popover open={isSeAplicaOpen} onOpenChange={setIsSeAplicaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {taskFormData.se_aplica || "Selecione ou crie novo"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar opção..." />
                        <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {seAplicaOptions?.map((option) => (
                            <CommandItem
                              key={option.id}
                              onSelect={() => {
                                setTaskFormData({ ...taskFormData, se_aplica: option.nome });
                                setIsSeAplicaOpen(false);
                              }}
                            >
                              {option.nome}
                            </CommandItem>
                          ))}
                          <CommandItem
                            onSelect={() => {
                              setShowNewSeAplica(true);
                              setIsSeAplicaOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Criar nova opção
                            </div>
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {showNewSeAplica && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nova opção"
                        value={newSeAplica}
                        onChange={(e) => setNewSeAplica(e.target.value)}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          if (newSeAplica.trim()) {
                            await addSeAplicaOption.mutateAsync(newSeAplica.trim());
                            setTaskFormData({ ...taskFormData, se_aplica: newSeAplica.trim() });
                            setNewSeAplica("");
                            setShowNewSeAplica(false);
                          }
                        }}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewSeAplica(false);
                          setNewSeAplica("");
                          setIsSeAplicaOpen(true);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="responsaveis">Responsáveis *</Label>
                  <Popover open={isResponsaveisOpen} onOpenChange={setIsResponsaveisOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {taskFormData.responsaveis.length > 0
                          ? `${taskFormData.responsaveis.length} selecionado(s)`
                          : "Selecione responsáveis"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar responsável..." />
                        <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {responsaveis?.map((responsavel) => {
                            const isSelected = taskFormData.responsaveis.includes(responsavel.nome);
                            return (
                              <CommandItem
                                key={responsavel.id}
                                onSelect={() => {
                                  const newResponsaveis = isSelected
                                    ? taskFormData.responsaveis.filter((r) => r !== responsavel.nome)
                                    : [...taskFormData.responsaveis, responsavel.nome];
                                  setTaskFormData({ ...taskFormData, responsaveis: newResponsaveis });
                                }}
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? 'bg-primary border-primary' : 'border-input'}`}>
                                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                  </div>
                                  <span>{responsavel.nome}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                          <CommandItem
                            onSelect={() => {
                              setShowNewResponsavel(true);
                              setIsResponsaveisOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              Criar novo responsável
                            </div>
                          </CommandItem>
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {taskFormData.responsaveis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {taskFormData.responsaveis.map((responsavel) => (
                        <Badge key={responsavel} variant="secondary" className="gap-1">
                          {responsavel}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              setTaskFormData({
                                ...taskFormData,
                                responsaveis: taskFormData.responsaveis.filter((r) => r !== responsavel),
                              });
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                  {showNewResponsavel && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Novo responsável"
                        value={newResponsavel}
                        onChange={(e) => setNewResponsavel(e.target.value)}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={async () => {
                          if (newResponsavel.trim()) {
                            await addResponsavel.mutateAsync(newResponsavel.trim());
                            setTaskFormData({ 
                              ...taskFormData, 
                              responsaveis: [...taskFormData.responsaveis, newResponsavel.trim()] 
                            });
                            setNewResponsavel("");
                            setShowNewResponsavel(false);
                            setIsResponsaveisOpen(true);
                          }
                        }}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowNewResponsavel(false);
                          setNewResponsavel("");
                          setIsResponsaveisOpen(true);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order_index">Ordem</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={taskFormData.order_index}
                    onChange={(e) => setTaskFormData({ ...taskFormData, order_index: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTask ? "Atualizar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="filter-responsavel">Responsável</Label>
              <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
                <SelectTrigger id="filter-responsavel">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {responsaveis?.map((resp) => (
                    <SelectItem key={resp.id} value={resp.nome}>
                      {resp.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-se-aplica">Se Aplica</Label>
              <Select value={filterSeAplica} onValueChange={setFilterSeAplica}>
                <SelectTrigger id="filter-se-aplica">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {seAplicaOptions?.map((option) => (
                    <SelectItem key={option.id} value={option.nome}>
                      {option.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-situacao">Situação</Label>
              <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                <SelectTrigger id="filter-situacao">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoadingTasks ? (
        <div className="flex items-center justify-center p-8">Carregando tarefas...</div>
      ) : !filteredTasks || filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma tarefa cadastrada nesta competência ainda.
              <br />
              Clique em "Nova Tarefa" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted border-b-2">
                <TableHead className="font-bold border-r h-9 px-3 w-[150px] text-foreground">Período/Dia</TableHead>
                <TableHead className="font-bold border-r h-9 px-3 text-foreground">Tarefa</TableHead>
                <TableHead className="font-bold border-r h-9 px-3 w-[150px] text-foreground">Se Aplica</TableHead>
                <TableHead className="font-bold border-r h-9 px-3 w-[180px] text-foreground">Responsáveis</TableHead>
                <TableHead className="font-bold border-r h-9 px-3 w-[120px] text-center text-foreground">Situação</TableHead>
                <TableHead className="font-bold h-9 px-3 w-[100px] text-center text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks?.map((task, idx) => (
                <TableRow 
                  key={task.id}
                  className={`${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/50 border-b`}
                >
                  <TableCell className="border-r p-2 px-3 align-top text-sm font-medium">{task.periodo}</TableCell>
                  <TableCell className="border-r p-2 px-3 align-top text-sm">{task.tarefa}</TableCell>
                  <TableCell className="border-r p-2 px-3 align-top text-sm">{task.se_aplica}</TableCell>
                  <TableCell className="border-r p-2 px-3 align-top">
                    <div className="flex flex-wrap gap-1">
                      {task.responsaveis.split(", ").map((resp, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {resp}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="border-r p-2 px-3 align-top">
                    <div className="flex justify-center">
                      <Button
                        variant={task.completed ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => updateTask.mutate({ id: task.id, completed: !task.completed })}
                      >
                        {task.completed ? "Concluída" : "Pendente"}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="p-2 px-3 align-top">
                    <div className="flex justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenTaskDialog(task)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteTask(task)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
