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
import { useSymptoms } from "@/hooks/useSymptoms";
import { useVisits } from "@/hooks/useVisits";
import type { Symptom } from "@/types/medical";
import { smartMatch } from "@/lib/search";

interface SymptomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  symptom?: Symptom | null;
}

export const SymptomFormDialog = ({ open, onOpenChange, symptom }: SymptomFormDialogProps) => {
  const { data: symptoms = [], create, update, remove } = useSymptoms();
  const { data: visits = [] } = useVisits();

  const [readOnly, setReadOnly] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bodyPartFocused, setBodyPartFocused] = useState(false);

  const bodyParts = useMemo(() => {
    const set = new Set<string>();
    symptoms.forEach((s) => s.body_part && set.add(s.body_part));
    visits.forEach((v) => v.body_part && set.add(v.body_part));
    return Array.from(set).sort();
  }, [symptoms, visits]);

  const [form, setForm] = useState({
    observed_date: format(new Date(), "yyyy-MM-dd"),
    observed_time: format(new Date(), "HH:mm"),
    body_part: "",
    description: "",
    severity: "",
    notes: "",
    resolved_date: "",
  });

  useEffect(() => {
    if (!open) return;
    if (symptom) {
      const d = new Date(symptom.observed_date);
      setForm({
        observed_date: format(d, "yyyy-MM-dd"),
        observed_time: format(d, "HH:mm"),
        body_part: symptom.body_part || "",
        description: symptom.description || "",
        severity: symptom.severity?.toString() || "",
        notes: symptom.notes || "",
        resolved_date: symptom.resolved_at ? format(new Date(symptom.resolved_at), "yyyy-MM-dd") : "",
      });
      setReadOnly(true);
    } else {
      const now = new Date();
      setForm({
        observed_date: format(now, "yyyy-MM-dd"),
        observed_time: format(now, "HH:mm"),
        body_part: "",
        description: "",
        severity: "",
        notes: "",
        resolved_date: "",
      });
      setReadOnly(false);
    }
  }, [symptom, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (create.isPending || update.isPending) return;
    if (!form.description.trim()) return;
    const sev = form.severity ? parseInt(form.severity) : null;
    const payload: Partial<Symptom> = {
      observed_date: new Date(`${form.observed_date}T${form.observed_time}:00`).toISOString(),
      body_part: form.body_part || null,
      description: form.description,
      severity: sev != null && !Number.isNaN(sev) ? sev : null,
      notes: form.notes || null,
      resolved_at: form.resolved_date ? new Date(`${form.resolved_date}T00:00:00`).toISOString() : null,
    };
    if (symptom) {
      await update.mutateAsync({ id: symptom.id, ...payload });
    } else {
      await create.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!symptom) return;
    await remove.mutateAsync(symptom.id);
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
              {symptom ? (readOnly ? "Προβολή καταχώρησης" : "Επεξεργασία καταχώρησης") : "Νέα καταχώρηση συμπτώματος"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={disabled} className={cn("space-y-4", disabled && "opacity-60")}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ημερομηνία παρατήρησης *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn("w-full justify-start text-left font-normal", !form.observed_date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.observed_date ? format(new Date(form.observed_date), "dd/MM/yyyy") : "Επιλέξτε"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.observed_date ? new Date(form.observed_date) : undefined}
                        onSelect={(d) => d && setForm({ ...form, observed_date: format(d, "yyyy-MM-dd") })}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Ώρα</Label>
                  <TimeInput24
                    value={form.observed_time}
                    onChange={(v) => setForm({ ...form, observed_time: v })}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Όργανο / Μέρος σώματος</Label>
                  <div className="relative">
                    <Input
                      value={form.body_part}
                      onChange={(e) => setForm({ ...form, body_part: e.target.value })}
                      onFocus={() => setBodyPartFocused(true)}
                      onBlur={() => setTimeout(() => setBodyPartFocused(false), 150)}
                      placeholder="π.χ. καρπός δεξιά"
                      autoComplete="off"
                    />
                    {bodyPartFocused && !disabled && (() => {
                      const suggestions = bodyParts.filter(
                        (b) => smartMatch(b, form.body_part) && b.toLowerCase() !== form.body_part.toLowerCase()
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

                <div className="space-y-2 sm:col-span-2">
                  <Label>Περιγραφή *</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="π.χ. πόνος στον καρπό όταν τον γυρίζω"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Ένταση (1-10)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    placeholder="—"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Αποκατάσταση</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={disabled}
                        className={cn("w-full justify-start text-left font-normal", !form.resolved_date && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.resolved_date ? format(new Date(form.resolved_date), "dd/MM/yyyy") : "Συνεχίζεται"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.resolved_date ? new Date(form.resolved_date) : undefined}
                        onSelect={(d) => setForm({ ...form, resolved_date: d ? format(d, "yyyy-MM-dd") : "" })}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Σημειώσεις</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Συνθήκες, τι το χειροτερεύει/βελτιώνει..."
                />
              </div>
            </fieldset>

            <DialogFooter className="gap-2 sm:gap-2">
              {symptom && readOnly ? (
                <>
                  <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>
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
                    onClick={() => (symptom ? setReadOnly(true) : onOpenChange(false))}
                  >
                    Ακύρωση
                  </Button>
                  <Button type="submit" disabled={create.isPending || update.isPending}>
                    {create.isPending || update.isPending
                      ? "Αποθήκευση..."
                      : symptom ? "Αποθήκευση" : "Καταχώρηση"}
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
            <AlertDialogTitle>Διαγραφή καταχώρησης;</AlertDialogTitle>
            <AlertDialogDescription>Η ενέργεια δεν μπορεί να αναιρεθεί.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
