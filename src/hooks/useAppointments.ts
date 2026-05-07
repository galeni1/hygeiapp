import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Appointment } from "@/types/medical";

export const useAppointments = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["appointments", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      return (data || []) as Appointment[];
    },
  });

  const create = useMutation({
    mutationFn: async (appt: Partial<Appointment>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("appointments")
        .insert({ ...appt, user_id: user.id, appointment_date: appt.appointment_date! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Το ραντεβού καταχωρήθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Appointment> & { id: string }) => {
      const { error } = await supabase.from("appointments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Το ραντεβού ενημερώθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Το ραντεβού διαγράφηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
};
