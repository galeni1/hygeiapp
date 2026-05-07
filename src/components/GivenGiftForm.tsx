import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Gift, User, MapPin, Euro, Trash2, Sparkles, Pencil, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { GivenGift, GivenGiftFormData, EVENT_TYPES } from "@/types/givenGift";
import { useCreateGivenGift, useUpdateGivenGift } from "@/hooks/useGivenGifts";
import { useGivenEventTypes } from "@/hooks/useGivenEventTypes";
import { useGivenFieldSuggestions } from "@/hooks/useGivenFieldSuggestions";
import { AutocompleteInput } from "@/components/AutocompleteInput";

interface GivenGiftFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGift?: GivenGift | null;
  onDelete?: (id: string) => void;
  relationships?: string[];
  villages?: string[];
}

const empty: GivenGiftFormData = {
  surname: "",
  first_name: "",
  father_name: "",
  nickname: "",
  village: "",
  relationship: "",
  event_type: "",
  event_date: "",
  gift_amount: undefined,
  details: "",
};

export const GivenGiftForm = ({ open, onOpenChange, editingGift, onDelete }: GivenGiftFormProps) => {
  const [formData, setFormData] = useState<GivenGiftFormData>(empty);
  const [locked, setLocked] = useState(true);
  const [dateOpen, setDateOpen] = useState(false);
  const createGift = useCreateGivenGift();
  const updateGift = useUpdateGivenGift();
  const { data: customTypes = [] } = useGivenEventTypes();
  const eventOptions = customTypes.map((t) => t.name);
  const surnameSug = useGivenFieldSuggestions("surname");
  const firstNameSug = useGivenFieldSuggestions("first_name");
  const fatherNameSug = useGivenFieldSuggestions("father_name");
  const nicknameSug = useGivenFieldSuggestions("nickname");
  const villageSug = useGivenFieldSuggestions("village");
  const relationshipSug = useGivenFieldSuggestions("relationship");
  const isEdit = !!editingGift;
  const readOnly = isEdit && locked;

  useEffect(() => {
    if (editingGift) {
      setFormData({
        surname: editingGift.surname,
        first_name: editingGift.first_name,
        father_name: editingGift.father_name || "",
        nickname: editingGift.nickname || "",
        village: editingGift.village || "",
        relationship: editingGift.relationship || "",
        event_type: editingGift.event_type || "",
        event_date: editingGift.event_date || "",
        gift_amount: editingGift.gift_amount || undefined,
        details: editingGift.details || "",
      });
    } else {
      setFormData(empty);
    }
    // Reset lock state each time dialog opens
    setLocked(true);
  }, [editingGift, open]);

  const handleChange = (field: keyof GivenGiftFormData, value: string | number | undefined) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: GivenGiftFormData = {
      ...formData,
      gift_amount: formData.gift_amount || undefined,
      event_date: formData.event_date || undefined,
    };
    if (editingGift) {
      await updateGift.mutateAsync({ id: editingGift.id, ...payload });
    } else {
      await createGift.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isPending = createGift.isPending || updateGift.isPending;
  const selectedDate = formData.event_date ? parseISO(formData.event_date) : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-2 pr-10">
            <Gift className="w-6 h-6 text-primary" />
            <span className="flex-1">{editingGift ? (readOnly ? "Προβολή Δώρου" : "Επεξεργασία Δώρου") : "Νέο Δώρο"}</span>
            {isEdit && (
              <Button
                type="button"
                variant={readOnly ? "outline" : "secondary"}
                size="sm"
                onClick={() => setLocked((l) => !l)}
                className="gap-1.5 h-8"
                title={readOnly ? "Ενεργοποίηση επεξεργασίας" : "Κλείδωμα"}
              >
                {readOnly ? <Pencil className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span className="text-xs">{readOnly ? "Επεξεργασία" : "Κλείδωμα"}</span>
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <fieldset disabled={readOnly} className="contents">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recipient */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Στοιχεία Παραλήπτη</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="surname">Επώνυμο *</Label>
                <AutocompleteInput id="surname" value={formData.surname} onChange={(v) => handleChange("surname", v)} suggestions={surnameSug} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="first_name">Όνομα *</Label>
                <AutocompleteInput id="first_name" value={formData.first_name} onChange={(v) => handleChange("first_name", v)} suggestions={firstNameSug} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_name">Πατρώνυμο</Label>
                <AutocompleteInput id="father_name" value={formData.father_name || ""} onChange={(v) => handleChange("father_name", v)} suggestions={fatherNameSug} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Παρατσούκλι</Label>
                <AutocompleteInput id="nickname" value={formData.nickname || ""} onChange={(v) => handleChange("nickname", v)} suggestions={nicknameSug} />
              </div>
            </div>
          </div>

          {/* Location & relationship */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Τοποθεσία & Σχέση</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="village">Χωριό / Τοποθεσία</Label>
                <AutocompleteInput id="village" value={formData.village || ""} onChange={(v) => handleChange("village", v)} suggestions={villageSug} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Σχέση</Label>
                <AutocompleteInput
                  id="relationship"
                  value={formData.relationship || ""}
                  onChange={(v) => handleChange("relationship", v)}
                  suggestions={relationshipSug}
                  placeholder="π.χ. Συγγενής, Φίλος, Συνάδελφος"
                />
              </div>
            </div>
          </div>

          {/* Event */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Εκδήλωση</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event_type">Τύπος εκδήλωσης</Label>
                <Select value={formData.event_type || ""} onValueChange={(v) => handleChange("event_type", v)}>
                  <SelectTrigger id="event_type" className="bg-background border-border">
                    <SelectValue placeholder="Επιλέξτε τύπο" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {eventOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ημερομηνία εκδήλωσης</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Επιλέξτε ημερομηνία"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(d) => {
                        handleChange("event_date", d ? format(d, "yyyy-MM-dd") : "");
                        if (d) setDateOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Amount & details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Euro className="w-4 h-4" />
              <span className="text-sm font-medium">Πληροφορίες Δώρου</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gift_amount">Ποσό (€)</Label>
              <Input
                id="gift_amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.gift_amount ?? ""}
                onChange={(e) => handleChange("gift_amount", e.target.value === "" ? undefined : parseFloat(e.target.value))}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">Λεπτομέρειες</Label>
              <Textarea id="details" value={formData.details || ""} onChange={(e) => handleChange("details", e.target.value)} rows={3} className="bg-background border-border resize-none" />
            </div>
          </div>

          <div className="flex gap-3 justify-between pt-4 flex-wrap">
            <div>
              {editingGift && onDelete && !readOnly && (
                <Button type="button" variant="destructive" onClick={() => { onOpenChange(false); onDelete(editingGift.id); }} className="gap-2">
                  <Trash2 className="w-4 h-4" />
                  Διαγραφή
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {readOnly ? "Κλείσιμο" : "Ακύρωση"}
              </Button>
              {!readOnly && (
                <Button type="submit" variant="gold" disabled={isPending}>
                  {editingGift ? "Ενημέρωση" : "Προσθήκη"}
                </Button>
              )}
            </div>
          </div>
        </form>
        </fieldset>
      </DialogContent>
    </Dialog>
  );
};
