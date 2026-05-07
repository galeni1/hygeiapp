export const EVENT_TYPES = [
  "Γάμος",
  "Αρραβώνας",
  "Βάφτιση",
  "Γενέθλια",
  "Ονομαστική",
  "Άλλο",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface GivenGift {
  id: string;
  number: number | null;
  surname: string;
  first_name: string;
  father_name: string | null;
  nickname: string | null;
  village: string | null;
  relationship: string | null;
  event_type: string | null;
  event_date: string | null; // ISO date (yyyy-mm-dd)
  gift_amount: number | null;
  details: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GivenGiftFormData {
  number?: number;
  surname: string;
  first_name: string;
  father_name?: string;
  nickname?: string;
  village?: string;
  relationship?: string;
  event_type?: string;
  event_date?: string;
  gift_amount?: number;
  details?: string;
}
