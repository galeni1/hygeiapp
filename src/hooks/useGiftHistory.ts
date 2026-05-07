import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GiftHistoryAction = "create" | "update" | "delete" | "restore" | "permanent_delete";

export interface GiftHistoryEntry {
  id: string;
  gift_id: string;
  user_id: string;
  action: GiftHistoryAction;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  snapshot: Record<string, unknown> | null;
  created_at: string;
}

export const useGiftHistory = (giftId: string | null | undefined) => {
  return useQuery({
    queryKey: ["gift-history", giftId],
    enabled: !!giftId,
    queryFn: async (): Promise<GiftHistoryEntry[]> => {
      const { data, error } = await supabase
        .from("gift_history")
        .select("*")
        .eq("gift_id", giftId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as unknown as GiftHistoryEntry[];
    },
  });
};
