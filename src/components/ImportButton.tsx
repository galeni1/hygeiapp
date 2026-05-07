import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useGifts } from "@/hooks/useGifts";
import { fuzzyFingerprint } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { usePersonalEvents } from "@/hooks/usePersonalEvents";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ExcelRow {
  source?: string;
  number?: number;
  village?: string;
  guest_type?: string;
  surname: string;
  first_name: string;
  father_name?: string;
  nickname?: string;
  responsible?: string;
  gift_amount?: number;
  details?: string;
}

// Column mapping from Greek headers to database fields
const COLUMN_MAP: Record<string, keyof ExcelRow> = {
  "ΠΗΓΗ": "source",
  "Α/Α": "number",
  "ΧΩΡΙΟ": "village",
  "ΤΥΠΟΣ": "guest_type",
  "ΕΠΩΝΥΜΟ": "surname",
  "ΟΝΟΜΑ": "first_name",
  "ΠΑΤΡΩΝΥΜΟ": "father_name",
  "ΠΑΡΑΤΣΟΥΚΛΙ": "nickname",
  "ΥΠΕΥΘΥΝΟΣ": "responsible",
  "ΠΟΣΟ": "gift_amount",
  "ΧΑΡΗ": "gift_amount",
  "ΧΑΡΙ": "gift_amount",
  "ΛΕΠΤΟΜΕΡΕΙΕΣ": "details",
  // Alternative column names
  "SOURCE": "source",
  "NUMBER": "number",
  "VILLAGE": "village",
  "TYPE": "guest_type",
  "SURNAME": "surname",
  "FIRST_NAME": "first_name",
  "FATHER_NAME": "father_name",
  "NICKNAME": "nickname",
  "RESPONSIBLE": "responsible",
  "AMOUNT": "gift_amount",
  "DETAILS": "details",
};

const compactHeaderKey = (key: string) =>
  key
    .toUpperCase()
    .trim()
    // remove things like "(€)", dots, extra symbols while keeping Greek/Latin + numbers
    .replace(/[^A-ZΑ-Ω0-9/]/g, "");

const mapHeaderToField = (rawKey: string): keyof ExcelRow | undefined => {
  const k1 = rawKey.toUpperCase().trim();
  const k2 = compactHeaderKey(rawKey);

  return (
    COLUMN_MAP[k1] ||
    COLUMN_MAP[k2] ||
    // Common variants like: "ΠΟΣΟ (€)", "ΠΟΣΟ(€)", "ΠΟΣΟ ΕΥΡΩ"
    (k1.startsWith("ΠΟΣΟ") ? "gift_amount" : undefined) ||
    // Your file uses "ΧΑΡΗ" as the amount column
    (k1.startsWith("ΧΑΡΗ") || k1.startsWith("ΧΑΡΙ") ? "gift_amount" : undefined)
  );
};

