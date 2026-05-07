import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDoctors } from "@/hooks/useDoctors";
import { useSpecialties } from "@/hooks/useSpecialties";
import type { Doctor } from "@/types/medical";

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | null;
}

export const DoctorFormDialog = ({ open, onOpenChange, doctor }: DoctorFormDialogProps) => {
  const { create, update } = useDoctors();
  const { data: specialties = [] } = useSpecialties();
  const [form, setForm] = useState({
    name: "",
    specialty: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        name: doctor.name,
        specialty: doctor.specialty || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        address: doctor.address || "",
        notes: doctor.notes || "",
      });
    } else {
      setForm({ name: "", specialty: "", phone: "", email: "", address: "", notes: "" });
    }
  }, [doctor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (create.isPending || update.isPending) return;
    const payload = {
      name: form.name.trim(),
      specialty: form.specialty || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      notes: form.notes || null,
    };
    if (doctor) {
      await update.mutateAsync({ id: doctor.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{doctor ? "Επεξεργασία ιατρού" : "Νέος ιατρός"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Ονοματεπώνυμο *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Ειδικότητα</Label>
            <Input
              list="doctor-specialty-list"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            />
            <datalist id="doctor-specialty-list">
              {specialties.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Τηλέφωνο</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Διεύθυνση ιατρείου</Label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
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
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending
                ? "Αποθήκευση..."
                : doctor ? "Αποθήκευση" : "Προσθήκη"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
