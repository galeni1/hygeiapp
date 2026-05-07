import { useMemo, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Plus, Pencil, Trash2, Search, FileDown, FileUp, Stethoscope } from "lucide-react";
import * as XLSX from "xlsx";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useVisits } from "@/hooks/useVisits";
import { VisitFormDialog } from "@/components/VisitFormDialog";
import type { Visit } from "@/types/medical";
import { toast } from "sonner";

const normalize = (s: string) =>
  s
    ?.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") || "";

const Visits = () => {
  const { data: visits = [], isLoading, remove, bulkInsert } = useVisits();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visit | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Visit | null>(null);

  const filtered = useMemo(() => {
    if (!search) return visits;
    const q = normalize(search);
    return visits.filter((v) =>
      [v.doctor_name, v.specialty, v.reason, v.diagnosis, v.prescription, v.notes]
        .filter(Boolean)
        .some((field) => normalize(field as string).includes(q))
    );
  }, [visits, search]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (v: Visit) => {
    setEditing(v);
    setFormOpen(true);
  };

  const handleExport = () => {
    const rows = filtered.map((v) => ({
      Ημερομηνία: v.visit_date,
      Ιατρός: v.doctor_name || "",
      Ειδικότητα: v.specialty || "",
      Λόγος: v.reason || "",
      Διάγνωση: v.diagnosis || "",
      Αγωγή: v.prescription || "",
      Κόστος: v.cost ?? "",
      Σημειώσεις: v.notes || "",
      "Επόμενο ραντεβού": v.next_appointment || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Επισκέψεις");
    XLSX.writeFile(wb, `iatrikes-episkepseis-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      const parseDate = (val: any): string | null => {
        if (!val) return null;
        if (val instanceof Date) return format(val, "yyyy-MM-dd");
        if (typeof val === "number") {
          const d = XLSX.SSF.parse_date_code(val);
          if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
        }
        const s = String(val).trim();
        const dmy = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
        if (dmy) {
          const [, d, m, y] = dmy;
          const yyyy = y.length === 2 ? `20${y}` : y;
          return `${yyyy}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
        const ymd = s.match(/^\d{4}-\d{2}-\d{2}/);
        if (ymd) return s.slice(0, 10);
        return null;
      };

      const visits = rows
        .map((r) => {
          const get = (...keys: string[]) => {
            for (const k of keys) {
              const found = Object.keys(r).find((rk) => normalize(rk) === normalize(k));
              if (found && r[found] !== undefined && r[found] !== "") return r[found];
            }
            return null;
          };
          return {
            visit_date: parseDate(get("Ημερομηνία", "Date")) || new Date().toISOString().slice(0, 10),
            doctor_name: get("Ιατρός", "Doctor")?.toString() || null,
            specialty: get("Ειδικότητα", "Specialty")?.toString() || null,
            reason: get("Λόγος", "Reason")?.toString() || null,
            diagnosis: get("Διάγνωση", "Diagnosis")?.toString() || null,
            prescription: get("Αγωγή", "Συνταγή", "Prescription")?.toString() || null,
            cost: get("Κόστος", "Cost") ? parseFloat(String(get("Κόστος", "Cost"))) : null,
            notes: get("Σημειώσεις", "Notes")?.toString() || null,
            next_appointment: parseDate(get("Επόμενο ραντεβού", "Next appointment")),
          };
        })
        .filter((v) => v.doctor_name || v.reason || v.diagnosis);

      if (visits.length === 0) {
        toast.error("Δεν βρέθηκαν έγκυρες εγγραφές");
        return;
      }
      await bulkInsert.mutateAsync(visits);
      toast.success(`Εισήχθησαν ${visits.length} επισκέψεις`);
    } catch (err) {
      toast.error("Σφάλμα εισαγωγής αρχείου");
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <AppShell onAddNew={handleAdd}>
      <div className="p-3 sm:p-6 space-y-4">
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση σε ιατρό, ειδικότητα, διάγνωση..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
                <FileDown className="h-4 w-4 mr-1" /> Excel
              </Button>
              <label className="inline-flex">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <FileUp className="h-4 w-4 mr-1" /> Εισαγωγή
                  </span>
                </Button>
              </label>
              <Button size="sm" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" /> Νέα
              </Button>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Φόρτωση...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Stethoscope className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {visits.length === 0 ? "Δεν έχετε καταχωρήσει επισκέψεις ακόμα" : "Καμία επίσκεψη δεν ταιριάζει στην αναζήτηση"}
              </p>
              {visits.length === 0 && (
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-1" /> Πρώτη επίσκεψη
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Ημ/νία</TableHead>
                    <TableHead>Ιατρός</TableHead>
                    <TableHead className="hidden md:table-cell">Ειδικότητα</TableHead>
                    <TableHead className="hidden lg:table-cell">Λόγος</TableHead>
                    <TableHead className="hidden lg:table-cell">Διάγνωση</TableHead>
                    <TableHead className="text-right">Κόστος</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => (
                    <TableRow key={v.id} className="cursor-pointer" onClick={() => handleEdit(v)}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {format(new Date(v.visit_date), "dd MMM yyyy", { locale: el })}
                      </TableCell>
                      <TableCell className="font-medium">{v.doctor_name || "—"}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {v.specialty || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {v.reason || "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[280px] truncate">
                        {v.diagnosis || "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {v.cost != null ? `${v.cost.toFixed(2)} €` : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(v)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => setConfirmDelete(v)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <VisitFormDialog open={formOpen} onOpenChange={setFormOpen} visit={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή επίσκεψης;</AlertDialogTitle>
            <AlertDialogDescription>
              Η ενέργεια δεν μπορεί να αναιρεθεί.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ακύρωση</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={async () => {
                if (confirmDelete) await remove.mutateAsync(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Διαγραφή
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

export default Visits;
