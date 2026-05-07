import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGivenEventTypes,
  useCreateGivenEventType,
  useUpdateGivenEventType,
  useDeleteGivenEventType,
} from "@/hooks/useGivenEventTypes";

export const GivenEventTypesManager = () => {
  const { data: types = [], isLoading } = useGivenEventTypes();
  const createType = useCreateGivenEventType();
  const updateType = useUpdateGivenEventType();
  const deleteType = useDeleteGivenEventType();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createType.mutateAsync(newName);
    setNewName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = async () => {
    if (editingId && editingName.trim()) {
      await updateType.mutateAsync({ id: editingId, name: editingName });
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Δώρα μου — Τύποι Εκδηλώσεων
        </CardTitle>
        <CardDescription className="text-xs">
          Διαχειριστείτε τη λίστα εκδηλώσεων (π.χ. Γάμος, Βάφτιση, Αρραβώνας).
          Θα εμφανίζονται ως επιλογές όταν καταχωρείτε νέο δώρο που δίνετε.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="π.χ. Γάμος"
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={!newName.trim() || createType.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            Προσθήκη
          </Button>
        </form>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Φόρτωση...</p>
        ) : types.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Δεν υπάρχουν τύποι ακόμα. Προσθέστε τον πρώτο παραπάνω.
          </p>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {types.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2">
                {editingId === t.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") { setEditingId(null); setEditingName(""); }
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}>
                      <Check className="w-4 h-4 text-success" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => { setEditingId(null); setEditingName(""); }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{t.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => startEdit(t.id, t.name)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteType.mutate(t.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
