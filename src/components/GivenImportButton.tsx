import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useGivenGifts } from "@/hooks/useGivenGifts";
import { fuzzyFingerprint } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface GivenRow {
  number?: number | null;
  surname: string;
  first_name: string;
  father_name?: string | null;
  nickname?: string | null;
  village?: string | null;
  relationship?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  gift_amount?: number | null;
  details?: string | null;
}

const COLUMN_MAP: Record<string, keyof GivenRow> = {
  "Α/Α": "number",
  "ΕΠΩΝΥΜΟ": "surname",
  "ΟΝΟΜΑ": "first_name",
  "ΠΑΤΡΩΝΥΜΟ": "father_name",
  "ΠΑΡΑΤΣΟΥΚΛΙ": "nickname",
  "ΧΩΡΙΟ": "village",
  "ΤΟΠΟΘΕΣΙΑ": "village",
  "ΣΧΕΣΗ": "relationship",
  "ΣΥΓΓΕΝΕΙΑ": "relationship",
  "ΤΥΠΟΣ ΕΚΔΗΛΩΣΗΣ": "event_type",
  "ΕΚΔΗΛΩΣΗ": "event_type",
  "ΗΜΕΡΟΜΗΝΙΑ": "event_date",
  "ΠΟΣΟ": "gift_amount",
  "ΧΑΡΗ": "gift_amount",
  "ΧΑΡΙ": "gift_amount",
  "ΛΕΠΤΟΜΕΡΕΙΕΣ": "details",
  "NUMBER": "number",
  "SURNAME": "surname",
  "FIRST_NAME": "first_name",
  "FATHER_NAME": "father_name",
  "NICKNAME": "nickname",
  "VILLAGE": "village",
  "RELATIONSHIP": "relationship",
  "EVENT_TYPE": "event_type",
  "EVENT_DATE": "event_date",
  "AMOUNT": "gift_amount",
  "DETAILS": "details",
};

const compactKey = (k: string) =>
  k.toUpperCase().trim().replace(/[^A-ZΑ-Ω0-9/ ]/g, "").replace(/\s+/g, " ").trim();

const mapHeader = (raw: string): keyof GivenRow | undefined => {
  const k1 = raw.toUpperCase().trim();
  const k2 = compactKey(raw);
  return (
    COLUMN_MAP[k1] ||
    COLUMN_MAP[k2] ||
    (k1.startsWith("ΠΟΣΟ") ? "gift_amount" : undefined) ||
    (k1.startsWith("ΧΑΡΗ") || k1.startsWith("ΧΑΡΙ") ? "gift_amount" : undefined) ||
    (k1.startsWith("ΗΜΕΡ") ? "event_date" : undefined)
  );
};

