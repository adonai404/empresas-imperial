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
  competencia_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export const useOperationalTasks = (competenciaId?: string) => {
  return useQuery({
    queryKey: ["operational-tasks", competenciaId],
    queryFn: async () => {
      let query = supabase
        .from("operational_tasks")
        .select("*")
        .order("order_index", { ascending: true });

      if (competenciaId) {
        query = query.eq("competencia_id", competenciaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as OperationalTask[];
    },
    enabled: !!competenciaId,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["operational-tasks", variables.competencia_id] });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["operational-tasks", data.competencia_id] });
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
    mutationFn: async ({ id, competencia_id }: { id: string; competencia_id: string | null }) => {
      const { error } = await supabase
        .from("operational_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { competencia_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["operational-tasks", data.competencia_id] });
      toast.success("Tarefa removida com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover tarefa: " + error.message);
    },
  });
};
