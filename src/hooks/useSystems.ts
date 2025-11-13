import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
        .from("systems")
        .select(`
          *,
          system_links (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as System[];
    },
  });
};

export const useAddSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (system: { title: string; description?: string }) => {
      const { data, error } = await supabase
        .from("systems")
        .insert(system)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
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
        .from("systems")
        .update({ title, description })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
  });
};

export const useDeleteSystem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("systems").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
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
        .from("system_links")
        .insert(link)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
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
        .from("system_links")
        .update({ title, url, icon })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
  });
};

export const useDeleteSystemLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("system_links").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems"] });
    },
  });
};
