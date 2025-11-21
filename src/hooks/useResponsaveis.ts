import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Responsavel {
  id: string;
  nome: string;
  created_at: string | null;
}

export const useResponsaveis = () => {
  return useQuery({
    queryKey: ["responsaveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("responsaveis")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as Responsavel[];
    },
  });
};

export const useAddResponsavel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("responsaveis")
        .insert({ nome })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável adicionado com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar responsável: ${error.message}`);
    },
  });
};
