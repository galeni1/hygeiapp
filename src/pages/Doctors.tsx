import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Phone, Mail, MapPin, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useDoctors } from "@/hooks/useDoctors";
import { DoctorFormDialog } from "@/components/DoctorFormDialog";
import type { Doctor } from "@/types/medical";

import { smartMatchAny } from "@/lib/search";

const Doctors = () => {
  const { data: doctors = [], isLoading, remove } = useDoctors();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Doctor | null>(null);

  const filtered = useMemo(() => {
    if (!search) return doctors;
    return doctors.filter((d) =>
      smartMatchAny([d.name, d.specialty, d.phone, d.email, d.address, d.notes], search)
    );
  }, [doctors, search]);

  const handleAdd = () => {
    setEditing(null);
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
                placeholder="Αναζήτηση ιατρού..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" /> Νέος ιατρός
            </Button>
          </div>
        </Card>

        {isLoading ? (
          <Card className="p-12 text-center text-muted-foreground">Φόρτωση...</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Stethoscope className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              {doctors.length === 0 ? "Δεν έχετε προσθέσει ιατρούς" : "Κανένας ιατρός δεν ταιριάζει"}
            </p>
            {doctors.length === 0 && (
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-1" /> Πρώτος ιατρός
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((d) => (
              <Card key={d.id} className="p-4 hover:shadow-md-erp transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">{d.name}</h3>
                    {d.specialty && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {d.specialty}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => {
                        setEditing(d);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setConfirmDelete(d)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-muted-foreground mt-3">
                  {d.phone && (
                    <a href={`tel:${d.phone}`} className="flex items-center gap-2 hover:text-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" /> {d.phone}
                    </a>
                  )}
                  {d.email && (
                    <a href={`mailto:${d.email}`} className="flex items-center gap-2 hover:text-foreground truncate">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{d.email}</span>
                    </a>
                  )}
                  {d.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{d.address}</span>
                    </p>
                  )}
                  {d.notes && <p className="text-xs italic mt-2 pt-2 border-t">{d.notes}</p>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DoctorFormDialog open={formOpen} onOpenChange={setFormOpen} doctor={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Διαγραφή ιατρού;</AlertDialogTitle>
            <AlertDialogDescription>
              Οι επισκέψεις του ιατρού δεν θα διαγραφούν, απλά θα αποσυνδεθούν.
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

export default Doctors;
