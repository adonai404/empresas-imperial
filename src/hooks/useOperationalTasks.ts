import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface OperationalTask {
  id: string;
  periodo: string;
  tarefa: string;
  se_aplica: string;
  responsaveis: string;
  order_index: number;
  created_at?: string;
  updated_at?: string;
}

export const useOperationalTasks = () => {
  return useQuery({
    queryKey: ["operational-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operational_tasks")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as OperationalTask[];
    },
  });
};

export const useAddOperationalTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<OperationalTask, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("operational_tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-tasks"] });
      toast.success("Tarefa adicionada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar tarefa: " + error.message);
    },
  });
};

export const useUpdateOperationalTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OperationalTask> & { id: string }) => {
      const { data, error } = await supabase
        .from("operational_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-tasks"] });
      toast.success("Tarefa atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tarefa: " + error.message);
    },
  });
};

export const useDeleteOperationalTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("operational_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational-tasks"] });
      toast.success("Tarefa removida com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover tarefa: " + error.message);
    },
  });
};
