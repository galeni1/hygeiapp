import { useMemo, useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { Plus, Search, Activity } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSymptoms } from "@/hooks/useSymptoms";
import { SymptomFormDialog } from "@/components/SymptomFormDialog";
import type { Symptom } from "@/types/medical";
import { smartMatchAny } from "@/lib/search";

const Symptoms = () => {
  const { data: symptoms = [], isLoading } = useSymptoms();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Symptom | null>(null);

  const filtered = useMemo(() => {
    if (!search) return symptoms;
    return symptoms.filter((s) =>
      smartMatchAny([s.body_part, s.description, s.notes], search)
    );
  }, [symptoms, search]);

  const handleAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (s: Symptom) => {
    setEditing(s);
    setFormOpen(true);
  };

  return (
    <AppShell onAddNew={handleAdd}>
      <div className="p-3 sm:p-6 space-y-4">
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Αναζήτηση σε όργανο, περιγραφή, σημειώσεις..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> Νέα
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Φόρτωση...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {symptoms.length === 0
                  ? "Δεν έχετε καταχωρήσει συμπτώματα ακόμα"
                  : "Καμία καταχώρηση δεν ταιριάζει στην αναζήτηση"}
              </p>
              {symptoms.length === 0 && (
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-1" /> Πρώτη καταχώρηση
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Από</TableHead>
                    <TableHead>Όργανο</TableHead>
                    <TableHead>Περιγραφή</TableHead>
                    <TableHead className="hidden md:table-cell text-center">Ένταση</TableHead>
                    <TableHead className="hidden md:table-cell">Κατάσταση</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id} className="cursor-pointer" onClick={() => handleEdit(s)}>
                      <TableCell className="whitespace-nowrap font-mono text-xs">
                        {format(new Date(s.observed_date), "dd MMM yyyy", { locale: el })}
                      </TableCell>
                      <TableCell className="font-medium">{s.body_part || "—"}</TableCell>
                      <TableCell className="text-sm max-w-[320px] truncate">
                        {s.description}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-center font-mono">
                        {s.severity != null ? `${s.severity}/10` : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {s.resolved_at ? (
                          <Badge variant="secondary">Αποκαταστάθηκε</Badge>
                        ) : (
                          <Badge>Ενεργό</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <SymptomFormDialog open={formOpen} onOpenChange={setFormOpen} symptom={editing} />
    </AppShell>
  );
};

export default Symptoms;
