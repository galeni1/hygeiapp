export interface WeddingGift {
  id: string;
  source: string | null;
  number: number | null;
  village: string | null;
  guest_type: string | null;
  surname: string;
  first_name: string;
  father_name: string | null;
  nickname: string | null;
  responsible: string | null;
  gift_amount: number | null;
  details: string | null;
  event_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface GiftFormData {
  source?: string;
  number?: number;
  village?: string;
  guest_type?: string;
  surname: string;
  first_name: string;
  father_name?: string;
  nickname?: string;
  responsible?: string;
  gift_amount?: number;
  details?: string;
  event_id?: string | null;
}
