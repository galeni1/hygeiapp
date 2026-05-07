import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { el } from "date-fns/locale";
import { CalendarIcon, Plus, Pencil, Trash2, Loader2, PartyPopper, Gift as GiftIcon, Euro } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  usePersonalEvents,
  useCreatePersonalEvent,
  useUpdatePersonalEvent,
  useDeletePersonalEvent,
} from "@/hooks/usePersonalEvents";
import { useGifts } from "@/hooks/useGifts";
import { useGivenEventTypes } from "@/hooks/useGivenEventTypes";
import { PersonalEvent, PersonalEventFormData } from "@/types/personalEvent";

const formatEur = (n: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const MyEvents = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = usePersonalEvents();
  const { data: gifts = [] } = useGifts();
  const { data: eventTypes = [] } = useGivenEventTypes();
  const createEvent = useCreatePersonalEvent();
  const updateEvent = useUpdatePersonalEvent();
  const deleteEvent = useDeletePersonalEvent();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PersonalEvent | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const giftStats = (eventId: string | null) => {
    const list = gifts.filter((g) => !g.deleted_at && g.event_id === eventId);
    const sum = list.reduce((s, g) => s + (g.gift_amount || 0), 0);
    return { count: list.length, sum };
  };

  const unassigned = giftStats(null);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (e: PersonalEvent) => { setEditing(e); setFormOpen(true); };

  const handleSubmit = async (form: PersonalEventFormData) => {
    if (editing) {
      await updateEvent.mutateAsync({ id: editing.id, ...form });
    } else {
      const created = await createEvent.mutateAsync(form);
      // Auto-navigate to the freshly created event
      navigate(`/guests?event=${created.id}`);
    }
    setFormOpen(false);
  };

  return (
    <AppShell onAddNew={openCreate}>
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Οι εκδηλώσεις μου</h1>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Νέα εκδήλωση</span>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Δημιουργήστε ξεχωριστές εκδηλώσεις (γάμος, αρραβώνας, εγκαίνια κλπ.) για να οργανώσετε
          τα δώρα που σας έφεραν σε καθεμία.
        </p>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* "Without event" card — shown only if there are unassigned gifts */}
            {unassigned.count > 0 && (
              <button
                onClick={() => navigate("/guests?event=none")}
                className="text-left bg-card border border-dashed border-border rounded-lg p-4 shadow-xs hover:border-primary/50 hover:shadow-sm-erp transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <GiftIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground">Χωρίς εκδήλωση</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Παλιές εγγραφές χωρίς ανάθεση. Μπορείτε να τις μεταφέρετε με μαζική επεξεργασία.
                </p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <GiftIcon className="w-3.5 h-3.5" /> {unassigned.count}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-success font-semibold">
                    <Euro className="w-3.5 h-3.5" /> {formatEur(unassigned.sum)}
                  </span>
                </div>
              </button>
            )}

            {events.map((ev) => {
              const stats = giftStats(ev.id);
              return (
                <div
                  key={ev.id}
                  className="bg-card border border-border rounded-lg shadow-xs hover:shadow-sm-erp hover:border-primary/40 transition-all overflow-hidden group"
                >
                  <button
                    onClick={() => navigate(`/guests?event=${ev.id}`)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <PartyPopper className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{ev.name}</h3>
                          {ev.event_type && (
                            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{ev.event_type}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {ev.event_date && (
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {format(parseISO(ev.event_date), "EEEE, d MMMM yyyy", { locale: el })}
                      </p>
                    )}
                    {ev.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{ev.notes}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <GiftIcon className="w-3.5 h-3.5" /> {stats.count} δώρα
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-success font-semibold">
                        <Euro className="w-3.5 h-3.5" /> {formatEur(stats.sum)}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-t border-border bg-muted/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={() => openEdit(ev)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Επεξεργασία
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(ev.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Διαγραφή
                    </Button>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && unassigned.count === 0 && (
              <div className="col-span-full text-center py-16 bg-card border border-dashed border-border rounded-lg">
                <PartyPopper className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">Δεν υπάρχουν εκδηλώσεις</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Δημιουργήστε την πρώτη σας εκδήλωση για να ξεκινήσετε
                </p>
                <Button onClick={openCreate} size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Νέα εκδήλωση
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <PersonalEventForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        eventTypes={eventTypes.map((t) => t.name)}
        onSubmit={handleSubmit}
        isPending={createEvent.isPending || updateEvent.isPending}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={async () => {
          if (deleteId) {
            await deleteEvent.mutateAsync(deleteId);
            setDeleteId(null);
          }
        }}
        title="Διαγραφή εκδήλωσης"
        description="Είστε σίγουροι; Τα δώρα της εκδήλωσης δεν θα διαγραφούν — θα μετακινηθούν στο «Χωρίς εκδήλωση»."
      />
    </AppShell>
  );
};

interface FormProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: PersonalEvent | null;
  eventTypes: string[];
  onSubmit: (data: PersonalEventFormData) => Promise<void>;
  isPending: boolean;
}

const PersonalEventForm = ({ open, onOpenChange, editing, eventTypes, onSubmit, isPending }: FormProps) => {
  const [name, setName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editing?.name || "");
      setEventType(editing?.event_type || "");
      setEventDate(editing?.event_date || "");
      setNotes(editing?.notes || "");
    }
  }, [open, editing]);

  const reset = () => { setName(""); setEventType(""); setEventDate(""); setNotes(""); };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name,
      event_type: eventType || undefined,
      event_date: eventDate || undefined,
      notes: notes || undefined,
    });
    reset();
  };

  const selectedDate = eventDate ? parseISO(eventDate) : undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            {editing ? "Επεξεργασία εκδήλωσης" : "Νέα εκδήλωση"}
          </DialogTitle>
          <DialogDescription>
            Καταχωρήστε τα στοιχεία της εκδήλωσης. Στη συνέχεια θα μπορείτε να της αναθέσετε δώρα.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ev-name">Όνομα *</Label>
            <Input
              id="ev-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="π.χ. Γάμος μου, Εγκαίνια καταστήματος"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ev-type">Τύπος</Label>
              <Select value={eventType || "__none__"} onValueChange={(v) => setEventType(v === "__none__" ? "" : v)}>
                <SelectTrigger id="ev-type">
                  <SelectValue placeholder={eventTypes.length === 0 ? "—" : "Επιλέξτε"} />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover">
                  <SelectItem value="__none__">— Κανένας —</SelectItem>
                  {eventTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Ημερομηνία</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: el }) : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => {
                      setEventDate(d ? format(d, "yyyy-MM-dd") : "");
                      if (d) setDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ev-notes">Σημειώσεις</Label>
            <Textarea id="ev-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
              Ακύρωση
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Αποθήκευση" : "Δημιουργία"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MyEvents;
