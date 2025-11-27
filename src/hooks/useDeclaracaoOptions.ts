import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeclaracaoOption {
  id: string;
  nome: string;
  created_at: string;
}

export const useDeclaracaoOptions = () => {
  return useQuery({
    queryKey: ["declaracao_options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("declaracao_options")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as DeclaracaoOption[];
    },
  });
};

export const useAddDeclaracaoOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from("declaracao_options")
        .insert({ nome: nome.toUpperCase() })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["declaracao_options"] });
      toast.success("Declaração adicionada com sucesso");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Esta declaração já existe");
      } else {
        toast.error(`Erro ao adicionar declaração: ${error.message}`);
      }
    },
  });
};
