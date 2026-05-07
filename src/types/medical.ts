export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  user_id: string;
  doctor_id: string | null;
  doctor_name: string | null;
  specialty: string | null;
  visit_date: string;
  reason: string | null;
  diagnosis: string | null;
  prescription: string | null;
  cost: number | null;
  notes: string | null;
  next_appointment: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: string | null;
  doctor_name: string | null;
  specialty: string | null;
  appointment_date: string;
  reason: string | null;
  notes: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Specialty {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