const parseInteger = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? Math.trunc(value) : null;
  const s = String(value).trim();
  if (!s) return null;
  const digitsOnly = s.replace(/[^0-9-]/g, "");
  const n = Number(digitsOnly);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const parseAmount = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  let s = String(value).trim();
  if (!s) return null;

  // remove currency + spaces
  s = s.replace(/[€\s]/g, "");

  // Greek/European formats:
  // 1.234,56 -> 1234.56
  // 123,45   -> 123.45
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(",") && !s.includes(".")) {
    s = s.replace(",", ".");
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const ImportButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<ExcelRow[]>([]);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("none");
  const queryClient = useQueryClient();
  const { data: existingGifts = [] } = useGifts();
  const { data: personalEvents = [] } = usePersonalEvents();

  const personKey = (surname?: string | null, firstName?: string | null, fatherName?: string | null) =>
    `${fuzzyFingerprint(surname || "")}|${fuzzyFingerprint(firstName || "")}|${fuzzyFingerprint(fatherName || "")}`;

  const formatPreviewAmount = (amount?: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null, blankrows: true });

      // Map Excel columns to database fields
      const rawData = jsonData as Record<string, unknown>[];
      const mappedData: ExcelRow[] = [];

      for (const row of rawData) {
        const mappedRow: Record<string, unknown> = {};

        for (const key of Object.keys(row)) {
          const dbField = mapHeaderToField(key);
          if (dbField) {
            let value = row[key];

            // Convert number fields (keep 0 as valid)
            if (dbField === "number") {
              value = parseInteger(value);
            }
            if (dbField === "gift_amount") {
              value = parseAmount(value);
            }

            // Convert strings and handle empty values
            if (typeof value === "string") {
              const trimmed = value.trim();
              value = trimmed === "" ? null : trimmed;
            }

            mappedRow[dbField] = value;
          }
        }

        // Include rows even if name cells are empty, as long as there is *any* data in the row.
        const hasAnyValue = Object.values(mappedRow).some((v) => v !== null && v !== undefined && v !== "");

        if (hasAnyValue) {
          const hasSurname = typeof mappedRow.surname === "string" && mappedRow.surname.length > 0;
          const hasFirstName = typeof mappedRow.first_name === "string" && mappedRow.first_name.length > 0;

          // DB requires these fields; fill placeholders when missing
          mappedRow.surname = hasSurname ? mappedRow.surname : "-";
          mappedRow.first_name = hasFirstName ? mappedRow.first_name : "-";

          mappedData.push(mappedRow as unknown as ExcelRow);
        }
      }

      if (mappedData.length === 0) {
        toast.error("Δεν βρέθηκαν έγκυρες εγγραφές στο αρχείο");
        return;
      }

      // Detect duplicates: against existing active+deleted gifts AND within the file itself
      const existingKeys = new Set<string>();
      existingGifts.forEach((g) => {
        existingKeys.add(personKey(g.surname, g.first_name, g.father_name));
      });

      const dupes = new Set<number>();
      const seenInFile = new Map<string, number>();
      mappedData.forEach((row, idx) => {
        const key = personKey(row.surname, row.first_name, row.father_name);
        if (!key.replace(/\|/g, "")) return; // empty -> skip
        if (existingKeys.has(key)) {
          dupes.add(idx);
        } else if (seenInFile.has(key)) {
          dupes.add(idx);
        } else {
          seenInFile.set(key, idx);
        }
      });

      setPreviewData(mappedData);
      setDuplicateIndices(dupes);
      setSkipDuplicates(true);
      // Preselect event from URL ?event=... if present
      try {
        const params = new URLSearchParams(window.location.search);
        const ev = params.get("event");
        setSelectedEventId(ev && ev !== "all" && ev !== "none" ? ev : "none");
      } catch {
        setSelectedEventId("none");
      }
      setDialogOpen(true);
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast.error("Σφάλμα κατά την ανάγνωση του αρχείου Excel");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);

    try {
      const baseData = skipDuplicates
        ? previewData.filter((_, i) => !duplicateIndices.has(i))
        : previewData;
      const eventId = selectedEventId === "none" ? null : selectedEventId;
      const dataToSend = baseData.map((r) => ({ ...r, event_id: eventId }));

      if (dataToSend.length === 0) {
        toast.error("Δεν υπάρχουν εγγραφές προς εισαγωγή");
        setIsProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('import-excel-data', {
        body: { data: dataToSend }
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["wedding-gifts"] });
      const skipped = previewData.length - dataToSend.length;
      toast.success(
        skipped > 0
          ? `Εισήχθησαν ${data.inserted} εγγραφές. Παραλείφθηκαν ${skipped} διπλότυπα.`
          : `Εισήχθησαν ${data.inserted} εγγραφές επιτυχώς!`
      );
      setDialogOpen(false);
      setPreviewData([]);
      setDuplicateIndices(new Set());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Import error:", error);
      toast.error(`Σφάλμα: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {isProcessing ? "Επεξεργασία..." : "Εισαγωγή Excel"}
        </span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Επιβεβαίωση Εισαγωγής
            </DialogTitle>
            <DialogDescription>
              Βρέθηκαν <strong>{previewData.length}</strong> εγγραφές στο αρχείο Excel.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <Label className="text-sm font-medium">Σε ποια εκδήλωση να μπουν;</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Επιλέξτε εκδήλωση" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Χωρίς εκδήλωση</SelectItem>
                  {personalEvents.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                      {ev.event_date ? ` — ${new Date(ev.event_date).toLocaleDateString("el-GR")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Όλες οι εγγραφές θα ανατεθούν στην εκδήλωση που θα επιλέξετε.
              </p>
            </div>

            {duplicateIndices.size > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-amber-900 dark:text-amber-100">
                    Εντοπίστηκαν <strong>{duplicateIndices.size}</strong> πιθανά διπλότυπα
                    (ίδιο επώνυμο + όνομα + πατρώνυμο, με βάση είτε υπάρχουσες εγγραφές είτε επαναλήψεις στο αρχείο).
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pl-6">
                  <Checkbox
                    checked={skipDuplicates}
                    onCheckedChange={(c) => setSkipDuplicates(!!c)}
                  />
                  <span className="text-sm text-amber-900 dark:text-amber-100">
                    Παράλειψη διπλοτύπων (συνιστάται)
                  </span>
                </label>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Επώνυμο</th>
                    <th className="px-3 py-2 text-left">Όνομα</th>
                    <th className="px-3 py-2 text-left">Χωριό</th>
                    <th className="px-3 py-2 text-right">Ποσό</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.slice(0, 15).map((row, i) => {
                    const isDup = duplicateIndices.has(i);
                    return (
                      <tr key={i} className={`border-t ${isDup ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                        <td className="px-3 py-2">
                          {isDup && <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 mr-1.5 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900">DUP</span>}
                          {row.surname}
                        </td>
                        <td className="px-3 py-2">{row.first_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.village || "-"}</td>
                        <td className="px-3 py-2 text-right font-medium">
                          {formatPreviewAmount(row.gift_amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {previewData.length > 15 && (
                    <tr className="border-t bg-muted/50">
                      <td colSpan={4} className="px-3 py-2 text-center text-muted-foreground">
                        ...και {previewData.length - 15} ακόμα εγγραφές
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Ακύρωση
              </Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Εισαγωγή...
                  </>
                ) : (
                  <>
                    Εισαγωγή {skipDuplicates ? previewData.length - duplicateIndices.size : previewData.length} εγγραφών
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
