import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { APP_VERSION } from "@/lib/version";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  Menu,
  Plus,
  LayoutDashboard,
  BarChart3,
  Stethoscope,
  CalendarClock,
  UserRound,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface AppShellProps {
  children: React.ReactNode;
  onAddNew?: () => void;
}

const navItems = [
  { to: "/", label: "Πίνακας ελέγχου", icon: LayoutDashboard },
  { to: "/visits", label: "Επισκέψεις", icon: Stethoscope },
  { to: "/appointments", label: "Ραντεβού", icon: CalendarClock },
  { to: "/doctors", label: "Ιατροί", icon: UserRound },
  { to: "/stats", label: "Στατιστικά", icon: BarChart3 },
  { to: "/settings", label: "Ρυθμίσεις", icon: SettingsIcon },
];

export const AppShell = ({ children, onAddNew }: AppShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const currentLabel = navItems.find((n) => n.to === location.pathname)?.label || "";

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col w-full">
      {/* Top bar - white, full width */}
      <header className="h-14 bg-card border-b border-border sticky top-0 z-30 flex items-center px-3 sm:px-6 gap-3 shadow-xs">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
          <span
            className="font-display font-semibold leading-none text-[20px] sm:text-[22px] tracking-tight flex items-center gap-1.5"
            style={{ color: "hsl(var(--primary))" }}
          >
            <Stethoscope className="h-5 w-5" />
            iatrika
          </span>
          <span className="hidden sm:inline-block text-foreground font-semibold text-base ml-2 pl-3 border-l border-border truncate max-w-[200px] leading-none">
            {settings.appName}
          </span>
        </Link>

        {/* Current page label (all viewports) */}
        {currentLabel && (
          <span className="text-muted-foreground text-sm truncate hidden sm:inline-block ml-2 pl-3 border-l border-border">
            {currentLabel}
          </span>
        )}
        <span className="sm:hidden text-foreground font-semibold text-[20px] leading-none truncate">
          {currentLabel}
        </span>

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">

          {onAddNew && (
            <Button
              onClick={onAddNew}
              size="icon"
              className="h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-xs"
              aria-label="Νέα εγγραφή"
            >
              <Plus className="w-5 h-5" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
              <DropdownMenuLabel className="font-normal">
                <p className="text-xs text-muted-foreground">Συνδεδεμένος ως</p>
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {navItems.map((item) => (
                <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)}>
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                {theme === "dark" ? "Φωτεινό θέμα" : "Σκοτεινό θέμα"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Αποσύνδεση
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-muted-foreground/70 border-t border-border bg-card">
        © {new Date().getFullYear()} Γιώργος Ζερβός · {APP_VERSION}
      </footer>
    </div>
  );
};