const parseInteger = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  const n = Number(String(v).replace(/[^0-9-]/g, ""));
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const parseAmount = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v).trim().replace(/[€\s]/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const parseDate = (v: unknown): string | null => {
  if (v === null || v === undefined || v === "") return null;
  // Excel serial date number
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  const s = String(v).trim();
  if (!s) return null;
  // dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    let [, dd, mm, yy] = m;
    if (yy.length === 2) yy = (Number(yy) > 50 ? "19" : "20") + yy;
    return `${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
};

export const GivenImportButton = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<GivenRow[]>([]);
  const [duplicateIndices, setDuplicateIndices] = useState<Set<number>>(new Set());
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const queryClient = useQueryClient();
  const { data: existing = [] } = useGivenGifts();

  const personKey = (s?: string | null, f?: string | null, fa?: string | null, date?: string | null) =>
    `${fuzzyFingerprint(s || "")}|${fuzzyFingerprint(f || "")}|${fuzzyFingerprint(fa || "")}|${date || ""}`;

  const fmtAmount = (a?: number | null) =>
    a === null || a === undefined
      ? "-"
      : new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(a);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: null, blankrows: true }) as Record<string, unknown>[];

      const mapped: GivenRow[] = [];
      for (const row of json) {
        const out: Record<string, unknown> = {};
        for (const k of Object.keys(row)) {
          const f = mapHeader(k);
          if (!f) continue;
          let v = row[k];
          if (f === "number") v = parseInteger(v);
          else if (f === "gift_amount") v = parseAmount(v);
          else if (f === "event_date") v = parseDate(v);
          else if (typeof v === "string") {
            const t = v.trim();
            v = t === "" ? null : t;
          }
          out[f] = v;
        }
        const hasAny = Object.values(out).some((v) => v !== null && v !== undefined && v !== "");
        if (!hasAny) continue;
        out.surname = (typeof out.surname === "string" && out.surname) ? out.surname : "-";
        out.first_name = (typeof out.first_name === "string" && out.first_name) ? out.first_name : "-";
        mapped.push(out as unknown as GivenRow);
      }

      if (mapped.length === 0) {
        toast.error("Δεν βρέθηκαν έγκυρες εγγραφές στο αρχείο");
        return;
      }

      const existingKeys = new Set(existing.map((g) => personKey(g.surname, g.first_name, g.father_name, g.event_date)));
      const dupes = new Set<number>();
      const seen = new Map<string, number>();
      mapped.forEach((r, i) => {
        const k = personKey(r.surname, r.first_name, r.father_name, r.event_date);
        if (existingKeys.has(k)) dupes.add(i);
        else if (seen.has(k)) dupes.add(i);
        else seen.set(k, i);
      });

      setPreviewData(mapped);
      setDuplicateIndices(dupes);
      setSkipDuplicates(true);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Σφάλμα κατά την ανάγνωση του αρχείου Excel");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      const toSend = skipDuplicates ? previewData.filter((_, i) => !duplicateIndices.has(i)) : previewData;
      if (toSend.length === 0) {
        toast.error("Δεν υπάρχουν εγγραφές προς εισαγωγή");
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Δεν είστε συνδεδεμένος");

      const rows = toSend.map((r) => ({ ...r, user_id: user.id }));
      const batchSize = 200;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error, data } = await supabase.from("given_gifts").insert(batch as never).select("id");
        if (error) throw new Error(error.message);
        inserted += (data || []).length;
      }

      queryClient.invalidateQueries({ queryKey: ["given-gifts"] });
      const skipped = previewData.length - toSend.length;
      toast.success(skipped > 0
        ? `Εισήχθησαν ${inserted} εγγραφές. Παραλείφθηκαν ${skipped} διπλότυπα.`
        : `Εισήχθησαν ${inserted} εγγραφές επιτυχώς!`);
      setDialogOpen(false);
      setPreviewData([]);
      setDuplicateIndices(new Set());
    } catch (err) {
      const m = err instanceof Error ? err.message : String(err);
      console.error(err);
      toast.error(`Σφάλμα: ${m}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isProcessing} className="gap-2">
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span className="hidden sm:inline">{isProcessing ? "Επεξεργασία..." : "Εισαγωγή Excel"}</span>
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
            {duplicateIndices.size > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div className="text-amber-900 dark:text-amber-100">
                    Εντοπίστηκαν <strong>{duplicateIndices.size}</strong> πιθανά διπλότυπα
                    (ίδιο επώνυμο + όνομα + πατρώνυμο + ημερομηνία).
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer pl-6">
                  <Checkbox checked={skipDuplicates} onCheckedChange={(c) => setSkipDuplicates(!!c)} />
                  <span className="text-sm text-amber-900 dark:text-amber-100">Παράλειψη διπλοτύπων (συνιστάται)</span>
                </label>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Επώνυμο</th>
                    <th className="px-3 py-2 text-left">Όνομα</th>
                    <th className="px-3 py-2 text-left">Εκδήλωση</th>
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
                        <td className="px-3 py-2 text-muted-foreground">{row.event_type || "-"}</td>
                        <td className="px-3 py-2 text-right font-medium">{fmtAmount(row.gift_amount)}</td>
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
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Ακύρωση</Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Εισαγωγή...</>
                ) : (
                  <>Εισαγωγή {skipDuplicates ? previewData.length - duplicateIndices.size : previewData.length} εγγραφών</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
