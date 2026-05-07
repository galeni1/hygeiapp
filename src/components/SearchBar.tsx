import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchBar = ({ value, onChange }: SearchBarProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Αναζήτηση εγγραφών..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 h-9 bg-card border-border text-sm rounded-md"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label="Καθαρισμός"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
