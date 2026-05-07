import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useSpecialties } from "@/hooks/useSpecialties";
import { toast } from "sonner";

const Settings = () => {
  const { settings, updateSettings } = useAppSettings();
  const { data: specialties = [], create, remove } = useSpecialties();
  const [appName, setAppName] = useState(settings.appName);
  const [newSpec, setNewSpec] = useState("");

  const handleSaveName = () => {
    updateSettings({ appName: appName.trim() || "Ιατρικές Επισκέψεις" });
    toast.success("Αποθηκεύτηκε");
  };

  const handleAddSpec = async () => {
    const name = newSpec.trim();
    if (!name) return;
    await create.mutateAsync(name);
    setNewSpec("");
  };

  return (
    <AppShell>
      <div className="p-3 sm:p-6 space-y-4 max-w-2xl mx-auto">
        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Όνομα εφαρμογής</h2>
          <div className="flex gap-2">
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
            <Button onClick={handleSaveName}>Αποθήκευση</Button>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold">Ειδικότητες</h2>
          <p className="text-sm text-muted-foreground">
            Προσθέστε ειδικότητες για ταχεία επιλογή στις φόρμες.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="π.χ. Καρδιολόγος"
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddSpec()}
            />
            <Button onClick={handleAddSpec} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {specialties.length === 0 ? (
              <p className="text-sm text-muted-foreground">Καμία ειδικότητα ακόμα</p>
            ) : (
              specialties.map((s) => (
                <Badge key={s.id} variant="secondary" className="gap-1.5 pl-2.5 pr-1 py-1">
                  {s.name}
                  <button
                    onClick={() => remove.mutate(s.id)}
                    className="hover:bg-destructive/20 rounded p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
};

export default Settings;
