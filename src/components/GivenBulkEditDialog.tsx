import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

type FieldKey = "surname" | "village";

const FIELDS: { key: FieldKey; label: string; required?: boolean }[] = [
  { key: "surname", label: "Επώνυμο", required: true },
  { key: "village", label: "Χωριό" },
];

interface GivenBulkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (updates: Record<string, string | null>) => Promise<void> | void;
  isSaving?: boolean;
}

export const GivenBulkEditDialog = ({ open, onOpenChange, count, onConfirm, isSaving }: GivenBulkEditDialogProps) => {
  const [enabled, setEnabled] = useState<Record<FieldKey, boolean>>({ surname: false, village: false });
  const [values, setValues] = useState<Record<FieldKey, string>>({ surname: "", village: "" });

  const reset = () => {
    setEnabled({ surname: false, village: false });
    setValues({ surname: "", village: "" });
  };
  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSubmit = async () => {
    const updates: Record<string, string | null> = {};
    FIELDS.forEach(({ key, required }) => {
      if (enabled[key]) {
        const v = values[key].trim();
        if (required) {
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Μαζική επεξεργασία ({count})</DialogTitle>
          <DialogDescription>
            Τσεκάρετε ποια πεδία θέλετε να αλλάξετε. Άδειο = καθαρισμός (εκτός από το Επώνυμο).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {FIELDS.map(({ key, label, required }) => (
            <div key={key} className="flex items-center gap-3">
              <Checkbox
                id={`gbulk-${key}`}
                checked={enabled[key]}
                onCheckedChange={(c) => setEnabled((p) => ({ ...p, [key]: !!c }))}
              />
              <Label htmlFor={`gbulk-${key}`} className="w-24 shrink-0 cursor-pointer">{label}</Label>
              <Input
                value={values[key]}
                disabled={!enabled[key]}
                onChange={(e) => setValues((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={enabled[key] ? (required ? "Νέα τιμή (υποχρεωτικό)" : "Νέα τιμή (άδειο = κενό)") : ""}
                className="h-9"
              />
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
