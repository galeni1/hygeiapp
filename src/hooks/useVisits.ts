import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Visit } from "@/types/medical";

export const useVisits = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["visits", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Visit[]> => {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .is("deleted_at", null)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return (data || []) as Visit[];
    },
  });

  const create = useMutation({
    mutationFn: async (visit: Partial<Visit>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("visits")
        .insert({
          ...visit,
          user_id: user.id,
          visit_date: visit.visit_date || new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Η επίσκεψη καταχωρήθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Visit> & { id: string }) => {
      const { error } = await supabase.from("visits").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Η επίσκεψη ενημερώθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
      toast.success("Η επίσκεψη διαγράφηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkInsert = useMutation({
    mutationFn: async (visits: Partial<Visit>[]) => {
      if (!user) throw new Error("Not authenticated");
      const rows = visits.map((v) => ({
        ...v,
        user_id: user.id,
        visit_date: v.visit_date || new Date().toISOString().slice(0, 10),
      }));
      const { error } = await supabase.from("visits").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["visits"] });
    },
  });

  return { ...query, create, update, remove, bulkInsert };
};
