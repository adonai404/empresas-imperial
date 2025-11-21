import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useOperationalTasks,
  useAddOperationalTask,
  useUpdateOperationalTask,
  useDeleteOperationalTask,
  OperationalTask,
} from "@/hooks/useOperationalTasks";

export function OperationalCalendar() {
  const { data: tasks, isLoading } = useOperationalTasks();
  const addTask = useAddOperationalTask();
  const updateTask = useUpdateOperationalTask();
  const deleteTask = useDeleteOperationalTask();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OperationalTask | null>(null);
  const [formData, setFormData] = useState({
    periodo: "",
    tarefa: "",
    se_aplica: "",
    responsaveis: "",
    order_index: 0,
  });

  const resetForm = () => {
    setFormData({
      periodo: "",
      tarefa: "",
      se_aplica: "",
      responsaveis: "",
      order_index: 0,
    });
    setEditingTask(null);
  };

  const handleOpenDialog = (task?: OperationalTask) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        periodo: task.periodo,
        tarefa: task.tarefa,
        se_aplica: task.se_aplica,
        responsaveis: task.responsaveis,
        order_index: task.order_index,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingTask) {
      await updateTask.mutateAsync({ id: editingTask.id, ...formData });
    } else {
      await addTask.mutateAsync(formData);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await deleteTask.mutateAsync(id);
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

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Calendário de Tarefas Operacionais</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as tarefas operacionais organizadas por período
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
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
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tarefa">Tarefa *</Label>
                  <Textarea
                    id="tarefa"
                    placeholder="O que deve ser feito"
                    value={formData.tarefa}
                    onChange={(e) => setFormData({ ...formData, tarefa: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="se_aplica">Se Aplica *</Label>
                  <Input
                    id="se_aplica"
                    placeholder="Ex: SN Serviços, SN Comércio, Lucro Real"
                    value={formData.se_aplica}
                    onChange={(e) => setFormData({ ...formData, se_aplica: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="responsaveis">Responsáveis *</Label>
                  <Input
                    id="responsaveis"
                    placeholder="Ex: Alan / Aglison / Adonai"
                    value={formData.responsaveis}
                    onChange={(e) => setFormData({ ...formData, responsaveis: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order_index">Ordem</Label>
                  <Input
                    id="order_index"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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

      {!tasks || tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Nenhuma tarefa cadastrada ainda.
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
                            onClick={() => handleOpenDialog(task)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(task.id)}
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
