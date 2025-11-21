import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { toast } from "sonner";

export interface Competencia {
  id: string;
  nome: string;
  created_at?: string;
  updated_at?: string;
}

export const useCompetencias = () => {
  return useQuery({
    queryKey: ["competencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competencias")
        .select("*")
        .order("nome", { ascending: false });

      if (error) throw error;
      return data as Competencia[];
    },
  });
};

export const useAddCompetencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competencia: Omit<Competencia, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("competencias")
        .insert(competencia)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencias"] });
      toast.success("Competência adicionada com sucesso");
    },
    onError: (error: any) => {
      if (error.message.includes("duplicate key")) {
        toast.error("Essa competência já existe");
      } else {
        toast.error("Erro ao adicionar competência: " + error.message);
      }
    },
  });
};

export const useUpdateCompetencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Competencia> & { id: string }) => {
      const { data, error } = await supabase
        .from("competencias")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencias"] });
      toast.success("Competência atualizada com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar competência: " + error.message);
    },
  });
};

export const useDeleteCompetencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("competencias")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencias"] });
      queryClient.invalidateQueries({ queryKey: ["operational-tasks"] });
      toast.success("Competência removida com sucesso");
    },
    onError: (error) => {
      toast.error("Erro ao remover competência: " + error.message);
    },
  });
};
