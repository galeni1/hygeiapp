import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GiftSource {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export const useGiftSources = () => {
  return useQuery({
    queryKey: ["gift-sources"],
    queryFn: async (): Promise<GiftSource[]> => {
      const { data, error } = await supabase
        .from("gift_sources")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });
};

export const useCreateGiftSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Δεν είστε συνδεδεμένος");
      const { data, error } = await supabase
        .from("gift_sources")
        .insert([{ name: name.trim(), user_id: user.id }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gift-sources"] });
      toast.success("Η πηγή προστέθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useUpdateGiftSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("gift_sources")
        .update({ name: name.trim() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gift-sources"] });
      toast.success("Η πηγή ενημερώθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteGiftSource = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gift_sources").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gift-sources"] });
      toast.success("Η πηγή διαγράφηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
