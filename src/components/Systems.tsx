import { useState } from "react";
import { Plus, Edit, Trash2, ExternalLink, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSystems, useAddSystem, useUpdateSystem, useDeleteSystem, useAddSystemLink, useUpdateSystemLink, useDeleteSystemLink } from "@/hooks/useSystems";

export function Systems() {
  const { toast } = useToast();
  const { data: systems, isLoading } = useSystems();
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

  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  const [linkFormData, setLinkFormData] = useState({
    title: "",
    url: "",
  });

  const handleCreateSystem = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    await addSystem.mutateAsync(formData);
    setFormData({ title: "", description: "" });
    setIsCreateDialogOpen(false);
    toast({
      title: "Sucesso",
      description: "Sistema criado com sucesso",
    });
  };

  const handleUpdateSystem = async (systemId: string) => {
    if (!formData.title.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    await updateSystem.mutateAsync({ id: systemId, ...formData });
    setEditingSystem(null);
    setFormData({ title: "", description: "" });
    toast({
      title: "Sucesso",
      description: "Sistema atualizado com sucesso",
    });
  };

  const handleDeleteSystem = async (systemId: string) => {
    if (confirm("Tem certeza que deseja excluir este sistema?")) {
      await deleteSystem.mutateAsync(systemId);
      toast({
        title: "Sucesso",
        description: "Sistema excluído com sucesso",
      });
    }
  };

  const handleAddLink = async (systemId: string) => {
    if (!linkFormData.title.trim() || !linkFormData.url.trim()) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    await addLink.mutateAsync({
      system_id: systemId,
      title: linkFormData.title,
      url: linkFormData.url,
    });
    setLinkFormData({ title: "", url: "" });
    setAddingLinkToSystem(null);
    toast({
      title: "Sucesso",
      description: "Link adicionado com sucesso",
    });
  };

  const handleUpdateLink = async (linkId: string) => {
    if (!linkFormData.title.trim() || !linkFormData.url.trim()) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    await updateLink.mutateAsync({
      id: linkId,
      title: linkFormData.title,
      url: linkFormData.url,
    });
    setEditingLink(null);
    setLinkFormData({ title: "", url: "" });
    toast({
      title: "Sucesso",
      description: "Link atualizado com sucesso",
    });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm("Tem certeza que deseja excluir este link?")) {
      await deleteLink.mutateAsync(linkId);
      toast({
        title: "Sucesso",
        description: "Link excluído com sucesso",
      });
    }
  };

  const startEditingSystem = (system: any) => {
    setEditingSystem(system.id);
    setFormData({
      title: system.title,
      description: system.description || "",
    });
  };

  const startEditingLink = (link: any) => {
    setEditingLink(link.id);
    setLinkFormData({
      title: link.title,
      url: link.url,
    });
  };

  const cancelEdit = () => {
    setEditingSystem(null);
    setEditingLink(null);
    setAddingLinkToSystem(null);
    setFormData({ title: "", description: "" });
    setLinkFormData({ title: "", url: "" });
  };

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Sistemas</h2>
          <p className="text-muted-foreground">Gerencie seus sistemas e links de acesso</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Sistema
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Sistema</DialogTitle>
              <DialogDescription>Adicione um novo sistema com seus links de acesso</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome do sistema"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do sistema"
                />
              </div>
              <Button onClick={handleCreateSystem} className="w-full">
                Criar Sistema
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems?.map((system) => (
          <Card key={system.id} className="flex flex-col">
            <CardHeader>
              {editingSystem === system.id ? (
                <div className="space-y-3">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título"
                  />
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateSystem(system.id)}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{system.title}</CardTitle>
                      {system.description && (
                        <CardDescription className="mt-2">{system.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditingSystem(system)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSystem(system.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              {system.system_links?.map((link: any) => (
                <div key={link.id}>
                  {editingLink === link.id ? (
                    <div className="space-y-2">
                      <Input
                        value={linkFormData.title}
                        onChange={(e) => setLinkFormData({ ...linkFormData, title: e.target.value })}
                        placeholder="Título do link"
                        className="text-sm"
                      />
                      <Input
                        value={linkFormData.url}
                        onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                        placeholder="URL"
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateLink(link.id)}>
                          <Save className="h-3 w-3 mr-1" />
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="h-3 w-3 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 justify-start"
                        onClick={() => window.open(link.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {link.title}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditingLink(link)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteLink(link.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {addingLinkToSystem === system.id ? (
                <div className="space-y-2 pt-2 border-t">
                  <Input
                    value={linkFormData.title}
                    onChange={(e) => setLinkFormData({ ...linkFormData, title: e.target.value })}
                    placeholder="Título do link"
                    className="text-sm"
                  />
                  <Input
                    value={linkFormData.url}
                    onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                    placeholder="URL"
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAddLink(system.id)}>
                      <Save className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => setAddingLinkToSystem(system.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Link
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!systems || systems.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum sistema cadastrado. Clique em "Adicionar Sistema" para começar.
        </div>
      )}
    </div>
  );
}
