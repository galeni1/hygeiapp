import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeddingGift, GiftFormData } from "@/types/gift";
import { useCreateGift, useUpdateGift } from "@/hooks/useGifts";
import { useGiftSources } from "@/hooks/useGiftSources";
import { useFieldSuggestions } from "@/hooks/useFieldSuggestions";
import { AutocompleteInput } from "./AutocompleteInput";
import { GiftHistoryTimeline } from "./GiftHistoryTimeline";
import { Gift, User, MapPin, Euro, Trash2, Edit2, History } from "lucide-react";

interface GiftFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingGift?: WeddingGift | null;
  onDelete?: (id: string) => void;
  /** When creating a new gift from within an event context, pre-assign event_id */
  defaultEventId?: string | null;
}

export const GiftForm = ({ open, onOpenChange, editingGift, onDelete, defaultEventId }: GiftFormProps) => {
  const [formData, setFormData] = useState<GiftFormData>({
    surname: "",
    first_name: "",
    source: "",
    village: "",
    guest_type: "",
    father_name: "",
    nickname: "",
    responsible: "",
    gift_amount: undefined,
    details: "",
  });
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");

  const createGift = useCreateGift();
  const updateGift = useUpdateGift();
  const { data: sourcesList = [] } = useGiftSources();
  useEffect(() => {
    if (editingGift) {
      setFormData({
        surname: editingGift.surname,
        first_name: editingGift.first_name,
        source: editingGift.source || "",
        village: editingGift.village || "",
        guest_type: editingGift.guest_type || "",
        father_name: editingGift.father_name || "",
        nickname: editingGift.nickname || "",
        responsible: editingGift.responsible || "",
        gift_amount: editingGift.gift_amount || undefined,
        details: editingGift.details || "",
      });
    } else {
      setFormData({
        surname: "",
        first_name: "",
        source: "",
        village: "",
        guest_type: "",
        father_name: "",
        nickname: "",
        responsible: "",
        gift_amount: undefined,
        details: "",
      });
    }
    setActiveTab("edit");
  }, [editingGift, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      gift_amount: formData.gift_amount || null,
    };

    if (editingGift) {
      await updateGift.mutateAsync({ id: editingGift.id, ...submitData });
    } else {
      await createGift.mutateAsync({ ...submitData, event_id: defaultEventId ?? null });
    }
    
    onOpenChange(false);
  };

  const handleChange = (field: keyof GiftFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground flex items-center gap-2">
            <Gift className="w-6 h-6 text-primary" />
            {editingGift ? "Επεξεργασία Δώρου" : "Νέο Δώρο"}
          </DialogTitle>
        </DialogHeader>

        {editingGift ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "history")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" className="gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Επεξεργασία
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="w-3.5 h-3.5" /> Ιστορικό
              </TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              <FormBody
                formData={formData}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                onCancel={() => onOpenChange(false)}
                onDelete={onDelete && editingGift ? () => { onOpenChange(false); onDelete(editingGift.id); } : undefined}
                editingGift={editingGift}
                sourcesList={sourcesList}
                isPending={createGift.isPending || updateGift.isPending}
              />
            </TabsContent>

            <TabsContent value="history">
              <GiftHistoryTimeline giftId={editingGift.id} />
              <div className="flex justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Κλείσιμο
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <FormBody
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            editingGift={null}
            sourcesList={sourcesList}
            isPending={createGift.isPending || updateGift.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

interface FormBodyProps {
  formData: GiftFormData;
  handleChange: (field: keyof GiftFormData, value: string | number) => void;
  handleSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onDelete?: () => void;
  editingGift: WeddingGift | null;
  sourcesList: { id: string; name: string }[];
  isPending: boolean;
}

const FormBody = ({ formData, handleChange, handleSubmit, onCancel, onDelete, editingGift, sourcesList, isPending }: FormBodyProps) => {
  const surnameSug = useFieldSuggestions("surname");
  const firstNameSug = useFieldSuggestions("first_name");
  const fatherNameSug = useFieldSuggestions("father_name");
  const nicknameSug = useFieldSuggestions("nickname");
  const villageSug = useFieldSuggestions("village");
  const responsibleSug = useFieldSuggestions("responsible");

  return (
  <form onSubmit={handleSubmit} className="space-y-6">
    {/* Personal Info Section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <User className="w-4 h-4" />
        <span className="text-sm font-medium">Στοιχεία Καλεσμένου</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="surname" className="text-foreground">Επώνυμο *</Label>
          <AutocompleteInput id="surname" value={formData.surname} onChange={(v) => handleChange("surname", v)} suggestions={surnameSug} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="first_name" className="text-foreground">Όνομα *</Label>
          <AutocompleteInput id="first_name" value={formData.first_name} onChange={(v) => handleChange("first_name", v)} suggestions={firstNameSug} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="father_name" className="text-foreground">Πατρώνυμο</Label>
          <AutocompleteInput id="father_name" value={formData.father_name || ""} onChange={(v) => handleChange("father_name", v)} suggestions={fatherNameSug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nickname" className="text-foreground">Παρατσούκλι</Label>
          <AutocompleteInput id="nickname" value={formData.nickname || ""} onChange={(v) => handleChange("nickname", v)} suggestions={nicknameSug} />
        </div>
      </div>
    </div>

    {/* Location Info Section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-medium">Τοποθεσία & Πηγή</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="village" className="text-foreground">Χωριό</Label>
          <AutocompleteInput id="village" value={formData.village || ""} onChange={(v) => handleChange("village", v)} suggestions={villageSug} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source" className="text-foreground">Πηγή</Label>
          <Select value={formData.source || ""} onValueChange={(v) => handleChange("source", v)}>
            <SelectTrigger id="source" className="bg-background border-border">
              <SelectValue placeholder={sourcesList.length === 0 ? "Προσθέστε πηγές στις Ρυθμίσεις" : "Επιλέξτε πηγή"} />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {sourcesList.map((s) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsible" className="text-foreground">Υπεύθυνος</Label>
          <AutocompleteInput id="responsible" value={formData.responsible || ""} onChange={(v) => handleChange("responsible", v)} suggestions={responsibleSug} />
        </div>
      </div>
    </div>

    {/* Gift Info Section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Euro className="w-4 h-4" />
        <span className="text-sm font-medium">Πληροφορίες Δώρου</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="gift_amount" className="text-foreground">Ποσό (€)</Label>
          <Input id="gift_amount" type="number" step="0.01" min="0" value={formData.gift_amount || ""} onChange={(e) => handleChange("gift_amount", parseFloat(e.target.value) || 0)} className="bg-background border-border" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="details" className="text-foreground">Λεπτομέρειες</Label>
        <Textarea id="details" value={formData.details} onChange={(e) => handleChange("details", e.target.value)} rows={3} className="bg-background border-border resize-none" />
      </div>
    </div>

    <div className="flex gap-3 justify-between pt-4 flex-wrap">
      <div>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Διαγραφή
          </Button>
        )}
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Ακύρωση
        </Button>
        <Button type="submit" variant="gold" disabled={isPending}>
          {editingGift ? "Ενημέρωση" : "Προσθήκη"}
        </Button>
      </div>
    </div>
  </form>
  );
};
