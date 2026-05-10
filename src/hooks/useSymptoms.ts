import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Symptom } from "@/types/medical";

export const useSymptoms = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["symptoms", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Symptom[]> => {
      const { data, error } = await supabase
        .from("symptoms")
        .select("*")
        .order("observed_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Symptom[];
    },
  });

  const create = useMutation({
    mutationFn: async (s: Partial<Symptom>) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("symptoms").insert({
        ...s,
        user_id: user.id,
        description: s.description || "",
        observed_date: s.observed_date || new Date().toISOString(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      toast.success("Η καταχώρηση αποθηκεύτηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Symptom> & { id: string }) => {
      const { error } = await supabase.from("symptoms").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      toast.success("Η καταχώρηση ενημερώθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("symptoms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["symptoms"] });
      toast.success("Η καταχώρηση διαγράφηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
};
