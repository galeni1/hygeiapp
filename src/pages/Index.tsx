import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useGifts, useDeleteGift, useBulkDeleteGifts, useDeleteAllGifts, useRestoreGifts, usePermanentDeleteGifts, useBulkUpdateGifts } from "@/hooks/useGifts";
import { usePersonalEvents } from "@/hooks/usePersonalEvents";
import { WeddingGift } from "@/types/gift";
import { AppShell } from "@/components/AppShell";
import { SearchBar } from "@/components/SearchBar";
import { FilterDropdowns } from "@/components/FilterDropdowns";
import { StatsCards } from "@/components/StatsCards";
import { GiftCard } from "@/components/GiftCard";
import { GiftTable, SortField, SortDirection } from "@/components/GiftTable";
import { GiftForm } from "@/components/GiftForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { BulkEditDialog } from "@/components/BulkEditDialog";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Gift as GiftIcon,
  LayoutGrid,
  List,
  ChevronDown,
  Database,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  Sigma,
  RotateCcw,
  PencilLine,
  PartyPopper,
  ArrowLeft,
} from "lucide-react";
import { normalizeGreekText, fuzzyFingerprint } from "@/lib/utils";
import * as XLSX from "xlsx";
import { useAppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventParam = searchParams.get("event"); // null | "none" | "<uuid>"

  const { data: events = [], isLoading: eventsLoading } = usePersonalEvents();
  const currentEvent = eventParam && eventParam !== "none"
    ? events.find((e) => e.id === eventParam) || null
    : null;
  const eventFilter: string | "none" | undefined =
    eventParam === "none" ? "none" : eventParam || undefined;

  const { data: gifts = [], isLoading, error } = useGifts(eventFilter);
  const deleteGift = useDeleteGift();
  const bulkDeleteGifts = useBulkDeleteGifts();
  const deleteAllGifts = useDeleteAllGifts();
  const restoreGifts = useRestoreGifts();
  const permanentDeleteGifts = usePermanentDeleteGifts();
  const bulkUpdateGifts = useBulkUpdateGifts();
  const { settings } = useAppSettings();

  // If user navigates to "/" without ?event= and there are events configured,
  // redirect them to the events overview to pick one.
  useEffect(() => {
    if (!eventsLoading && !eventParam && events.length > 0) {
      navigate("/events", { replace: true });
    }
  }, [eventsLoading, eventParam, events.length, navigate]);

  const handleEventChange = (value: string) => {
    if (value === "__all__") {
      setSearchParams({});
    } else {
      setSearchParams({ event: value });
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [formOpen, setFormOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<WeddingGift | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [giftToDelete, setGiftToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("surname");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([]);
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [selectedSurnames, setSelectedSurnames] = useState<string[]>([]);
  const [selectedNicknames, setSelectedNicknames] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);

  // Measure sticky filter/toolbar wrapper to position sticky table header right below it
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(0);
  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const update = () => setStickyHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [filtersOpen, showStats]);

  const activeGifts = useMemo(() => gifts.filter((g) => !g.deleted_at), [gifts]);
  const deletedGifts = useMemo(() => gifts.filter((g) => g.deleted_at), [gifts]);
  const baseGifts = showDeleted ? deletedGifts : activeGifts;

  const { sources, responsibles, villages, surnames, nicknames } = useMemo(() => {
    const sourcesSet = new Set<string>();
    const responsiblesSet = new Set<string>();
    const villagesSet = new Set<string>();
    const surnamesSet = new Set<string>();
    const nicknamesSet = new Set<string>();
    activeGifts.forEach((gift) => {
      if (gift.source) sourcesSet.add(gift.source);
      if (gift.responsible) responsiblesSet.add(gift.responsible);
      if (gift.village) villagesSet.add(gift.village);
      if (gift.surname) surnamesSet.add(gift.surname);
      if (gift.nickname) nicknamesSet.add(gift.nickname);
    });
    return {
      sources: Array.from(sourcesSet).sort((a, b) => a.localeCompare(b, "el")),
      responsibles: Array.from(responsiblesSet).sort((a, b) => a.localeCompare(b, "el")),
      villages: Array.from(villagesSet).sort((a, b) => a.localeCompare(b, "el")),
      surnames: Array.from(surnamesSet).sort((a, b) => a.localeCompare(b, "el")),
      nicknames: Array.from(nicknamesSet).sort((a, b) => a.localeCompare(b, "el")),
    };
  }, [activeGifts]);

  const filteredAndSortedGifts = useMemo(() => {
    let result = baseGifts;
    if (selectedSources.length > 0) result = result.filter((g) => g.source && selectedSources.includes(g.source));
    if (selectedResponsibles.length > 0) result = result.filter((g) => g.responsible && selectedResponsibles.includes(g.responsible));
    if (selectedVillages.length > 0) result = result.filter((g) => g.village && selectedVillages.includes(g.village));
    if (selectedSurnames.length > 0) result = result.filter((g) => g.surname && selectedSurnames.includes(g.surname));
    if (selectedNicknames.length > 0) result = result.filter((g) => g.nickname && selectedNicknames.includes(g.nickname));
    if (searchQuery.trim()) {
      const rawTerms = searchQuery.trim().split(/\s+/);
      const normTerms = rawTerms.map(normalizeGreekText);
      const fuzzyTerms = rawTerms.map(fuzzyFingerprint).filter((t) => t.length > 0);
      result = result.filter((gift) => {
        const combined = `${gift.surname} ${gift.first_name} ${gift.village || ""} ${gift.nickname || ""} ${gift.responsible || ""} ${gift.father_name || ""} ${gift.details || ""} ${gift.source || ""}`;
        const normText = normalizeGreekText(combined);
        const fuzzyText = fuzzyFingerprint(combined);
        // Each term must match either the accent-insensitive Greek text OR the cross-language fuzzy fingerprint
        return rawTerms.every((_, i) => {
          const nt = normTerms[i];
          const ft = fuzzyTerms[i];
          if (nt && normText.includes(nt)) return true;
          if (ft && fuzzyText.includes(ft)) return true;
          return false;
        });
      });
    }
    return [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "gift_amount") {
        cmp = (a.gift_amount || 0) - (b.gift_amount || 0);
      } else {
        const av = (a[sortField] as string | null) || "";
        const bv = (b[sortField] as string | null) || "";
        cmp = av.localeCompare(bv, "el");
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [baseGifts, searchQuery, sortField, sortDirection, selectedSources, selectedResponsibles, selectedVillages, selectedSurnames, selectedNicknames]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedSources.length > 0 ||
    selectedResponsibles.length > 0 ||
    selectedVillages.length > 0 ||
    selectedSurnames.length > 0 ||
    selectedNicknames.length > 0;

  const clearDropdownFilters = () => {
    setSelectedSources([]);
    setSelectedResponsibles([]);
    setSelectedVillages([]);
    setSelectedSurnames([]);
    setSelectedNicknames([]);
    setSearchQuery("");
  };

  const handleSort = (field: SortField) => {
    if (field === sortField) setSortDirection((p) => (p === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDirection("asc"); }
  };

  const handleEdit = (gift: WeddingGift) => { setEditingGift(gift); setFormOpen(true); };
  const handleDelete = (id: string) => { setGiftToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (giftToDelete) { await deleteGift.mutateAsync(giftToDelete); setGiftToDelete(null); setDeleteDialogOpen(false); }
  };
  const handleFormClose = (open: boolean) => { setFormOpen(open); if (!open) setEditingGift(null); };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (selected) s.add(id);
      else s.delete(id);
      return s;
    });
  };
  const allFilteredSelected = filteredAndSortedGifts.length > 0 && filteredAndSortedGifts.every((g) => selectedIds.has(g.id));
  const someFilteredSelected = filteredAndSortedGifts.some((g) => selectedIds.has(g.id));
  const toggleSelectAll = () => {
    if (allFilteredSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAndSortedGifts.map((g) => g.id)));
  };

  const confirmBulkDelete = async () => {
    if (showDeleted) {
      await permanentDeleteGifts.mutateAsync(Array.from(selectedIds));
    } else {
      await bulkDeleteGifts.mutateAsync(Array.from(selectedIds));
    }
    setSelectedIds(new Set());
    setBulkDeleteDialogOpen(false);
  };
  const confirmDeleteAll = async () => {
    await deleteAllGifts.mutateAsync();
    setSelectedIds(new Set());
    setDeleteAllDialogOpen(false);
  };
  const handleRestore = async () => {
    if (selectedIds.size === 0) return;
    await restoreGifts.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleExportExcel = () => {
    const rows = (selectedIds.size > 0
      ? filteredAndSortedGifts.filter((g) => selectedIds.has(g.id))
      : filteredAndSortedGifts
    ).map((g, i) => ({
      "Α/Α": i + 1,
      ΕΠΩΝΥΜΟ: g.surname,
      ΟΝΟΜΑ: g.first_name,
      ΠΑΤΡΩΝΥΜΟ: g.father_name || "",
      ΠΑΡΑΤΣΟΥΚΛΙ: g.nickname || "",
      ΧΩΡΙΟ: g.village || "",
      ΥΠΕΥΘΥΝΟΣ: g.responsible || "",
      ΤΥΠΟΣ: g.guest_type || "",
      ΠΟΣΟ: g.gift_amount || "",
      ΛΕΠΤΟΜΕΡΕΙΕΣ: g.details || "",
    }));
    if (rows.length === 0) {
      toast.error("Δεν υπάρχουν δεδομένα για εξαγωγή");
      return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Εγγραφές");
    XLSX.writeFile(wb, `${settings.appName.replace(/\s+/g, "_")}_export.xlsx`);
    toast.success(`Εξήχθησαν ${rows.length} εγγραφές`);
  };

  const handlePrint = () => window.print();

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

  const recordCount = filteredAndSortedGifts.length;
  const totalAmount = filteredAndSortedGifts.reduce((s, g) => s + (g.gift_amount || 0), 0);
  const formatEur = (n: number) => new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <AppShell onAddNew={() => setFormOpen(true)}>
      <div className="px-3 sm:px-6 py-4 sm:py-6 max-w-[1600px] mx-auto">
        {/* Event context bar */}
        <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => navigate("/events")}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Εκδηλώσεις</span>
          </Button>

          <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-card">
            <PartyPopper className="w-3.5 h-3.5 text-primary shrink-0" />
            <Select value={eventParam || "__all__"} onValueChange={handleEventChange}>
              <SelectTrigger className="h-7 border-0 bg-transparent px-1 text-sm font-semibold focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="__all__">Όλες οι εκδηλώσεις</SelectItem>
                <SelectItem value="none">— Χωρίς εκδήλωση —</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentEvent?.event_type && (
            <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
              {currentEvent.event_type}
            </span>
          )}
        </div>

        {/* Page panel - matches galenizervos style */}
        <div className="bg-card border border-border rounded-lg shadow-xs">
          {/* Sticky filter+toolbar wrapper - stays visible while scrolling */}
          <div ref={stickyRef} className="sticky top-14 z-20 bg-card rounded-t-lg print:static print:z-auto">
          {/* Filters collapsible header */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="print:hidden">
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
                  <FilterDropdowns
                    sources={sources}
                    responsibles={responsibles}
                    villages={villages}
                    surnames={surnames}
                    nicknames={nicknames}
                    selectedSources={selectedSources}
                    selectedResponsibles={selectedResponsibles}
                    selectedVillages={selectedVillages}
                    selectedSurnames={selectedSurnames}
                    selectedNicknames={selectedNicknames}
                    onSourcesChange={setSelectedSources}
                    onResponsiblesChange={setSelectedResponsibles}
                    onVillagesChange={setSelectedVillages}
                    onSurnamesChange={setSelectedSurnames}
                    onNicknamesChange={setSelectedNicknames}
                    onClearFilters={clearDropdownFilters}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Toolbar - count chip + view toggle + export icons */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 border-b border-border flex-wrap print:hidden">
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
              <button
                onClick={() => { setShowDeleted((v) => !v); setSelectedIds(new Set()); }}
                className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors border ${
                  showDeleted
                    ? "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15"
                    : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title={showDeleted ? "Επιστροφή στις ενεργές" : "Προβολή διαγραμμένων"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {showDeleted ? "Διαγραμμένες ενεργές" : "Διαγραμμένες"}
                </span>
                {deletedGifts.length > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${showDeleted ? "bg-destructive text-destructive-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                    {deletedGifts.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* View toggle - matches galenizervos */}
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

              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground print:hidden" onClick={handleExportExcel} title="Εξαγωγή Excel">
                <FileSpreadsheet className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground print:hidden" onClick={handlePrint} title="Εκτύπωση">
                <Printer className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Optional stats panel */}
          {showStats && !isLoading && (
            <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20">
              <StatsCards gifts={filteredAndSortedGifts} totalGifts={activeGifts} isFiltered={hasActiveFilters} />
            </div>
          )}

          {/* Bulk actions bar - sticky inside table panel like galenizervos */}
          <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-b border-border bg-muted/30 print:hidden">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <Checkbox
                checked={allFilteredSelected ? true : someFilteredSelected ? "indeterminate" : false}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm font-medium text-foreground">
                {selectedIds.size > 0
                  ? `${selectedIds.size} επιλεγμένα`
                  : `Επιλογή όλων (${recordCount.toLocaleString("el-GR")})`}
              </span>
              {selectedIds.size > 0 && totalAmount > 0 && (
                <span className="text-xs text-muted-foreground">• Σύνολο: <span className="font-mono font-semibold text-success">{formatEur(filteredAndSortedGifts.filter((g) => selectedIds.has(g.id)).reduce((s, g) => s + (g.gift_amount || 0), 0))}</span></span>
              )}
            </label>

            <div className="flex items-center gap-1">
              {showDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-success hover:bg-success/10 disabled:text-muted-foreground"
                  disabled={selectedIds.size === 0}
                  onClick={handleRestore}
                  title="Επαναφορά"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              {!showDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  disabled={selectedIds.size !== 1}
                  onClick={() => {
                    const id = Array.from(selectedIds)[0];
                    const g = filteredAndSortedGifts.find((x) => x.id === id);
                    if (g) handleEdit(g);
                  }}
                  title="Επεξεργασία"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {!showDeleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  disabled={selectedIds.size < 2}
                  onClick={() => setBulkEditOpen(true)}
                  title="Μαζική επεξεργασία"
                >
                  <PencilLine className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive-foreground bg-destructive/90 hover:bg-destructive disabled:bg-muted disabled:text-muted-foreground"
                disabled={selectedIds.size === 0}
                onClick={() => {
                  if (!showDeleted && allFilteredSelected && selectedIds.size === activeGifts.length) setDeleteAllDialogOpen(true);
                  else setBulkDeleteDialogOpen(true);
                }}
                title={showDeleted ? "Οριστική διαγραφή" : "Διαγραφή"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          </div>
          {/* /sticky wrapper */}

          {/* Content */}
          <div className="p-3 sm:p-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-md" />
                ))}
              </div>
            ) : filteredAndSortedGifts.length === 0 ? (
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
              <GiftTable
                gifts={filteredAndSortedGifts}
                onRowClick={(g) => handleEdit(g)}
                selectedIds={selectedIds}
                onSelect={handleSelect}
                onSelectAll={toggleSelectAll}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                stickyHeaderTop={56 + stickyHeight}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {filteredAndSortedGifts.map((gift) => (
                  <GiftCard
                    key={gift.id}
                    gift={gift}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isSelected={selectedIds.has(gift.id)}
                    onSelect={handleSelect}
                    selectionMode={selectedIds.size > 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <GiftForm
        open={formOpen}
        onOpenChange={handleFormClose}
        editingGift={editingGift}
        onDelete={handleDelete}
        defaultEventId={eventParam && eventParam !== "none" ? eventParam : null}
      />
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} />
      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        title={showDeleted ? `Οριστική διαγραφή ${selectedIds.size} εγγραφών` : `Διαγραφή ${selectedIds.size} εγγραφών`}
        description={showDeleted
          ? `Είστε σίγουροι ότι θέλετε να διαγράψετε ΟΡΙΣΤΙΚΑ ${selectedIds.size} εγγραφές; Δεν θα είναι δυνατή η ανάκτησή τους.`
          : `Είστε σίγουροι ότι θέλετε να διαγράψετε ${selectedIds.size} εγγραφές; Μπορείτε να τις ανακτήσετε από τις «Διαγραμμένες».`}
      />
      <DeleteConfirmDialog
        open={deleteAllDialogOpen}
        onOpenChange={setDeleteAllDialogOpen}
        onConfirm={confirmDeleteAll}
        title="Διαγραφή όλων των εγγραφών"
        description={`Είστε σίγουροι ότι θέλετε να διαγράψετε και τις ${activeGifts.length} εγγραφές; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.`}
      />
      <BulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        count={selectedIds.size}
        isSaving={bulkUpdateGifts.isPending}
        events={events}
        onConfirm={async (updates) => {
          await bulkUpdateGifts.mutateAsync({ ids: Array.from(selectedIds), updates });
          setBulkEditOpen(false);
        }}
      />
    </AppShell>
  );
};

export default Index;
