import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, Save, Upload, Gift, HandHeart, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useGifts } from "@/hooks/useGifts";
import { useGivenGifts } from "@/hooks/useGivenGifts";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/AppShell";
import { ImportButton } from "@/components/ImportButton";
import { GivenImportButton } from "@/components/GivenImportButton";
import { SourcesManager } from "@/components/SourcesManager";
import { GivenEventTypesManager } from "@/components/GivenEventTypesManager";
import * as XLSX from "xlsx";

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings } = useAppSettings();
  const { data: gifts = [] } = useGifts();
  const { data: givenGifts = [] } = useGivenGifts();
  const { toast } = useToast();
  const [appName, setAppName] = useState(settings.appName);

  const handleSave = () => {
    updateSettings({ appName });
    toast({ title: "Αποθηκεύτηκε", description: "Οι ρυθμίσεις αποθηκεύτηκαν επιτυχώς." });
  };

  const downloadAllRecords = () => {
    if (gifts.length === 0) {
      toast({ title: "Δεν υπάρχουν εγγραφές", description: "Δεν υπάρχουν δεδομένα για εξαγωγή.", variant: "destructive" });
      return;
    }
    const exportData = gifts.map((gift, index) => ({
      "Α/Α": index + 1,
      ΕΠΩΝΥΜΟ: gift.surname,
      ΟΝΟΜΑ: gift.first_name,
      ΠΑΤΡΩΝΥΜΟ: gift.father_name || "",
      ΠΑΡΑΤΣΟΥΚΛΙ: gift.nickname || "",
      ΤΟΠΟΘΕΣΙΑ: gift.village || "",
      ΥΠΕΥΘΥΝΟΣ: gift.responsible || "",
      ΤΥΠΟΣ: gift.guest_type || "",
      ΠΗΓΗ: gift.source || "",
      ΠΟΣΟ: gift.gift_amount || "",
      ΛΕΠΤΟΜΕΡΕΙΕΣ: gift.details || "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Εγγραφές");
    XLSX.writeFile(wb, `${settings.appName.replace(/\s+/g, "_")}_εγγραφές.xlsx`);
    toast({ title: "Επιτυχής εξαγωγή", description: `Εξήχθησαν ${gifts.length} εγγραφές.` });
  };

  const downloadTemplate = () => {
    const templateData = [{
      ΕΠΩΝΥΜΟ: "Παπαδόπουλος", ΟΝΟΜΑ: "Γιώργος", ΠΑΤΡΩΝΥΜΟ: "Νίκος", ΠΑΡΑΤΣΟΥΚΛΙ: "",
      ΤΟΠΟΘΕΣΙΑ: "Αθήνα", ΥΠΕΥΘΥΝΟΣ: "Νύφη", ΤΥΠΟΣ: "Συγγενής", ΠΗΓΗ: "Εκκλησία",
      ΠΟΣΟ: 100, ΛΕΠΤΟΜΕΡΕΙΕΣ: "Παράδειγμα εγγραφής",
    }];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_εισαγωγής.xlsx");
    toast({ title: "Template κατέβηκε", description: "Συμπληρώστε το template και ανεβάστε το." });
  };

  const downloadAllGivenRecords = () => {
    if (givenGifts.length === 0) {
      toast({ title: "Δεν υπάρχουν εγγραφές", description: "Δεν υπάρχουν δεδομένα για εξαγωγή.", variant: "destructive" });
      return;
    }
    const exportData = givenGifts.map((g, index) => ({
      "Α/Α": index + 1,
      ΕΠΩΝΥΜΟ: g.surname,
      ΟΝΟΜΑ: g.first_name,
      ΠΑΤΡΩΝΥΜΟ: g.father_name || "",
      ΠΑΡΑΤΣΟΥΚΛΙ: g.nickname || "",
      ΧΩΡΙΟ: g.village || "",
      ΣΧΕΣΗ: g.relationship || "",
      "ΤΥΠΟΣ ΕΚΔΗΛΩΣΗΣ": g.event_type || "",
      ΗΜΕΡΟΜΗΝΙΑ: g.event_date || "",
      ΠΟΣΟ: g.gift_amount ?? "",
      ΛΕΠΤΟΜΕΡΕΙΕΣ: g.details || "",
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Δώρα μου");
    XLSX.writeFile(wb, `δώρα_μου.xlsx`);
    toast({ title: "Επιτυχής εξαγωγή", description: `Εξήχθησαν ${givenGifts.length} εγγραφές.` });
  };

  const downloadGivenTemplate = () => {
    const templateData = [{
      ΕΠΩΝΥΜΟ: "Παπαδόπουλος", ΟΝΟΜΑ: "Γιώργος", ΠΑΤΡΩΝΥΜΟ: "Νίκος", ΠΑΡΑΤΣΟΥΚΛΙ: "",
      ΧΩΡΙΟ: "Αθήνα", ΣΧΕΣΗ: "Φίλος", "ΤΥΠΟΣ ΕΚΔΗΛΩΣΗΣ": "Γάμος",
      ΗΜΕΡΟΜΗΝΙΑ: "2024-06-15", ΠΟΣΟ: 100, ΛΕΠΤΟΜΕΡΕΙΕΣ: "Παράδειγμα εγγραφής",
    }];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_δώρα_μου.xlsx");
    toast({ title: "Template κατέβηκε", description: "Συμπληρώστε το template και ανεβάστε το." });
  };

  return (
    <AppShell>
      <div className="px-3 sm:px-6 py-4 max-w-3xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Ρυθμίσεις</h1>
          <p className="text-xs text-muted-foreground">Διαχείριση εφαρμογής & δεδομένων</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="text-xs sm:text-sm">
              <SettingsIcon className="w-3.5 h-3.5 mr-1.5" />
              Γενικά
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs sm:text-sm">
              <Gift className="w-3.5 h-3.5 mr-1.5" />
              Δώρα προς εμένα
            </TabsTrigger>
            <TabsTrigger value="given" className="text-xs sm:text-sm">
              <HandHeart className="w-3.5 h-3.5 mr-1.5" />
              Δώρα μου
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Όνομα Εφαρμογής</CardTitle>
                <CardDescription className="text-xs">Αλλάξτε το όνομα που εμφανίζεται στην εφαρμογή</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="appName" className="text-xs font-medium">Όνομα</Label>
                  <Input id="appName" value={appName} onChange={(e) => setAppName(e.target.value)} className="h-9" />
                </div>
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-1" />
                  Αποθήκευση
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="received" className="space-y-4 mt-4">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <Gift className="w-3.5 h-3.5 inline mr-1 text-primary" />
                Ρυθμίσεις για τα δώρα που <strong className="text-foreground">μου έχουν κάνει</strong> (καλεσμένοι μου)
              </p>
            </div>

            <SourcesManager />

            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Εισαγωγή / Εξαγωγή</CardTitle>
                <CardDescription className="text-xs">Δώρα που μου έχουν κάνει</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-md">
                  <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Εισαγωγή από Excel</p>
                    <p className="text-xs text-muted-foreground">Ανεβάστε αρχείο .xlsx ή .csv</p>
                  </div>
                  <ImportButton />
                </div>
                <Button onClick={downloadAllRecords} variant="outline" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Λήψη όλων των εγγραφών ({gifts.length})
                </Button>
                <Button onClick={downloadTemplate} variant="outline" size="sm" className="w-full justify-start">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Λήψη Template για εισαγωγή
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="given" className="space-y-4 mt-4">
            <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
              <p className="text-xs text-muted-foreground">
                <HandHeart className="w-3.5 h-3.5 inline mr-1 text-primary" />
                Ρυθμίσεις για τα δώρα που <strong className="text-foreground">έχω κάνει εγώ</strong>
              </p>
            </div>

            <GivenEventTypesManager />

            <Card className="shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Εισαγωγή / Εξαγωγή</CardTitle>
                <CardDescription className="text-xs">Δώρα που έχω κάνει εγώ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border rounded-md">
                  <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Εισαγωγή από Excel</p>
                    <p className="text-xs text-muted-foreground">Ανεβάστε αρχείο .xlsx ή .csv</p>
                  </div>
                  <GivenImportButton />
                </div>
                <Button onClick={downloadAllGivenRecords} variant="outline" size="sm" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Λήψη όλων των εγγραφών ({givenGifts.length})
                </Button>
                <Button onClick={downloadGivenTemplate} variant="outline" size="sm" className="w-full justify-start">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Λήψη Template για εισαγωγή
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center pt-4 pb-2 text-xs text-muted-foreground/60">
          {/* footer rendered by AppShell */}
        </div>
      </div>
    </AppShell>
  );
};

export default Settings;
