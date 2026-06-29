"use client";

import * as React from "react";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import { Plus, Trash2, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DrugPickerSheet } from "@/components/drug-picker-sheet";
import { getTemplates, saveTemplate, deleteTemplate } from "@/lib/firestore-service";
import type { PrescriptionItem, RxTemplate } from "@/lib/types";

function NewTemplateSheet({ onSaved }: { onSaved: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [items, setItems] = React.useState<PrescriptionItem[]>([]);

  const reset = () => {
    setName("");
    setItems([]);
  };

  const save = async () => {
    if (!user || !name.trim() || items.length === 0) {
      toast.error("Naam aur kam az kam aik dawa zaroor daalein");
      return;
    }
    const template: RxTemplate = { id: uuid(), name: name.trim(), items };
    await saveTemplate(user.uid, template);
    toast.success("Template save ho gaya");
    reset();
    setOpen(false);
    onSaved();
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button size="icon" className="fixed bottom-24 right-6 size-14 rounded-full shadow-lg sm:bottom-8 sm:right-8">
          <Plus className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Naya template</SheetTitle>
        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">Template ka naam</Label>
            <Input
              id="template-name"
              placeholder="Maslan Bukhar combo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border p-3">
                <p className="font-medium text-ink">
                  {item.drugName} {item.dosage}
                </p>
                <p className="text-[12px] text-ink-muted">
                  {[item.frequency, item.duration].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
          <DrugPickerSheet
            onSave={(item) => setItems((prev) => [...prev, item])}
            trigger={
              <Button variant="secondary" className="w-full">
                <Plus className="size-4" />
                Dawa shamil karein
              </Button>
            }
          />
          <Button className="w-full" size="lg" onClick={save}>
            Template save karein
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TemplatesContent() {
  const { user } = useAuth();
  const [templates, setTemplates] = React.useState<RxTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    let active = true;
    getTemplates(user.uid).then((data) => {
      if (active) {
        setTemplates(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [user]);

  const refresh = async () => {
    if (!user) return;
    const data = await getTemplates(user.uid);
    setTemplates(data);
  };

  const remove = async (id: string) => {
    if (!user) return;
    await deleteTemplate(user.uid, id);
    toast.success("Template delete ho gaya");
    refresh();
  };

  return (
    <AppShell>
      <h1 className="mb-1 text-xl font-medium text-ink">Rx Templates</h1>
      <p className="mb-5 text-[14px] text-ink-muted">
        Jo dawayein aap aksar likhte hain, unka combo save karein. Aik tap mein lagayein.
      </p>

      {loading ? (
        <div className="h-20 animate-pulse rounded-lg bg-petrol-light/50" />
      ) : templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong py-16 text-center">
          <p className="text-ink-muted">Abhi koi template nahi. + dabayein aur banayein.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {templates.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5"
            >
              <Zap className="size-4 shrink-0 text-gold" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{t.name}</p>
                <p className="text-[12px] text-ink-muted">
                  {t.items.map((i) => i.drugName).join(", ")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-danger hover:bg-danger-light hover:text-danger"
                onClick={() => remove(t.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <NewTemplateSheet onSaved={refresh} />
    </AppShell>
  );
}

export default function TemplatesPage() {
  return (
    <RequireAuth>
      <TemplatesContent />
    </RequireAuth>
  );
}
