import { useMemo } from "react";
import { useGivenGifts } from "./useGivenGifts";
import { GivenGift } from "@/types/givenGift";

type SuggestableField =
  | "surname"
  | "first_name"
  | "father_name"
  | "nickname"
  | "village"
  | "relationship";

/**
 * Distinct, non-empty values for a given field across the user's given_gifts.
 * Powers autocomplete on the "Δώρα μου" form.
 */
export const useGivenFieldSuggestions = (field: SuggestableField): string[] => {
  const { data: gifts = [] } = useGivenGifts();

  return useMemo(() => {
    const set = new Map<string, string>();
    for (const g of gifts as GivenGift[]) {
      const raw = (g[field] as string | null | undefined) ?? "";
      const v = raw.trim();
      if (!v) continue;
      const key = v.toLocaleLowerCase("el-GR");
      if (!set.has(key)) set.set(key, v);
    }
    return Array.from(set.values()).sort((a, b) =>
      a.localeCompare(b, "el-GR", { sensitivity: "base" }),
    );
  }, [gifts, field]);
};
