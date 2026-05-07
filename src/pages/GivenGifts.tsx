import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import {
  Gift as GiftIcon,
  LayoutGrid,
  List,
  ChevronDown,
  Database,
  Sigma,
  
  MapPin,
  CalendarDays,
  Sparkles,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SearchBar } from "@/components/SearchBar";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { GivenGiftForm } from "@/components/GivenGiftForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { GivenBulkEditDialog } from "@/components/GivenBulkEditDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGivenGifts,
  useDeleteGivenGift,
  useUpdateGivenGift,
  useBulkUpdateGivenGifts,
  useTransferGivenToWedding,
} from "@/hooks/useGivenGifts";
import { GivenGift } from "@/types/givenGift";
import { normalizeGreekText, fuzzyFingerprint } from "@/lib/utils";
import { X, CheckSquare, Pencil, Send, Loader2 } from "lucide-react";

const formatEur = (n: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "dd/MM/yyyy");
  } catch {
    return iso;
  }
};

const GREEK_DAYS_SHORT = ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"];
const GREEK_DAYS_LONG = ["Κυριακή", "Δευτέρα", "Τρίτη", "Τετάρτη", "Πέμπτη", "Παρασκευή", "Σάββατο"];

const formatDateWithDay = (iso: string | null, short: boolean) => {
  if (!iso) return "—";
  try {
    const d = parseISO(iso);
    const day = (short ? GREEK_DAYS_SHORT : GREEK_DAYS_LONG)[d.getDay()];
    return `${format(d, "dd/MM/yyyy")} ${day}`;
  } catch {
    return iso;
  }
};

type SortField = "surname" | "first_name" | "village" | "event_type" | "event_date" | "gift_amount" | "relationship";
type SortDir = "asc" | "desc";

