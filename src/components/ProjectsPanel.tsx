import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useProjects, useAddProject, useUpdateProject, useDeleteProject, Project } from '@/hooks/useProjects';
import { useDeclaracaoOptions, useAddDeclaracaoOption } from '@/hooks/useDeclaracaoOptions';
import { Plus, Trash2, Edit, FolderKanban, X, Check, ChevronsUpDown } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_OPTIONS = ['Concluído', 'Atrasado', 'Em andamento', 'Aberto'] as const;
const PRIORIDADE_OPTIONS = ['Alta', 'Média', 'Baixa', 'Urgente'] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Atrasado':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Em andamento':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Aberto':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getPrioridadeColor = (prioridade: string) => {
  switch (prioridade) {
    case 'Alta':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'Média':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Baixa':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Urgente':
      return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDeclaracaoColor = (declaracao: string) => {
  const hash = declaracao.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const colors = [
    'bg-emerald-600/80 text-white',
    'bg-cyan-600/80 text-white',
    'bg-amber-600/80 text-white',
    'bg-purple-600/80 text-white',
    'bg-pink-600/80 text-white',
    'bg-indigo-600/80 text-white',
  ];
  return colors[hash % colors.length];
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  try {
    return format(parseISO(dateString), 'dd/MM/yyyy');
  } catch {
    return '-';
  }
};

export const ProjectsPanel = () => {
  const { data: projects = [], isLoading } = useProjects();
  const { data: declaracaoOptions = [] } = useDeclaracaoOptions();
  const addProjectMutation = useAddProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const addDeclaracaoMutation = useAddDeclaracaoOption();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [declaracoesOpen, setDeclaracoesOpen] = useState(false);
  const [newDeclaracaoInput, setNewDeclaracaoInput] = useState('');
  
  // Form states
  const [nomeProjeto, setNomeProjeto] = useState('');
  const [status, setStatus] = useState<string>('Aberto');
  const [prioridade, setPrioridade] = useState<string>('Média');
  const [prazoFinal, setPrazoFinal] = useState('');
  const [declaracoes, setDeclaracoes] = useState<string[]>([]);

  // Check for overdue projects and update status
  useEffect(() => {
    const today = startOfDay(new Date());
    
    projects.forEach(project => {
      if (
        project.prazo_final && 
        project.status !== 'Concluído' && 
        project.status !== 'Atrasado'
      ) {
        const prazoDate = startOfDay(parseISO(project.prazo_final));
        if (isBefore(prazoDate, today)) {
          updateProjectMutation.mutate({
            id: project.id,
            status: 'Atrasado'
          });
        }
      }
    });
  }, [projects]);

  const resetForm = () => {
    setNomeProjeto('');
    setStatus('Aberto');
    setPrioridade('Média');
    setPrazoFinal('');
    setDeclaracoes([]);
    setNewDeclaracaoInput('');
  };

  const handleAddProject = () => {
    if (!nomeProjeto.trim()) return;

    const newProject: Omit<Project, 'id' | 'created_at' | 'updated_at'> = {
      nome_projeto: nomeProjeto,
      status,
      prioridade,
      prazo_final: prazoFinal || null,
      data_conclusao: status === 'Concluído' ? new Date().toISOString().split('T')[0] : null,
      declaracoes,
    };

    addProjectMutation.mutate(newProject, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        resetForm();
      }
    });
  };

  const handleEditProject = () => {
    if (!editingProject || !nomeProjeto.trim()) return;

    const updates: Partial<Project> & { id: string } = {
      id: editingProject.id,
      nome_projeto: nomeProjeto,
      status,
      prioridade,
      prazo_final: prazoFinal || null,
      declaracoes,
    };

    // Auto-fill completion date when status is "Concluído"
    if (status === 'Concluído' && editingProject.status !== 'Concluído') {
      updates.data_conclusao = new Date().toISOString().split('T')[0];
    } else if (status !== 'Concluído') {
      updates.data_conclusao = null;
    }

    updateProjectMutation.mutate(updates, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingProject(null);
        resetForm();
      }
    });
  };

  const openEditDialog = (project: Project) => {
    setEditingProject(project);
    setNomeProjeto(project.nome_projeto);
    setStatus(project.status);
    setPrioridade(project.prioridade);
    setPrazoFinal(project.prazo_final || '');
    setDeclaracoes(project.declaracoes || []);
    setIsEditDialogOpen(true);
  };

  const toggleDeclaracao = (dec: string) => {
    if (declaracoes.includes(dec)) {
      setDeclaracoes(declaracoes.filter(d => d !== dec));
    } else {
      setDeclaracoes([...declaracoes, dec]);
    }
  };

  const handleCreateNewDeclaracao = async () => {
    if (newDeclaracaoInput.trim()) {
      const newDec = newDeclaracaoInput.trim().toUpperCase();
      await addDeclaracaoMutation.mutateAsync(newDec);
      if (!declaracoes.includes(newDec)) {
        setDeclaracoes([...declaracoes, newDec]);
      }
      setNewDeclaracaoInput('');
    }
  };

  const removeDeclaracao = (dec: string) => {
    setDeclaracoes(declaracoes.filter(d => d !== dec));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Painel de Controle de Projetos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const ProjectForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Projeto</Label>
        <Input
          id="nome"
          value={nomeProjeto}
          onChange={(e) => setNomeProjeto(e.target.value)}
          placeholder="Digite o nome do projeto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select value={prioridade} onValueChange={setPrioridade}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORIDADE_OPTIONS.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prazo">Prazo Final</Label>
        <Input
          id="prazo"
          type="date"
          value={prazoFinal}
          onChange={(e) => setPrazoFinal(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Declarações</Label>
        <Popover open={declaracoesOpen} onOpenChange={setDeclaracoesOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={declaracoesOpen}
              className="w-full justify-between"
            >
              {declaracoes.length > 0
                ? `${declaracoes.length} declaração(ões) selecionada(s)`
                : "Selecione as declarações..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 bg-popover border border-border z-50" align="start">
            <Command>
              <CommandInput placeholder="Buscar declaração..." />
              <CommandList>
                <CommandEmpty>Nenhuma declaração encontrada.</CommandEmpty>
                <CommandGroup>
                  {declaracaoOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.nome}
                      onSelect={() => toggleDeclaracao(option.nome)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          declaracoes.includes(option.nome) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <div className="flex items-center gap-2 p-2">
                    <Input
                      value={newDeclaracaoInput}
                      onChange={(e) => setNewDeclaracaoInput(e.target.value)}
                      placeholder="Nova declaração..."
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateNewDeclaracao();
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleCreateNewDeclaracao}
                      disabled={!newDeclaracaoInput.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {declaracoes.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {declaracoes.map((dec) => (
              <Badge 
                key={dec} 
                className={`${getDeclaracaoColor(dec)} cursor-pointer`}
                onClick={() => toggleDeclaracao(dec)}
              >
                {dec}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5" />
          Painel de Controle de Projetos
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsAddDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Projeto</DialogTitle>
              <DialogDescription>
                Preencha os dados do projeto para adicionar ao painel de controle.
              </DialogDescription>
            </DialogHeader>
            <ProjectForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProject} disabled={!nomeProjeto.trim()}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum projeto cadastrado. Clique em "Novo Projeto" para adicionar.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Nome do Projeto</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Prioridade</TableHead>
                  <TableHead className="font-semibold">Prazo Final</TableHead>
                  <TableHead className="font-semibold">Data de Conclusão</TableHead>
                  <TableHead className="font-semibold">Declaração</TableHead>
                  <TableHead className="font-semibold text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        {project.nome_projeto}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(project.status)} border`}>
                        <span className="mr-1.5">●</span>
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getPrioridadeColor(project.prioridade)} border`}>
                        {project.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(project.prazo_final)}</TableCell>
                    <TableCell>{formatDate(project.data_conclusao)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.declaracoes?.map((dec) => (
                          <Badge key={dec} className={getDeclaracaoColor(dec)}>
                            {dec}
                          </Badge>
                        )) || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(project)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o projeto "{project.nome_projeto}"? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProjectMutation.mutate(project.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
            <DialogDescription>
              Atualize os dados do projeto.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditProject} disabled={!nomeProjeto.trim()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
