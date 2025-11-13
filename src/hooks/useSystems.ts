import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SystemLink {
  id: string;
  system_id: string;
  title: string;
  url: string;
  icon?: string;
  order_index: number;
  created_at: string;
}

export interface System {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  system_links?: SystemLink[];
}

export const useSystems = () => {
  return useQuery({
    queryKey: ["systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems" as any)
        .select(`
          *,
          system_links (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as System[];
    },
  });
};

export const useAddSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (system: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("systems" as any)
        .insert(system)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Sistema adicionado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar sistema");
    },
  });
};

export const useUpdateSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
    }: {
      id: string;
      title: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from("systems" as any)
        .update({ title, description })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Sistema atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar sistema");
    },
  });
};

export const useDeleteSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("systems" as any).delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Sistema deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar sistema");
    },
  });
};

export const useAddSystemLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: {
      system_id: string;
      title: string;
      url: string;
      icon?: string;
    }) => {
      const { data, error } = await supabase
        .from("system_links" as any)
        .insert(link)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Link adicionado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao adicionar link");
    },
  });
};

export const useUpdateSystemLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      title,
      url,
      icon,
    }: {
      id: string;
      title: string;
      url: string;
      icon?: string;
    }) => {
      const { data, error } = await supabase
        .from("system_links" as any)
        .update({ title, url, icon })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Link atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar link");
    },
  });
};

export const useDeleteSystemLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("system_links" as any).delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
      toast.success("Link deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar link");
    },
  });
};
