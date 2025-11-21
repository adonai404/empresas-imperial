import { useState } from "react";
import { Plus, Edit, Trash2, ExternalLink, Save, X, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useSystems, useAddSystem, useUpdateSystem, useDeleteSystem, useAddSystemLink, useUpdateSystemLink, useDeleteSystemLink } from "@/hooks/useSystems";
export function Systems() {
  const {
    toast
  } = useToast();
  const {
    data: systems,
    isLoading
  } = useSystems();
  const addSystem = useAddSystem();
  const updateSystem = useUpdateSystem();
  const deleteSystem = useDeleteSystem();
  const addLink = useAddSystemLink();
  const updateLink = useUpdateSystemLink();
  const deleteLink = useDeleteSystemLink();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSystem, setEditingSystem] = useState<string | null>(null);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [addingLinkToSystem, setAddingLinkToSystem] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<{
    [key: string]: boolean;
  }>({});
  const [formData, setFormData] = useState({
    title: "",
    description: ""
  });
  const [linkFormData, setLinkFormData] = useState({
    title: "",
    url: "",
    username: "",
    password: ""
  });
  const togglePasswordVisibility = (linkId: string) => {
    setShowPassword(prev => ({
      ...prev,
      [linkId]: !prev[linkId]
    }));
  };
  const handleCreateSystem = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive"
      });
      return;
    }
    await addSystem.mutateAsync(formData);
    setFormData({
      title: "",
      description: ""
    });
    setIsCreateDialogOpen(false);
  };
  const handleUpdateSystem = async (systemId: string) => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive"
      });
      return;
    }
    await updateSystem.mutateAsync({
      id: systemId,
      ...formData
    });
    setEditingSystem(null);
    setFormData({
      title: "",
      description: ""
    });
  };
  const handleDeleteSystem = async (systemId: string) => {
    if (confirm("Tem certeza que deseja excluir este sistema?")) {
      await deleteSystem.mutateAsync(systemId);
    }
  };
  const handleAddLink = async (systemId: string) => {
    if (!linkFormData.title.trim() || !linkFormData.url.trim()) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    await addLink.mutateAsync({
      system_id: systemId,
      title: linkFormData.title,
      url: linkFormData.url,
      username: linkFormData.username,
      password: linkFormData.password
    });
    setLinkFormData({
      title: "",
      url: "",
      username: "",
      password: ""
    });
    setAddingLinkToSystem(null);
  };
  const handleUpdateLink = async (linkId: string) => {
    if (!linkFormData.title.trim() || !linkFormData.url.trim()) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    await updateLink.mutateAsync({
      id: linkId,
      title: linkFormData.title,
      url: linkFormData.url,
      username: linkFormData.username,
      password: linkFormData.password
    });
    setEditingLink(null);
    setLinkFormData({
      title: "",
      url: "",
      username: "",
      password: ""
    });
  };
  const handleDeleteLink = async (linkId: string) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      await deleteLink.mutateAsync(linkId);
    }
  };
  const startEditingSystem = (system: any) => {
    setEditingSystem(system.id);
    setFormData({
      title: system.title,
      description: system.description || ""
    });
  };
  const startEditingLink = (link: any) => {
    setEditingLink(link.id);
    setLinkFormData({
      title: link.title,
      url: link.url,
      username: link.username || "",
      password: link.password || ""
    });
  };
  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Processos e seus sistemas       </h2>
          <p className="text-muted-foreground">
            Gerencie os sistemas utilizados em um processo      
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Processo 
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Sistema</DialogTitle>
              <DialogDescription>
                Adicione um novo sistema para organizar seus links de acesso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={formData.title} onChange={e => setFormData({
                ...formData,
                title: e.target.value
              })} placeholder="Nome do sistema" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea id="description" value={formData.description} onChange={e => setFormData({
                ...formData,
                description: e.target.value
              })} placeholder="Descrição do sistema" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSystem}>Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {systems?.map(system => <Card key={system.id} className="flex flex-col">
            <CardHeader>
              {editingSystem === system.id ? <div className="space-y-4">
                  <Input value={formData.title} onChange={e => setFormData({
              ...formData,
              title: e.target.value
            })} placeholder="Título" />
                  <Textarea value={formData.description} onChange={e => setFormData({
              ...formData,
              description: e.target.value
            })} placeholder="Descrição" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateSystem(system.id)}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                setEditingSystem(null);
                setFormData({
                  title: "",
                  description: ""
                });
              }}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div> : <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{system.title}</CardTitle>
                      {system.description && <CardDescription className="mt-1.5">
                          {system.description}
                        </CardDescription>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => startEditingSystem(system)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteSystem(system.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {/* Links */}
              {system.system_links?.map(link => <div key={link.id}>
                  {editingLink === link.id ? <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                      <Input value={linkFormData.title} onChange={e => setLinkFormData({
                ...linkFormData,
                title: e.target.value
              })} placeholder="Título do link" />
                      <Input value={linkFormData.url} onChange={e => setLinkFormData({
                ...linkFormData,
                url: e.target.value
              })} placeholder="URL" />
                      <Input value={linkFormData.username} onChange={e => setLinkFormData({
                ...linkFormData,
                username: e.target.value
              })} placeholder="Usuário (opcional)" />
                      <Input type="password" value={linkFormData.password} onChange={e => setLinkFormData({
                ...linkFormData,
                password: e.target.value
              })} placeholder="Senha (opcional)" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateLink(link.id)}>
                          <Save className="h-4 w-4 mr-1" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                  setEditingLink(null);
                  setLinkFormData({
                    title: "",
                    url: "",
                    username: "",
                    password: ""
                  });
                }}>
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div> : <div className="flex items-center gap-2">
                      <Button variant="outline" className="flex-1 justify-start" onClick={() => window.open(link.url, "_blank")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {link.title}
                      </Button>
                      
                      {(link.username || link.password) && <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Key className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 bg-background border shadow-lg z-50">
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm">Credenciais de Acesso</h4>
                              {link.username && <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                                  <div className="flex items-center gap-2">
                                    <Input value={link.username} readOnly className="text-sm" />
                                  </div>
                                </div>}
                              {link.password && <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Senha</Label>
                                  <div className="flex items-center gap-2">
                                    <Input type={showPassword[link.id] ? "text" : "password"} value={link.password} readOnly className="text-sm" />
                                    <Button size="icon" variant="ghost" onClick={() => togglePasswordVisibility(link.id)}>
                                      {showPassword[link.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                </div>}
                            </div>
                          </PopoverContent>
                        </Popover>}
                      
                      <Button size="icon" variant="ghost" onClick={() => startEditingLink(link)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteLink(link.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>}
                </div>)}

              {/* Add Link Form */}
              {addingLinkToSystem === system.id ? <div className="space-y-3 p-3 border rounded-lg bg-muted/50">
                  <Input value={linkFormData.title} onChange={e => setLinkFormData({
              ...linkFormData,
              title: e.target.value
            })} placeholder="Título do link" />
                  <Input value={linkFormData.url} onChange={e => setLinkFormData({
              ...linkFormData,
              url: e.target.value
            })} placeholder="URL" />
                  <Input value={linkFormData.username} onChange={e => setLinkFormData({
              ...linkFormData,
              username: e.target.value
            })} placeholder="Usuário (opcional)" />
                  <Input type="password" value={linkFormData.password} onChange={e => setLinkFormData({
              ...linkFormData,
              password: e.target.value
            })} placeholder="Senha (opcional)" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAddLink(system.id)}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                setAddingLinkToSystem(null);
                setLinkFormData({
                  title: "",
                  url: "",
                  username: "",
                  password: ""
                });
              }}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div> : <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingLinkToSystem(system.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>}
            </CardContent>
          </Card>)}
      </div>

      {systems?.length === 0 && <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum sistema cadastrado. Clique em "Novo Sistema" para começar.</p>
        </div>}
    </div>;
}