import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GivenEventType {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const QK = ["given-event-types"] as const;

export const useGivenEventTypes = () => {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<GivenEventType[]> => {
      const { data, error } = await supabase
        .from("given_event_types")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as GivenEventType[];
    },
  });
};

export const useCreateGivenEventType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("given_event_types")
        .insert([{ name: name.trim(), user_id: user.id }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as GivenEventType;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Ο τύπος εκδήλωσης προστέθηκε!");
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useUpdateGivenEventType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from("given_event_types")
        .update({ name: name.trim() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as GivenEventType;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Ενημερώθηκε!");
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useDeleteGivenEventType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("given_event_types")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Διαγράφηκε!");
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};
