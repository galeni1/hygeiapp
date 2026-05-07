import { useMemo } from "react";
import { useGifts } from "./useGifts";
import { WeddingGift } from "@/types/gift";

type SuggestableField =
  | "surname"
  | "first_name"
  | "father_name"
  | "nickname"
  | "village"
  | "responsible";

/**
 * Returns distinct, non-empty values for a given field across all of the
 * current user's wedding_gifts. Used to power autocomplete suggestions so
 * the user does not retype (and accidentally misspell) repeated names,
 * villages, etc.
 */
export const useFieldSuggestions = (field: SuggestableField): string[] => {
  const { data: gifts = [] } = useGifts();

  return useMemo(() => {
    const set = new Map<string, string>(); // key=lowercased, value=original casing (first seen)
    for (const g of gifts as WeddingGift[]) {
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
