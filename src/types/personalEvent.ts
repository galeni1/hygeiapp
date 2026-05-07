export interface PersonalEvent {
  id: string;
  user_id: string;
  name: string;
  event_type: string | null;
  event_date: string | null; // ISO yyyy-mm-dd
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalEventFormData {
  name: string;
  event_type?: string;
  event_date?: string;
  notes?: string;
}
