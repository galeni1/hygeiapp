import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useGiftSources } from "@/hooks/useGiftSources";
import { PersonalEvent } from "@/types/personalEvent";

type FieldKey = "surname" | "father_name" | "nickname" | "village" | "source" | "responsible" | "event_id";

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: "surname", label: "Επώνυμο" },
  { key: "father_name", label: "Πατρώνυμο" },
  { key: "nickname", label: "Παρατσούκλι" },
  { key: "village", label: "Χωριό" },
  { key: "source", label: "Πηγή" },
  { key: "responsible", label: "Υπεύθυνος" },
  { key: "event_id", label: "Εκδήλωση" },
];

interface BulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (updates: Record<string, string | null>) => Promise<void> | void;
  isSaving?: boolean;
  events?: PersonalEvent[];
}

export const BulkEditDialog = ({ open, onOpenChange, count, onConfirm, isSaving, events = [] }: BulkEditDialogProps) => {
  const { data: sources = [] } = useGiftSources();
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({
    surname: false, father_name: false, nickname: false, village: false, source: false, responsible: false, event_id: false,
  });
  const [values, setValues] = useState<Record<FieldKey, string>>({
    surname: "", father_name: "", nickname: "", village: "", source: "", responsible: "", event_id: "",
  });

  const reset = () => {
    setEnabled({ surname: false, father_name: false, nickname: false, village: false, source: false, responsible: false, event_id: false });
    setValues({ surname: "", father_name: "", nickname: "", village: "", source: "", responsible: "", event_id: "" });
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSubmit = async () => {
    const updates: Record<string, string | null> = {};
    FIELDS.forEach(({ key }) => {
      if (enabled[key]) {
        const v = values[key].trim();
        // For surname (NOT NULL) we require a value; for the rest empty = clear (null)
        if (key === "surname") {
          if (v) updates[key] = v;
        } else {
          updates[key] = v ? v : null;
        }
      }
    });
    if (Object.keys(updates).length === 0) return;
    await onConfirm(updates);
    reset();
  };

  const anyEnabled = Object.values(enabled).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Μαζική επεξεργασία ({count})</DialogTitle>
          <DialogDescription>
            Τσεκάρετε ποια πεδία θέλετε να αλλάξετε. Άδειο πεδίο = καθαρισμός τιμής (εκτός από το Επώνυμο).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`bulk-${key}`}
                checked={enabled[key]}
                onCheckedChange={(c) => setEnabled((p) => ({ ...p, [key]: !!c }))}
              />
              <Label htmlFor={`bulk-${key}`} className="w-28 shrink-0 cursor-pointer">{label}</Label>
              {key === "source" ? (
                <Select
                  value={values.source || "__none__"}
                  disabled={!enabled.source}
                  onValueChange={(v) => setValues((p) => ({ ...p, source: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Επιλέξτε πηγή (άδειο = κενό)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Κενό —</SelectItem>
                    {sources.map((s) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : key === "event_id" ? (
                <Select
                  value={values.event_id || "__none__"}
                  disabled={!enabled.event_id}
                  onValueChange={(v) => setValues((p) => ({ ...p, event_id: v === "__none__" ? "" : v }))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Επιλέξτε εκδήλωση (άδειο = χωρίς)" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="__none__">— Χωρίς εκδήλωση —</SelectItem>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={values[key]}
                  disabled={!enabled[key]}
                  onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                  placeholder={enabled[key] ? (key === "surname" ? "Νέα τιμή (υποχρεωτικό)" : "Νέα τιμή (άδειο = κενό)") : ""}
                  className="h-9"
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isSaving}>Ακύρωση</Button>
          <Button onClick={handleSubmit} disabled={!anyEnabled || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Εφαρμογή σε {count}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
