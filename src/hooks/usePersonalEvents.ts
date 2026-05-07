import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PersonalEvent, PersonalEventFormData } from "@/types/personalEvent";

const QK = ["personal-events"] as const;

export const usePersonalEvents = () => {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<PersonalEvent[]> => {
      const { data, error } = await supabase
        .from("personal_events")
        .select("*")
        .order("event_date", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as PersonalEvent[];
    },
  });
};

export const usePersonalEvent = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ["personal-event", id],
    enabled: !!id,
    queryFn: async (): Promise<PersonalEvent | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("personal_events")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as PersonalEvent) || null;
    },
  });
};

export const useCreatePersonalEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (form: PersonalEventFormData): Promise<PersonalEvent> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        event_type: form.event_type?.trim() || null,
        event_date: form.event_date || null,
        notes: form.notes?.trim() || null,
      };
      const { data, error } = await supabase
        .from("personal_events")
        .insert([payload])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as PersonalEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Η εκδήλωση δημιουργήθηκε!");
    },
    onError: (e: Error) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useUpdatePersonalEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: PersonalEventFormData & { id: string }) => {
      const payload = {
        name: form.name.trim(),
        event_type: form.event_type?.trim() || null,
        event_date: form.event_date || null,
        notes: form.notes?.trim() || null,
      };
      const { data, error } = await supabase
        .from("personal_events")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as PersonalEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      qc.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success("Η εκδήλωση ενημερώθηκε!");
    },
    onError: (e: Error) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useDeletePersonalEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personal_events").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      qc.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success("Η εκδήλωση διαγράφηκε. Τα δώρα μετακινήθηκαν στο «Χωρίς εκδήλωση».");
    },
    onError: (e: Error) => toast.error(`Σφάλμα: ${e.message}`),
  });
};
