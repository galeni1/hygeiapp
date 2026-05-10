import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Pencil, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TimeInput24 } from "@/components/ui/time-input-24";
import { useDoctors } from "@/hooks/useDoctors";
import { useSpecialties } from "@/hooks/useSpecialties";
import { useVisits } from "@/hooks/useVisits";
import type { Visit } from "@/types/medical";
import { smartMatch } from "@/lib/search";

interface VisitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit?: Visit | null;
}

export const VisitFormDialog = ({ open, onOpenChange, visit }: VisitFormDialogProps) => {
  const { data: doctors = [] } = useDoctors();
  const { data: specialties = [] } = useSpecialties();
  const { data: visits = [], create, update, remove } = useVisits();

  const [readOnly, setReadOnly] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bodyPartFocused, setBodyPartFocused] = useState(false);

  const bodyParts = useMemo(() => {
    const set = new Set<string>();
    visits.forEach((v) => v.body_part && set.add(v.body_part));
    return Array.from(set).sort();
  }, [visits]);

  const [form, setForm] = useState({
    doctor_id: "",
    doctor_name: "",
    specialty: "",
    visit_date: format(new Date(), "yyyy-MM-dd"),
    visit_time: format(new Date(), "HH:mm"),
    body_part: "",
    reason: "",
    diagnosis: "",
    prescription: "",
    cost: "",
    notes: "",
    next_appointment: "",
  });

  useEffect(() => {
    if (!open) return;
    if (visit) {
      const d = new Date(visit.visit_date);
      setForm({
        doctor_id: visit.doctor_id || "",
        doctor_name: visit.doctor_name || "",
        specialty: visit.specialty || "",
        visit_date: format(d, "yyyy-MM-dd"),
        visit_time: format(d, "HH:mm"),
        body_part: visit.body_part || "",
        reason: visit.reason || "",
        diagnosis: visit.diagnosis || "",
        prescription: visit.prescription || "",
        cost: visit.cost?.toString() || "",
        notes: visit.notes || "",
        next_appointment: visit.next_appointment || "",
      });
      setReadOnly(true);
    } else {
      const now = new Date();
      setForm({
        doctor_id: "",
        doctor_name: "",
        specialty: "",
        visit_date: format(now, "yyyy-MM-dd"),
        visit_time: format(now, "HH:mm"),
        body_part: "",
        reason: "",
        diagnosis: "",
        prescription: "",
        cost: "",
        notes: "",
        next_appointment: "",
      });
      setReadOnly(false);
    }
  }, [visit, open]);

  const handleDoctorNameChange = (name: string) => {
    const doc = doctors.find((d) => d.name.toLowerCase() === name.toLowerCase());
    setForm((f) => ({
      ...f,
      doctor_id: doc?.id || "",
      doctor_name: name,
      specialty: doc?.specialty || f.specialty,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (create.isPending || update.isPending) return;
    const payload: Partial<Visit> = {
      doctor_id: form.doctor_id || null,
      doctor_name: form.doctor_name || null,
      specialty: form.specialty || null,
      visit_date: new Date(`${form.visit_date}T${form.visit_time}:00`).toISOString(),
      body_part: form.body_part || null,
      reason: form.reason || null,
      diagnosis: form.diagnosis || null,
      prescription: form.prescription || null,
      cost: form.cost ? parseFloat(form.cost) : null,
      notes: form.notes || null,
      next_appointment: form.next_appointment || null,
    };
    if (visit) {
      await update.mutateAsync({ id: visit.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!visit) return;
    await remove.mutateAsync(visit.id);
    setConfirmDelete(false);
    onOpenChange(false);
  };

  const disabled = readOnly;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {visit ? (readOnly ? "Προβολή επίσκεψης" : "Επεξεργασία επίσκεψης") : "Νέα επίσκεψη"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={disabled} className={cn("space-y-4", disabled && "opacity-60")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ιατρός</Label>
                  <Input
                    list="visit-doctor-list"
                    placeholder="Πληκτρολογήστε ή επιλέξτε ιατρό"
                    value={form.doctor_name}
                    onChange={(e) => handleDoctorNameChange(e.target.value)}
                  />
                  <datalist id="visit-doctor-list">
                    {doctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.specialty || ""}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label>Ειδικότητα</Label>
                  <Input
                    list="specialty-list"
                    value={form.specialty}
                    onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                    placeholder="π.χ. Παθολόγος"
                  />
                  <datalist id="specialty-list">
                    {specialties.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label>Ημερομηνία επίσκεψης *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.visit_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.visit_date ? format(new Date(form.visit_date), "dd/MM/yyyy") : "Επιλέξτε"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.visit_date ? new Date(form.visit_date) : undefined}
                        onSelect={(d) => d && setForm({ ...form, visit_date: format(d, "yyyy-MM-dd") })}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ώρα</Label>
                  <TimeInput24
                    value={form.visit_time}
                    onChange={(v) => setForm({ ...form, visit_time: v })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Όργανο προς εξέταση</Label>
                  <div className="relative">
                    <Input
                      value={form.body_part}
                      onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                      onFocus={() => setBodyPartFocused(true)}
                      onBlur={() => setTimeout(() => setBodyPartFocused(false), 150)}
                      placeholder="π.χ. γόνατο αριστερά"
                      autoComplete="off"
                    />
                    {bodyPartFocused && !disabled && (() => {
                      const suggestions = bodyParts.filter(
                        (b) =>
                          smartMatch(b, form.body_part) &&
                          b.toLowerCase() !== form.body_part.toLowerCase()
                      );
                      if (suggestions.length === 0) return null;
                      return (
                        <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-48 overflow-y-auto">
                          {suggestions.map((b) => (
                            <button
                              key={b}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setForm({ ...form, body_part: b });
                                setBodyPartFocused(false);
                              }}
                            >
                              {b}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Κόστος (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Λόγος επίσκεψης</Label>
                <Input
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="π.χ. Έλεγχος ρουτίνας"
                />
              </div>

              <div className="space-y-2">
                <Label>Διάγνωση</Label>
                <Textarea
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Φαρμακευτική αγωγή / Συνταγογράφηση</Label>
                <Textarea
                  value={form.prescription}
                  onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                  rows={2}
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

              <div className="space-y-2">
                <Label>Επόμενο ραντεβού</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.next_appointment && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.next_appointment
                        ? format(new Date(form.next_appointment), "dd/MM/yyyy")
                        : "Χωρίς"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.next_appointment ? new Date(form.next_appointment) : undefined}
                      onSelect={(d) =>
                        setForm({ ...form, next_appointment: d ? format(d, "yyyy-MM-dd") : "" })
                      }
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </fieldset>

            <DialogFooter className="gap-2 sm:gap-2">
              {visit && readOnly ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Διαγραφή
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Κλείσιμο
                  </Button>
                  <Button type="button" onClick={() => setReadOnly(false)}>
                    <Pencil className="h-4 w-4 mr-1" /> Επεξεργασία
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => (visit ? setReadOnly(true) : onOpenChange(false))}
                  >
                    Ακύρωση
                  </Button>
                  <Button type="submit" disabled={create.isPending || update.isPending}>
                    {create.isPending || update.isPending
                      ? "Αποθήκευση..."
                      : visit ? "Αποθήκευση" : "Καταχώρηση"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή επίσκεψης;</AlertDialogTitle>
            <AlertDialogDescription>Η ενέργεια δεν μπορεί να αναιρεθεί.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={handleDelete}
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
