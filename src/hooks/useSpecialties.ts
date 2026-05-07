import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Specialty } from "@/types/medical";

export const useSpecialties = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["specialties", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Specialty[]> => {
      const { data, error } = await supabase.from("specialties").select("*").order("name");
      if (error) throw error;
      return (data || []) as Specialty[];
    },
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("specialties").insert({ user_id: user.id, name });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast.success("Η ειδικότητα προστέθηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("specialties").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specialties"] });
      toast.success("Η ειδικότητα διαγράφηκε");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { ...query, create, remove };
};
