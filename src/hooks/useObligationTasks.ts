import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface ObligationTask {
  id: string;
  periodo: string;
  tarefa: string;
  se_aplica: string;
  responsaveis: string;
  order_index: number;
  competencia_id: string | null;
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

export const useObligationTasks = (competenciaId?: string) => {
  return useQuery({
    queryKey: ["obligation-tasks", competenciaId],
    queryFn: async () => {
      let query = supabase
        .from("obligation_tasks")
        .select("*")
        .order("order_index", { ascending: true });

      if (competenciaId) {
        query = query.eq("competencia_id", competenciaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ObligationTask[];
    },
    enabled: !!competenciaId,
  });
};

export const useAddObligationTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<ObligationTask, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("obligation_tasks")
        .insert(task)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["obligation-tasks", variables.competencia_id] });
      toast.success("Obrigação adicionada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar obrigação: " + error.message);
    },
  });
};

export const useUpdateObligationTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ObligationTask> & { id: string }) => {
      const { data, error } = await supabase
        .from("obligation_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["obligation-tasks", data.competencia_id] });
      toast.success("Obrigação atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar obrigação: " + error.message);
    },
  });
};

export const useDeleteObligationTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, competencia_id }: { id: string; competencia_id: string | null }) => {
      const { error } = await supabase
        .from("obligation_tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { competencia_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["obligation-tasks", data.competencia_id] });
      toast.success("Obrigação removida com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover obrigação: " + error.message);
    },
  });
};
