import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GivenGift, GivenGiftFormData } from "@/types/givenGift";
import { toast } from "sonner";

const QK = ["given-gifts"] as const;

const normalize = (g: Record<string, unknown>): GivenGift => {
  const amount = g.gift_amount;
  return {
    ...(g as unknown as GivenGift),
    gift_amount:
      amount === null || amount === undefined || amount === ""
        ? null
        : Number(amount),
  };
};

export const useGivenGifts = () => {
  return useQuery({
    queryKey: QK,
    queryFn: async (): Promise<GivenGift[]> => {
      const pageSize = 1000;
      const all: GivenGift[] = [];
      for (let page = 0; ; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from("given_gifts")
          .select("*")
          .order("event_date", { ascending: false, nullsFirst: false })
          .order("surname", { ascending: true })
          .range(from, to);
        if (error) throw new Error(error.message);
        const chunk = (data || []).map(normalize);
        all.push(...chunk);
        if (chunk.length < pageSize) break;
      }
      const seen = new Set<string>();
      return all.filter((g) => (seen.has(g.id) ? false : (seen.add(g.id), true)));
    },
  });
};

export const useCreateGivenGift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gift: GivenGiftFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("given_gifts")
        .insert([{ ...gift, user_id: user.id }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalize(data as Record<string, unknown>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Η εγγραφή προστέθηκε επιτυχώς!");
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useUpdateGivenGift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...gift }: GivenGiftFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("given_gifts")
        .update(gift)
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return normalize(data as Record<string, unknown>);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Η εγγραφή ενημερώθηκε επιτυχώς!");
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useDeleteGivenGift = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("given_gifts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success("Η εγγραφή διαγράφηκε επιτυχώς!");
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useBulkUpdateGivenGifts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, string | null> }) => {
      if (ids.length === 0 || Object.keys(updates).length === 0) return 0;
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from("given_gifts")
          .update(updates as never)
          .in("id", batch);
        if (error) throw new Error(error.message);
      }
      return ids.length;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success(`Ενημερώθηκαν ${count} εγγραφές!`);
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};

export const useTransferGivenToWedding = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (gifts: GivenGift[]) => {
      if (gifts.length === 0) return 0;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const rows = gifts.map((g) => ({
        user_id: user.id,
        surname: g.surname,
        first_name: g.first_name,
        father_name: g.father_name,
        nickname: g.nickname,
        village: g.village,
      }));

      const batchSize = 100;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error, data } = await supabase
          .from("wedding_gifts")
          .insert(batch)
          .select("id");
        if (error) throw new Error(error.message);
        inserted += (data || []).length;
      }
      return inserted;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Μεταφέρθηκαν ${count} εγγραφές στους καλεσμένους!`);
    },
    onError: (e) => toast.error(`Σφάλμα μεταφοράς: ${e.message}`),
  });
};

export const useRestoreGivenGifts = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("given_gifts")
        .update({ deleted_at: null })
        .in("id", ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, ids) => {
      qc.invalidateQueries({ queryKey: QK });
      toast.success(`Επαναφέρθηκαν ${ids.length} εγγραφές!`);
    },
    onError: (e) => toast.error(`Σφάλμα: ${e.message}`),
  });
};
