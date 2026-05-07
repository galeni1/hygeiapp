import { WeddingGift } from "@/types/gift";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit2, Trash2, Info, History } from "lucide-react";
import { GiftHistoryTimeline } from "./GiftHistoryTimeline";

interface GiftDetailsDialogProps {
  gift: WeddingGift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (gift: WeddingGift) => void;
  onDelete: (id: string) => void;
}

const formatAmount = (amount: number | null) => {
  if (!amount) return "—";
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 min-w-0">
    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
      {label}
    </span>
    <span className="text-sm text-foreground break-words">{value || "—"}</span>
  </div>
);

export const GiftDetailsDialog = ({
  gift,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: GiftDetailsDialogProps) => {
  if (!gift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {gift.surname} {gift.first_name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="gap-1.5">
              <Info className="w-3.5 h-3.5" /> Στοιχεία
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5">
              <History className="w-3.5 h-3.5" /> Ιστορικό
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <Field label="Επώνυμο" value={gift.surname} />
              <Field label="Όνομα" value={gift.first_name} />
              <Field label="Πατρώνυμο" value={gift.father_name} />
              <Field label="Παρατσούκλι" value={gift.nickname} />
              <Field label="Χωριό" value={gift.village} />
              <Field label="Υπεύθυνος" value={gift.responsible} />
              <Field label="Τύπος" value={gift.guest_type} />
              <Field
                label="Ποσό"
                value={
                  gift.gift_amount ? (
                    <span className="font-mono tabular-nums font-semibold text-success">
                      {formatAmount(gift.gift_amount)}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
              <div className="sm:col-span-2">
                <Field label="Λεπτομέρειες" value={gift.details} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <GiftHistoryTimeline giftId={gift.id} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onEdit(gift);
            }}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Επεξεργασία
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onOpenChange(false);
              onDelete(gift.id);
            }}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Διαγραφή
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
