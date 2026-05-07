import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Doctor } from "@/types/medical";

export const useDoctors = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["doctors", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Doctor[]> => {
      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data || []) as Doctor[];
    },
  });

  const create = useMutation({
    mutationFn: async (doctor: Partial<Doctor>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("doctors")
        .insert({ ...doctor, user_id: user.id, name: doctor.name! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Ο ιατρός προστέθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Doctor> & { id: string }) => {
      const { error } = await supabase.from("doctors").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Ο ιατρός ενημερώθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doctors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Ο ιατρός διαγράφηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
};
