import { WeddingGift } from "@/types/gift";
import { Users, Gift, Euro, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  gifts: WeddingGift[];
  totalGifts?: WeddingGift[];
  isFiltered?: boolean;
}

export const StatsCards = ({ gifts, totalGifts, isFiltered }: StatsCardsProps) => {
  const totalGuests = gifts.length;
  const allGuests = totalGifts?.length ?? gifts.length;
  const giftsWithAmount = gifts.filter((g) => g.gift_amount && g.gift_amount > 0);
  const totalAmount = gifts.reduce((sum, g) => sum + (g.gift_amount || 0), 0);
  const averageAmount = giftsWithAmount.length > 0 ? totalAmount / giftsWithAmount.length : 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("el-GR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const stats = [
    {
      label: isFiltered ? "Αποτελέσματα" : "Καλεσμένοι",
      value: isFiltered ? `${totalGuests}` : totalGuests.toString(),
      sub: isFiltered ? `από ${allGuests}` : "σύνολο",
      icon: Users,
      tone: "text-info bg-info/10",
    },
    {
      label: "Με δώρο",
      value: giftsWithAmount.length.toString(),
      sub: `${totalGuests > 0 ? Math.round((giftsWithAmount.length / totalGuests) * 100) : 0}%`,
      icon: Gift,
      tone: "text-success bg-success/10",
    },
    {
      label: "Συνολικό ποσό",
      value: formatAmount(totalAmount),
      sub: "EUR",
      icon: Euro,
      tone: "text-primary bg-primary/10",
    },
    {
      label: "Μέσος όρος",
      value: formatAmount(averageAmount),
      sub: "ανά δώρο",
      icon: TrendingUp,
      tone: "text-warning bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-card border border-border rounded-lg p-3 sm:p-4 shadow-xs hover:shadow-sm-erp transition-shadow"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium truncate">
                {stat.label}
              </p>
              <p className="text-lg sm:text-2xl font-semibold text-foreground mt-1 truncate font-mono tabular-nums">
                {stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md flex items-center justify-center shrink-0 ${stat.tone}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
