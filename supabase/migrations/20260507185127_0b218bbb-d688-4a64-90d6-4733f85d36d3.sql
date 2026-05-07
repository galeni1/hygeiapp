-- Drop old gift-related tables and types
DROP TABLE IF EXISTS public.gift_history CASCADE;
DROP TABLE IF EXISTS public.given_gifts CASCADE;
DROP TABLE IF EXISTS public.given_event_types CASCADE;
DROP TABLE IF EXISTS public.gift_sources CASCADE;
DROP TABLE IF EXISTS public.wedding_gifts CASCADE;
DROP TABLE IF EXISTS public.personal_events CASCADE;
DROP TYPE IF EXISTS public.gift_history_action CASCADE;
DROP FUNCTION IF EXISTS public.log_wedding_gift_history() CASCADE;
DROP FUNCTION IF EXISTS public.log_given_gift_history() CASCADE;

-- Doctors table
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own doctors" ON public.doctors FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own doctors" ON public.doctors FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own doctors" ON public.doctors FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own doctors" ON public.doctors FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER doctors_updated_at BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Specialties (custom list per user)
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own specialties" ON public.specialties FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own specialties" ON public.specialties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own specialties" ON public.specialties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own specialties" ON public.specialties FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER specialties_updated_at BEFORE UPDATE ON public.specialties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Visits table
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  specialty TEXT,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  diagnosis TEXT,
  prescription TEXT,
  cost NUMERIC(10,2),
  notes TEXT,
  next_appointment DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_visits_user_date ON public.visits(user_id, visit_date DESC);
CREATE INDEX idx_visits_doctor ON public.visits(doctor_id);

ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own visits" ON public.visits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own visits" ON public.visits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own visits" ON public.visits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own visits" ON public.visits FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER visits_updated_at BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Appointments (upcoming reminders)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  doctor_name TEXT,
  specialty TEXT,
  appointment_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointments_user_date ON public.appointments(user_id, appointment_date);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own appointments" ON public.appointments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();