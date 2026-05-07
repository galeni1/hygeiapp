import { Button } from "@/components/ui/button";
import { Trash2, X, CheckSquare, Loader2 } from "lucide-react";

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  isDeleting?: boolean;
  onDeleteAll?: () => void;
  isDeletingAll?: boolean;
  allGiftsCount?: number;
}

export const BulkActions = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  isDeleting,
  onDeleteAll,
  isDeletingAll,
  allGiftsCount = 0,
}: BulkActionsProps) => {
  if (selectedCount === 0) return null;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border border-border shadow-lg-erp rounded-lg px-3 py-2 flex items-center gap-2 animate-fade-in max-w-[95vw]">
      <span className="text-xs font-medium text-foreground bg-primary/10 text-primary px-2 py-1 rounded">
        {selectedCount} επιλ.
      </span>

      <Button variant="ghost" size="xs" onClick={onSelectAll} className="text-muted-foreground">
        <CheckSquare className="w-3.5 h-3.5 mr-1" />
        Όλα ({totalCount})
      </Button>

      <Button variant="ghost" size="xs" onClick={onClearSelection} className="text-muted-foreground">
        <X className="w-3.5 h-3.5" />
      </Button>

      <div className="h-4 w-px bg-border" />

      <Button variant="destructive" size="xs" onClick={onBulkDelete} disabled={isDeleting}>
        <Trash2 className="w-3.5 h-3.5 mr-1" />
        {isDeleting ? "..." : "Διαγραφή"}
      </Button>

      {allSelected && onDeleteAll && allGiftsCount > 0 && (
        <Button variant="destructive" size="xs" onClick={onDeleteAll} disabled={isDeletingAll}>
          {isDeletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
          Όλων ({allGiftsCount})
        </Button>
      )}
    </div>
  );
};
