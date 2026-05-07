import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGiftSources,
  useCreateGiftSource,
  useUpdateGiftSource,
  useDeleteGiftSource,
} from "@/hooks/useGiftSources";

export const SourcesManager = () => {
  const { data: sources = [], isLoading } = useGiftSources();
  const createSource = useCreateGiftSource();
  const updateSource = useUpdateGiftSource();
  const deleteSource = useDeleteGiftSource();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await createSource.mutateAsync(newName);
    setNewName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const saveEdit = async () => {
    if (editingId && editingName.trim()) {
      await updateSource.mutateAsync({ id: editingId, name: editingName });
    }
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Πηγές</CardTitle>
        <CardDescription className="text-xs">
          Δημιουργήστε τη λίστα πηγών (π.χ. Γαμπρός, Νύφη, Πεθερός, Κουμπάρος Μανώλης).
          Θα εμφανίζονται ως επιλογές στη φόρμα εγγραφής.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleAdd} className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="π.χ. Γαμπρός"
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={!newName.trim() || createSource.isPending}>
            <Plus className="w-4 h-4 mr-1" />
            Προσθήκη
          </Button>
        </form>

        {isLoading ? (
          <p className="text-xs text-muted-foreground">Φόρτωση...</p>
        ) : sources.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Δεν υπάρχουν πηγές ακόμα.</p>
        ) : (
          <div className="border border-border rounded-md divide-y divide-border">
            {sources.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                {editingId === s.id ? (
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
                    <span className="flex-1 text-sm text-foreground">{s.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => startEdit(s.id, s.name)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteSource.mutate(s.id)}
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
