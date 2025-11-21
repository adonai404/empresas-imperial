import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SeAplicaOption {
  id: string;
  nome: string;
  created_at: string;
}

export const useSeAplicaOptions = () => {
  return useQuery({
    queryKey: ["se_aplica_options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("se_aplica_options")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as SeAplicaOption[];
    },
  });
};

export const useAddSeAplicaOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("se_aplica_options")
        .insert({ nome })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["se_aplica_options"] });
      toast.success("Opção adicionada com sucesso");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar opção: ${error.message}`);
    },
  });
};
