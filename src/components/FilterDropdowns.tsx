import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { MultiSelectFilter } from "./MultiSelectFilter";

interface FilterDropdownsProps {
  sources: string[];
  responsibles: string[];
  villages: string[];
  surnames: string[];
  nicknames: string[];
  selectedSources: string[];
  selectedResponsibles: string[];
  selectedVillages: string[];
  selectedSurnames: string[];
  selectedNicknames: string[];
  onSourcesChange: (v: string[]) => void;
  onResponsiblesChange: (v: string[]) => void;
  onVillagesChange: (v: string[]) => void;
  onSurnamesChange: (v: string[]) => void;
  onNicknamesChange: (v: string[]) => void;
  onClearFilters: () => void;
}

export const FilterDropdowns = ({
  sources,
  responsibles,
  villages,
  surnames,
  nicknames,
  selectedSources,
  selectedResponsibles,
  selectedVillages,
  selectedSurnames,
  selectedNicknames,
  onSourcesChange,
  onResponsiblesChange,
  onVillagesChange,
  onSurnamesChange,
  onNicknamesChange,
  onClearFilters,
}: FilterDropdownsProps) => {
  const hasActiveFilters =
    selectedSources.length > 0 ||
    selectedResponsibles.length > 0 ||
    selectedVillages.length > 0 ||
    selectedSurnames.length > 0 ||
    selectedNicknames.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MultiSelectFilter
        options={sources}
        selected={selectedSources}
        onChange={onSourcesChange}
        placeholder="Πηγή"
        width="w-[calc(50%-0.25rem)] sm:w-[170px]"
      />

      <MultiSelectFilter
        options={responsibles}
        selected={selectedResponsibles}
        onChange={onResponsiblesChange}
        placeholder="Υπεύθυνος"
        width="w-[calc(50%-0.25rem)] sm:w-[170px]"
      />

      <MultiSelectFilter
        options={villages}
        selected={selectedVillages}
        onChange={onVillagesChange}
        placeholder="Χωριό"
        width="w-[calc(50%-0.25rem)] sm:w-[170px]"
      />

      <MultiSelectFilter
        options={surnames}
        selected={selectedSurnames}
        onChange={onSurnamesChange}
        placeholder="Επώνυμο"
        width="w-[calc(50%-0.25rem)] sm:w-[170px]"
      />

      <MultiSelectFilter
        options={nicknames}
        selected={selectedNicknames}
        onChange={onNicknamesChange}
        placeholder="Παρατσούκλι"
        width="w-full sm:w-[170px]"
      />

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-9 text-xs">
          <X className="w-3.5 h-3.5 mr-1" />
          Καθαρισμός
        </Button>
      )}
    </div>
  );
};
