import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WeddingGift, GiftFormData } from "@/types/gift";
import { toast } from "sonner";

/**
 * eventFilter:
 *   - undefined → all gifts (default, used by /events overview, /stats, etc.)
 *   - "none"   → only gifts with event_id IS NULL
 *   - <uuid>   → only gifts belonging to that event
 */
export const useGifts = (eventFilter?: string | "none") => {
  return useQuery({
    queryKey: ["wedding-gifts", eventFilter ?? "__all__"],
    queryFn: async (): Promise<WeddingGift[]> => {
      const pageSize = 1000;
      const all: WeddingGift[] = [];

      const normalize = (g: Record<string, unknown>): WeddingGift => {
        const amount = g.gift_amount;
        return {
          ...(g as unknown as WeddingGift),
          gift_amount: amount === null || amount === undefined || amount === ""
            ? null
            : Number(amount),
        };
      };

      for (let page = 0; ; page++) {
        const from = page * pageSize;
        const to = from + pageSize - 1;

        let q = supabase
          .from("wedding_gifts")
          .select("*")
          .order("surname", { ascending: true })
          .order("id", { ascending: true })
          .range(from, to);

        if (eventFilter === "none") {
          q = q.is("event_id", null);
        } else if (eventFilter) {
          q = q.eq("event_id", eventFilter);
        }

        const { data, error } = await q;

        if (error) throw new Error(error.message);

        const chunk = (data || []).map(normalize);
        all.push(...chunk);

        if (chunk.length < pageSize) break;
      }

      const seen = new Set<string>();
      return all.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });
    },
  });
};

export const useCreateGift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (gift: GiftFormData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wedding_gifts")
        .insert([{ ...gift, user_id: user.id }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const row = data as Record<string, unknown> | null;
      const amount = row?.gift_amount;
      return {
        ...(row as unknown as WeddingGift),
        gift_amount:
          amount === null || amount === undefined || amount === ""
            ? null
            : Number(amount),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success("Η εγγραφή προστέθηκε επιτυχώς!");
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const useUpdateGift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...gift }: GiftFormData & { id: string }) => {
      const { data, error } = await supabase
        .from("wedding_gifts")
        .update(gift)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      const row = data as Record<string, unknown> | null;
      const amount = row?.gift_amount;
      return {
        ...(row as unknown as WeddingGift),
        gift_amount:
          amount === null || amount === undefined || amount === ""
            ? null
            : Number(amount),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success("Η εγγραφή ενημερώθηκε επιτυχώς!");
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const usePatchGift = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<WeddingGift> }) => {
      const { error } = await supabase
        .from("wedding_gifts")
        .update(patch)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      queryClient.invalidateQueries({ queryKey: ["gift-history"] });
      toast.success("Αποθηκεύτηκε");
    },
    onError: (error: Error) => toast.error(`Σφάλμα: ${error.message}`),
  });
};

export const useDeleteGift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("wedding_gifts")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success("Η εγγραφή διαγράφηκε επιτυχώς!");
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const useBulkDeleteGifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const batchSize = 100;
      const now = new Date().toISOString();
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from("wedding_gifts")
          .update({ deleted_at: now })
          .in("id", batch);

        if (error) {
          throw new Error(error.message);
        }
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Διαγράφηκαν ${ids.length} εγγραφές επιτυχώς!`);
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const useDeleteAllGifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const { data, error: fetchError } = await supabase
        .from("wedding_gifts")
        .select("id")
        .is("deleted_at", null);

      if (fetchError) throw new Error(fetchError.message);
      if (!data || data.length === 0) return 0;

      const ids = data.map((r) => r.id);
      const batchSize = 200;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from("wedding_gifts")
          .update({ deleted_at: now })
          .in("id", batch);
        if (error) throw new Error(error.message);
      }
      return ids.length;
    },
    onSuccess: (deleted) => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Διαγράφηκαν ${deleted} εγγραφές επιτυχώς!`);
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const useRestoreGifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from("wedding_gifts")
          .update({ deleted_at: null })
          .in("id", batch);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Επαναφέρθηκαν ${ids.length} εγγραφές!`);
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const usePermanentDeleteGifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from("wedding_gifts")
          .delete()
          .in("id", batch);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Διαγράφηκαν οριστικά ${ids.length} εγγραφές!`);
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const useBulkUpdateGifts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: Record<string, string | null> }) => {
      if (ids.length === 0 || Object.keys(updates).length === 0) return 0;
      const batchSize = 100;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error } = await supabase
          .from("wedding_gifts")
          .update(updates as never)
          .in("id", batch);
        if (error) throw new Error(error.message);
      }
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Ενημερώθηκαν ${count} εγγραφές!`);
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};

export const useImportExcelData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('import-excel-data');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      toast.success(`Εισήχθησαν ${data.inserted} εγγραφές επιτυχώς!`);
    },
    onError: (error) => {
      toast.error(`Σφάλμα: ${error.message}`);
    },
  });
};