const GivenGifts = () => {
  const { data: gifts = [], isLoading, error } = useGivenGifts();
  const deleteGift = useDeleteGivenGift();
  const updateGift = useUpdateGivenGift();
  const bulkUpdate = useBulkUpdateGivenGifts();
  const transferToWedding = useTransferGivenToWedding();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);

  const [editingAmountId, setEditingAmountId] = useState<string | null>(null);
  const [editingAmountValue, setEditingAmountValue] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GivenGift | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("event_date");
  const [sortDirection, setSortDirection] = useState<SortDir>("desc");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);
  const [selectedRelationships, setSelectedRelationships] = useState<string[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [selectedSurnames, setSelectedSurnames] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);

  const activeGifts = useMemo(() => gifts.filter((g) => !g.deleted_at), [gifts]);

  const { eventTypes, relationships, villages, surnames, years } = useMemo(() => {
    const a = new Set<string>(), b = new Set<string>(), c = new Set<string>(), d = new Set<string>(), y = new Set<string>();
    activeGifts.forEach((g) => {
      if (g.event_type) a.add(g.event_type);
      if (g.relationship) b.add(g.relationship);
      if (g.village) c.add(g.village);
      if (g.surname) d.add(g.surname);
      if (g.event_date) y.add(g.event_date.slice(0, 4));
    });
    return {
      eventTypes: Array.from(a).sort((x, z) => x.localeCompare(z, "el")),
      relationships: Array.from(b).sort((x, z) => x.localeCompare(z, "el")),
      villages: Array.from(c).sort((x, z) => x.localeCompare(z, "el")),
      surnames: Array.from(d).sort((x, z) => x.localeCompare(z, "el")),
      years: Array.from(y).sort().reverse(),
    };
  }, [activeGifts]);

  const filtered = useMemo(() => {
    let r = activeGifts;
    if (selectedEventTypes.length) r = r.filter((g) => g.event_type && selectedEventTypes.includes(g.event_type));
    if (selectedRelationships.length) r = r.filter((g) => g.relationship && selectedRelationships.includes(g.relationship));
    if (selectedVillages.length) r = r.filter((g) => g.village && selectedVillages.includes(g.village));
    if (selectedSurnames.length) r = r.filter((g) => g.surname && selectedSurnames.includes(g.surname));
    if (selectedYears.length) r = r.filter((g) => g.event_date && selectedYears.includes(g.event_date.slice(0, 4)));
    if (searchQuery.trim()) {
      const rawTerms = searchQuery.trim().split(/\s+/);
      const normTerms = rawTerms.map(normalizeGreekText);
      const fuzzyTerms = rawTerms.map(fuzzyFingerprint).filter((t) => t.length > 0);
      r = r.filter((g) => {
        const combined = `${g.surname} ${g.first_name} ${g.village || ""} ${g.nickname || ""} ${g.relationship || ""} ${g.father_name || ""} ${g.details || ""} ${g.event_type || ""}`;
        const n = normalizeGreekText(combined);
        const f = fuzzyFingerprint(combined);
        return rawTerms.every((_, i) => {
          const nt = normTerms[i], ft = fuzzyTerms[i];
          if (nt && n.includes(nt)) return true;
          if (ft && f.includes(ft)) return true;
          return false;
        });
      });
    }
    return [...r].sort((a, b) => {
      let cmp = 0;
      if (sortField === "gift_amount") cmp = (a.gift_amount || 0) - (b.gift_amount || 0);
      else if (sortField === "event_date") cmp = (a.event_date || "").localeCompare(b.event_date || "");
      else cmp = ((a[sortField] as string) || "").localeCompare((b[sortField] as string) || "", "el");
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [activeGifts, searchQuery, sortField, sortDirection, selectedEventTypes, selectedRelationships, selectedVillages, selectedSurnames, selectedYears]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedEventTypes.length > 0 ||
    selectedRelationships.length > 0 ||
    selectedVillages.length > 0 ||
    selectedSurnames.length > 0 ||
    selectedYears.length > 0;

  const clearFilters = () => {
    setSelectedEventTypes([]);
    setSelectedRelationships([]);
    setSelectedVillages([]);
    setSelectedSurnames([]);
    setSelectedYears([]);
    setSearchQuery("");
  };

  const handleEdit = (g: GivenGift) => { setEditingGift(g); setFormOpen(true); };
  const handleDelete = (id: string) => { setGiftToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (giftToDelete) {
      await deleteGift.mutateAsync(giftToDelete);
      setGiftToDelete(null);
      setDeleteDialogOpen(false);
    }
  };
  const handleSort = (f: SortField) => {
    if (f === sortField) setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDirection("asc"); }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const allSelected = filtered.length > 0 && filtered.every((g) => prev.has(g.id));
      if (allSelected) {
        const next = new Set(prev);
        filtered.forEach((g) => next.delete(g.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach((g) => next.add(g.id));
      return next;
    });
  };
  const clearSelection = () => setSelectedIds(new Set());

  const selectedGifts = useMemo(
    () => filtered.filter((g) => selectedIds.has(g.id)),
    [filtered, selectedIds]
  );

  const handleBulkEdit = async (updates: Record<string, string | null>) => {
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates });
    setBulkEditOpen(false);
    clearSelection();
  };
  const handleTransfer = async () => {
    await transferToWedding.mutateAsync(selectedGifts);
    setTransferConfirmOpen(false);
    clearSelection();
  };

  const startEditAmount = (g: GivenGift) => {
    setEditingAmountId(g.id);
    setEditingAmountValue(g.gift_amount != null ? String(g.gift_amount) : "");
  };
  const cancelEditAmount = () => {
    setEditingAmountId(null);
    setEditingAmountValue("");
  };
  const commitEditAmount = async (g: GivenGift) => {
    const trimmed = editingAmountValue.trim();
    const parsed = trimmed === "" ? undefined : parseFloat(trimmed.replace(",", "."));
    if (trimmed !== "" && (Number.isNaN(parsed!) || (parsed as number) < 0)) {
      cancelEditAmount();
      return;
    }
    if ((g.gift_amount ?? null) === (parsed ?? null)) {
      cancelEditAmount();
      return;
    }
    await updateGift.mutateAsync({
      id: g.id,
      surname: g.surname,
      first_name: g.first_name,
      father_name: g.father_name || "",
      nickname: g.nickname || "",
      village: g.village || "",
      relationship: g.relationship || "",
      event_type: g.event_type || "",
      event_date: g.event_date || "",
      gift_amount: parsed,
      details: g.details || "",
    });
    cancelEditAmount();
  };

  const recordCount = filtered.length;
  const totalAmount = filtered.reduce((s, g) => s + (g.gift_amount || 0), 0);
  const avgAmount = recordCount > 0 ? totalAmount / recordCount : 0;

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Σφάλμα φόρτωσης δεδομένων</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell onAddNew={() => { setEditingGift(null); setFormOpen(true); }}>
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto">
        <div className="bg-card border border-border rounded-lg shadow-xs">
          {/* Sticky filter+toolbar */}
          <div className="sticky top-14 z-20 bg-card rounded-t-lg">
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border">
                <div className="flex items-center gap-2 text-sm">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
                      <span className="font-medium">Φίλτρα</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "" : "-rotate-90"}`} />
                    </button>
                  </CollapsibleTrigger>
                  {hasActiveFilters && (
                    <span className="ml-1 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      ΕΝΕΡΓΑ
                    </span>
                  )}
                </div>
              </div>
              <CollapsibleContent>
                <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-full sm:w-[260px]">
                      <SearchBar value={searchQuery} onChange={setSearchQuery} />
                    </div>
                    <MultiSelectFilter
                      options={eventTypes}
                      selected={selectedEventTypes}
                      onChange={setSelectedEventTypes}
                      placeholder="Εκδήλωση"
                      width="w-[calc(50%-0.25rem)] sm:w-[170px]"
                    />
                    <MultiSelectFilter
                      options={relationships}
                      selected={selectedRelationships}
                      onChange={setSelectedRelationships}
                      placeholder="Σχέση"
                      width="w-[calc(50%-0.25rem)] sm:w-[170px]"
                    />
                    <MultiSelectFilter
                      options={villages}
                      selected={selectedVillages}
                      onChange={setSelectedVillages}
                      placeholder="Χωριό"
                      width="w-[calc(50%-0.25rem)] sm:w-[170px]"
                    />
                    <MultiSelectFilter
                      options={surnames}
                      selected={selectedSurnames}
                      onChange={setSelectedSurnames}
                      placeholder="Επώνυμο"
                      width="w-[calc(50%-0.25rem)] sm:w-[170px]"
                    />
                    <MultiSelectFilter
                      options={years}
                      selected={selectedYears}
                      onChange={setSelectedYears}
                      placeholder="Έτος"
                      width="w-full sm:w-[130px]"
                    />
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
                        <X className="w-3.5 h-3.5 mr-1" />
                        Καθαρισμός
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-border flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-muted border border-border text-xs font-semibold text-foreground">
                  <Database className="w-3.5 h-3.5 text-muted-foreground" />
                  {recordCount.toLocaleString("el-GR")} εγγραφές
                </span>
                <button
                  onClick={() => setShowStats((v) => !v)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Sigma className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Στατιστικά</span>
                </button>
              </div>

              <div className="flex items-center bg-muted rounded-md p-0.5 border border-border">
                <button
                  onClick={() => setViewMode("cards")}
                  className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === "cards" ? "bg-card shadow-xs text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Πλακίδια</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`h-7 px-2.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    viewMode === "table" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Λίστα</span>
                </button>
              </div>
            </div>

            {showStats && !isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-5 py-3 border-b border-border bg-muted/20">
                <StatBox icon={Users} label="Δώρα" value={recordCount.toLocaleString("el-GR")} />
                <StatBox icon={Sigma} label="Σύνολο" value={formatEur(totalAmount)} />
                <StatBox icon={Sparkles} label="Μέσος όρος" value={formatEur(avgAmount)} />
                <StatBox
                  icon={CalendarDays}
                  label="Έτη"
                  value={years.length.toString()}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3 sm:p-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-md" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                  <GiftIcon className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {hasActiveFilters ? "Δεν βρέθηκαν αποτελέσματα" : "Δεν υπάρχουν εγγραφές"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasActiveFilters ? "Δοκιμάστε διαφορετικά φίλτρα" : "Πατήστε «+» για να ξεκινήσετε"}
                </p>
              </div>
            ) : viewMode === "table" ? (
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-10 h-9 px-2 md:px-3">
                        <Checkbox
                          checked={filtered.length > 0 && filtered.every((g) => selectedIds.has(g.id))}
                          onCheckedChange={toggleSelectAllVisible}
                          aria-label="Επιλογή όλων"
                        />
                      </TableHead>
                      <SortHeader field="event_date" label="Ημερομηνία" sortField={sortField} sortDir={sortDirection} onSort={handleSort} />
                      <SortHeader field="surname" label="Επώνυμο" sortField={sortField} sortDir={sortDirection} onSort={handleSort} />
                      <SortHeader field="first_name" label="Όνομα" sortField={sortField} sortDir={sortDirection} onSort={handleSort} />
                      <SortHeader field="event_type" label="Εκδήλωση" sortField={sortField} sortDir={sortDirection} onSort={handleSort} className="hidden md:table-cell" />
                      <SortHeader field="village" label="Χωριό" sortField={sortField} sortDir={sortDirection} onSort={handleSort} className="hidden md:table-cell" />
                      <SortHeader field="relationship" label="Σχέση" sortField={sortField} sortDir={sortDirection} onSort={handleSort} className="hidden md:table-cell" />
                      <SortHeader field="gift_amount" label="Ποσό" sortField={sortField} sortDir={sortDirection} onSort={handleSort} align="right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((g) => (
                      <TableRow
                        key={g.id}
                        className={`cursor-pointer ${selectedIds.has(g.id) ? "bg-primary/5" : ""}`}
                        onClick={() => handleEdit(g)}
                      >
                        <TableCell className="py-2 px-2 md:px-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(g.id)}
                            onCheckedChange={(c) => toggleSelect(g.id, c === true)}
                            aria-label="Επιλογή εγγραφής"
                          />
                        </TableCell>
                        <TableCell className="py-2 px-2 md:px-4 text-xs tabular-nums whitespace-nowrap">
                          <span className="md:hidden">{formatDateWithDay(g.event_date, true)}</span>
                          <span className="hidden md:inline">{formatDateWithDay(g.event_date, false)}</span>
                        </TableCell>
                        <TableCell className="py-2 px-1 md:px-4 text-sm font-medium">{g.surname}</TableCell>
                        <TableCell className="py-2 px-1 md:px-4 text-sm">{g.first_name}</TableCell>
                        <TableCell className="py-2 text-xs hidden md:table-cell">{g.event_type || "—"}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground hidden md:table-cell">{g.village || "—"}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground hidden md:table-cell">{g.relationship || "—"}</TableCell>
                        <TableCell
                          className="py-2 px-2 md:px-4 text-right font-mono tabular-nums text-sm font-semibold text-success"
                          onClick={(e) => { if (editingAmountId === g.id) e.stopPropagation(); }}
                        >
                          {editingAmountId === g.id ? (
                            <Input
                              autoFocus
                              type="number"
                              step="0.01"
                              min="0"
                              value={editingAmountValue}
                              onChange={(e) => setEditingAmountValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={() => commitEditAmount(g)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") { e.preventDefault(); commitEditAmount(g); }
                                if (e.key === "Escape") { e.preventDefault(); cancelEditAmount(); }
                              }}
                              className="h-7 w-24 ml-auto text-right text-sm"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); startEditAmount(g); }}
                              className="hover:underline decoration-dotted underline-offset-4"
                              title="Επεξεργασία ποσού"
                            >
                              {g.gift_amount ? formatEur(g.gift_amount) : "—"}
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {filtered.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleEdit(g)}
                    className={`group relative bg-card border rounded-md p-3 shadow-xs hover:shadow-sm-erp hover:border-primary/30 transition-all cursor-pointer ${
                      selectedIds.has(g.id) ? "border-primary/60 bg-primary/5" : "border-border"
                    }`}
                  >
                    <div
                      className="absolute top-2 left-2 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedIds.has(g.id)}
                        onCheckedChange={(c) => toggleSelect(g.id, c === true)}
                        aria-label="Επιλογή εγγραφής"
                      />
                    </div>
                    <div className="flex items-start justify-between gap-2 pl-7">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {g.surname} {g.first_name}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {g.event_type || "—"} • {formatDateWithDay(g.event_date, false)}
                        </p>
                      </div>
                      {g.gift_amount ? (
                        <span className="font-mono tabular-nums text-sm font-semibold text-success shrink-0">
                          {formatEur(g.gift_amount)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground shrink-0">—</span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {g.village && (
                        <span className="inline-flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 shrink-0" /> {g.village}
                        </span>
                      )}
                      {g.relationship && <span className="truncate"><span className="font-medium">Σχέση:</span> {g.relationship}</span>}
                    </div>
                    {g.details && <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{g.details}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <GivenGiftForm
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingGift(null); }}
        editingGift={editingGift}
        onDelete={handleDelete}
      />
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />

      <GivenBulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        count={selectedIds.size}
        onConfirm={handleBulkEdit}
        isSaving={bulkUpdate.isPending}
      />

      <AlertDialog open={transferConfirmOpen} onOpenChange={setTransferConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Μεταφορά στους καλεσμένους</AlertDialogTitle>
            <AlertDialogDescription>
              Θα προστεθούν {selectedIds.size} νέες εγγραφές στη λίστα «Οι καλεσμένοι μου» με τα στοιχεία (Επώνυμο, Όνομα, Πατρώνυμο, Παρατσούκλι, Χωριό). Οι αρχικές εγγραφές δώρων παραμένουν.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={transferToWedding.isPending}>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction onClick={handleTransfer} disabled={transferToWedding.isPending}>
              {transferToWedding.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Μεταφορά {selectedIds.size}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-16 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-lg rounded-lg px-3 py-2 flex items-center gap-2 animate-fade-in max-w-[95vw]">
          <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
            {selectedIds.size} επιλ.
          </span>
          <Button variant="ghost" size="sm" onClick={toggleSelectAllVisible} className="text-muted-foreground h-8">
            <CheckSquare className="w-3.5 h-3.5 mr-1" />
            Όλα ({filtered.length})
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelection} className="text-muted-foreground h-8">
            <X className="w-3.5 h-3.5" />
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)} className="h-8">
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Επεξεργασία
          </Button>
          <Button size="sm" onClick={() => setTransferConfirmOpen(true)} className="h-8">
            <Send className="w-3.5 h-3.5 mr-1" />
            Στους καλεσμένους
          </Button>
        </div>
      )}
    </AppShell>
  );
};

const SortHeader = ({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  align = "left",
  className = "",
}: {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (f: SortField) => void;
  align?: "left" | "right";
  className?: string;
}) => (
  <TableHead className={`h-9 text-xs ${align === "right" ? "text-right" : ""} ${className}`}>
    <button
      onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
        sortField === field ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
      {sortField === field && <span className="text-[10px]">{sortDir === "asc" ? "▲" : "▼"}</span>}
    </button>
  </TableHead>
);

const StatBox = ({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) => (
  <div className="bg-card border border-border rounded-md p-2.5 flex items-center gap-2.5">
    <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-semibold text-foreground truncate">{value}</p>
    </div>
  </div>
);

export default GivenGifts;
