import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDoctors } from "@/hooks/useDoctors";
import { useAppointments } from "@/hooks/useAppointments";
import type { Appointment } from "@/types/medical";

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
}

export const AppointmentFormDialog = ({
  open,
  onOpenChange,
  appointment,
}: AppointmentFormDialogProps) => {
  const { data: doctors = [] } = useDoctors();
  const { create, update } = useAppointments();

  const [form, setForm] = useState({
    doctor_id: "",
    doctor_name: "",
    specialty: "",
    date: new Date().toISOString().slice(0, 10),
    time: "10:00",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (appointment) {
      const d = new Date(appointment.appointment_date);
      setForm({
        doctor_id: appointment.doctor_id || "",
        doctor_name: appointment.doctor_name || "",
        specialty: appointment.specialty || "",
        date: format(d, "yyyy-MM-dd"),
        time: format(d, "HH:mm"),
        reason: appointment.reason || "",
        notes: appointment.notes || "",
      });
    } else {
      setForm({
        doctor_id: "",
        doctor_name: "",
        specialty: "",
        date: new Date().toISOString().slice(0, 10),
        time: "10:00",
        reason: "",
        notes: "",
      });
    }
  }, [appointment, open]);

  const handleDoctorChange = (id: string) => {
    const doc = doctors.find((d) => d.id === id);
    setForm((f) => ({
      ...f,
      doctor_id: id,
      doctor_name: doc?.name || "",
      specialty: doc?.specialty || f.specialty,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dt = new Date(`${form.date}T${form.time}:00`);
    const payload: Partial<Appointment> = {
      doctor_id: form.doctor_id || null,
      doctor_name: form.doctor_name || null,
      specialty: form.specialty || null,
      appointment_date: dt.toISOString(),
      reason: form.reason || null,
      notes: form.notes || null,
    };
    if (appointment) {
      await update.mutateAsync({ id: appointment.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{appointment ? "Επεξεργασία ραντεβού" : "Νέο ραντεβού"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ιατρός</Label>
            {doctors.length > 0 ? (
              <Select value={form.doctor_id} onValueChange={handleDoctorChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Επιλέξτε ιατρό" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} {d.specialty ? `· ${d.specialty}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Όνομα ιατρού"
                value={form.doctor_name}
                onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ημερομηνία *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(new Date(form.date), "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(form.date)}
                    onSelect={(d) => d && setForm({ ...form, date: format(d, "yyyy-MM-dd") })}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Ώρα</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Λόγος</Label>
            <Input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Σημειώσεις</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Ακύρωση
            </Button>
            <Button type="submit">{appointment ? "Αποθήκευση" : "Καταχώρηση"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
