import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    responsaveis: "",
    order_index: 0,
  });
  const [newSeAplica, setNewSeAplica] = useState("");
  const [newResponsavel, setNewResponsavel] = useState("");
  const [showNewSeAplica, setShowNewSeAplica] = useState(false);
  const [showNewResponsavel, setShowNewResponsavel] = useState(false);

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
      responsaveis: "",
      order_index: 0,
    });
    setEditingTask(null);
    setNewSeAplica("");
    setNewResponsavel("");
    setShowNewSeAplica(false);
    setShowNewResponsavel(false);
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
        responsaveis: task.responsaveis,
        order_index: task.order_index,
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

  // Agrupar tarefas por período
  const groupedTasks = tasks?.reduce((acc, task) => {
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
                  <Select
                    value={taskFormData.se_aplica}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setShowNewSeAplica(true);
                      } else {
                        setTaskFormData({ ...taskFormData, se_aplica: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou crie novo" />
                    </SelectTrigger>
                    <SelectContent>
                      {seAplicaOptions?.map((option) => (
                        <SelectItem key={option.id} value={option.nome}>
                          {option.nome}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Criar novo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {showNewSeAplica && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Nova opção"
                        value={newSeAplica}
                        onChange={(e) => setNewSeAplica(e.target.value)}
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
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="responsaveis">Responsáveis *</Label>
                  <Select
                    value={taskFormData.responsaveis}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setShowNewResponsavel(true);
                      } else {
                        setTaskFormData({ ...taskFormData, responsaveis: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou crie novo" />
                    </SelectTrigger>
                    <SelectContent>
                      {responsaveis?.map((responsavel) => (
                        <SelectItem key={responsavel.id} value={responsavel.nome}>
                          {responsavel.nome}
                        </SelectItem>
                      ))}
                      <SelectItem value="__new__">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Criar novo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                            setTaskFormData({ ...taskFormData, responsaveis: newResponsavel.trim() });
                            setNewResponsavel("");
                            setShowNewResponsavel(false);
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

      {isLoadingTasks ? (
        <div className="flex items-center justify-center p-8">Carregando tarefas...</div>
      ) : !tasks || tasks.length === 0 ? (
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
        <div className="space-y-6">
          {Object.entries(groupedTasks || {}).map(([periodo, periodTasks]) => (
            <Card key={periodo}>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {periodo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {periodTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Tarefa:</span>
                            <p className="text-foreground font-medium">{task.tarefa}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Se aplica:</span>
                            <p className="text-foreground">{task.se_aplica}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Responsáveis:</span>
                            <p className="text-foreground">{task.responsaveis}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenTaskDialog(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(task)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
