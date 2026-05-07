import { WeddingGift } from "@/types/gift";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, MapPin, User } from "lucide-react";

interface GiftCardProps {
  gift: WeddingGift;
  onEdit: (gift: WeddingGift) => void;
  onDelete: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
}

export const GiftCard = ({ gift, onEdit, onDelete, isSelected, onSelect, selectionMode }: GiftCardProps) => {
  const formatAmount = (amount: number | null) => {
    if (!amount) return null;
    return new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const handleCardClick = () => {
    if (selectionMode && onSelect) onSelect(gift.id, !isSelected);
  };

  return (
    <div
      className={`group bg-card border rounded-md p-3 shadow-xs hover:shadow-sm-erp hover:border-primary/30 transition-all touch-manipulation ${
        isSelected ? "border-primary bg-primary/5" : "border-border"
      } ${selectionMode ? "cursor-pointer" : ""}`}
      onClick={selectionMode ? handleCardClick : undefined}
    >
      <div className="flex items-start gap-2.5">
        {onSelect && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(gift.id, checked === true)}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 shrink-0"
          />
        )}

        <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
          {gift.first_name?.charAt(0) || "?"}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {gift.surname} {gift.first_name}
              </h3>
              {gift.nickname && (
                <p className="text-xs text-muted-foreground truncate">"{gift.nickname}"</p>
              )}
            </div>
            {gift.gift_amount ? (
              <span className="font-mono tabular-nums text-sm font-semibold text-success shrink-0">
                {formatAmount(gift.gift_amount)}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground shrink-0">—</span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            {gift.village && (
              <span className="inline-flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{gift.village}</span>
              </span>
            )}
            {gift.father_name && (
              <span className="inline-flex items-center gap-1 truncate">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{gift.father_name}</span>
              </span>
            )}
            {gift.responsible && (
              <span className="truncate">
                <span className="font-medium">Υπεύθ:</span> {gift.responsible}
              </span>
            )}
            {gift.source && (
              <span className="truncate">
                <span className="font-medium">Πηγή:</span> {gift.source}
              </span>
            )}
          </div>

          {gift.details && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{gift.details}</p>
          )}
        </div>

        <div className="flex flex-col gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onEdit(gift); }}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(gift.id); }}
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
