"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Zap, AlertTriangle, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DrugPickerSheet } from "@/components/drug-picker-sheet";
import { TemplatePickerSheet } from "@/components/template-picker-sheet";
import { getPatient, getVisit, getVisits, saveVisit, trackDrugUsage } from "@/lib/firestore-service";
import type { Patient, PrescriptionItem, Visit, Vitals } from "@/lib/types";

const BP_REGEX = /^\d{2,3}\/\d{2,3}$/;

function validateVitals(bp: string, temp: string, weight: string, pulse: string): string | null {
  if (bp && !BP_REGEX.test(bp)) return "BP ka format 120/80 jaisa hona chahiye";
  if (temp) {
    const t = parseFloat(temp);
    if (isNaN(t) || t < 90 || t > 110) return "Temperature 90-110°F ke darmiyan hona chahiye";
  }
  if (weight) {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 0.5 || w > 300) return "Weight 0.5-300 kg ke darmiyan hona chahiye";
  }
  if (pulse) {
    const p = parseInt(pulse, 10);
    if (isNaN(p) || p < 20 || p > 250) return "Pulse 20-250 bpm ke darmiyan hona chahiye";
  }
  return null;
}

function NewVisitContent() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const duplicateFrom = searchParams.get("duplicate");
  const router = useRouter();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [complaint, setComplaint] = React.useState("");
  const [bp, setBp] = React.useState("");
  const [temp, setTemp] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [pulse, setPulse] = React.useState("");
  const [diagnosis, setDiagnosis] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [items, setItems] = React.useState<PrescriptionItem[]>([]);
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [existingVisitId, setExistingVisitId] = React.useState<string | null>(null);
  const [lastVisit, setLastVisit] = React.useState<Visit | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    getPatient(user.uid, params.id).then(setPatient);

    getVisits(user.uid, params.id).then((visits) => {
      if (visits.length > 0) setLastVisit(visits[0]);
    });

    if (editId) {
      getVisit(user.uid, params.id, editId).then((v) => {
        if (!v) return;
        setExistingVisitId(v.id);
        setComplaint(v.complaint);
        setBp(v.parsedVitals?.bp ?? "");
        setTemp(v.parsedVitals?.temp ?? "");
        setWeight(v.parsedVitals?.weight ?? "");
        setPulse(v.parsedVitals?.pulse ?? "");
        setDiagnosis(v.diagnosis);
        setNotes(v.notes);
        setItems(v.items);
        setFollowUpDate(v.followUpDate ?? "");
      });
    }

    if (duplicateFrom) {
      getVisit(user.uid, params.id, duplicateFrom).then((v) => {
        if (!v) return;
        setComplaint(v.complaint);
        setDiagnosis(v.diagnosis);
        setNotes(v.notes);
        setItems(v.items.map((i) => ({ ...i, id: uuid() })));
      });
    }
  }, [user, params.id, editId, duplicateFrom]);

  React.useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const markDirty = () => { if (!dirty) setDirty(true); };

  const upsertItem = (item: PrescriptionItem) => {
    markDirty();
    setItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
    });
  };

  const duplicateLast = () => {
    if (!lastVisit) return;
    setComplaint(lastVisit.complaint);
    setDiagnosis(lastVisit.diagnosis);
    setNotes(lastVisit.notes);
    setItems(lastVisit.items.map((i) => ({ ...i, id: uuid() })));
    markDirty();
    toast.success("Pichla nuskha copy ho gaya");
  };

  const save = async () => {
    if (!user || !patient) return;
    if (!complaint.trim() && items.length === 0) {
      toast.error("Takleef ya kam az kam aik dawa shamil karein");
      return;
    }

    const vitalsError = validateVitals(bp, temp, weight, pulse);
    if (vitalsError) {
      toast.error(vitalsError);
      return;
    }

    if (followUpDate) {
      const today = new Date().toISOString().split("T")[0];
      if (followUpDate < today) {
        toast.error("Follow-up date aaj se pehle ki nahi ho sakti");
        return;
      }
    }

    setSaving(true);

    const vitalsStr = [bp && `BP: ${bp}`, temp && `Temp: ${temp}`, weight && `Weight: ${weight}`, pulse && `Pulse: ${pulse}`]
      .filter(Boolean)
      .join(", ");

    const parsedVitals: Vitals = {};
    if (bp) parsedVitals.bp = bp;
    if (temp) parsedVitals.temp = temp;
    if (weight) parsedVitals.weight = weight;
    if (pulse) parsedVitals.pulse = pulse;

    const visit: Visit = {
      id: existingVisitId ?? uuid(),
      patientId: patient.id,
      date: existingVisitId
        ? (await getVisit(user.uid, patient.id, existingVisitId))?.date ?? new Date().toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          })
        : new Date().toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
          }),
      complaint: complaint.trim(),
      vitals: vitalsStr,
      parsedVitals,
      diagnosis: diagnosis.trim(),
      notes: notes.trim(),
      items,
      followUpDate: followUpDate || undefined,
    };
    try {
      await saveVisit(user.uid, visit);
      for (const item of items) {
        await trackDrugUsage(user.uid, item.drugName, item.dosage, item.frequency);
      }
      setDirty(false);
      router.replace(`/patients/${patient.id}/visit/${visit.id}`);
    } catch {
      toast.error("Save nahi ho saka - connection check karein");
      setSaving(false);
    }
  };

  if (!patient) {
    return (
      <AppShell>
        <div className="h-32 animate-pulse rounded-lg bg-petrol-light/50" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">
          {editId ? "Checkup edit karein" : "Naya checkup"}
        </h1>
        {!editId && lastVisit && (
          <Button variant="ghost" size="sm" onClick={duplicateLast}>
            <Copy className="size-3.5" />
            Pichla nuskha
          </Button>
        )}
      </div>
      <p className="mb-5 text-[14px] text-ink-muted">{patient.name}</p>

      {patient.allergies && (
        <div className="mb-5 flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-light px-3.5 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-[14px] text-danger">
            <span className="font-medium">Allergy record mein hai: </span>
            {patient.allergies}
          </p>
        </div>
      )}

      <Card className="mb-5">
        <CardContent className="space-y-4 pt-5">
          <div>
            <Label htmlFor="complaint">Takleef (C/O)</Label>
            <Input id="complaint" value={complaint} onChange={(e) => { setComplaint(e.target.value); markDirty(); }} />
          </div>
          <div>
            <Label>Vitals</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="BP (120/80)" value={bp} onChange={(e) => { setBp(e.target.value); markDirty(); }} />
              <Input placeholder="Temp (98.6°F)" value={temp} onChange={(e) => { setTemp(e.target.value); markDirty(); }} />
              <Input placeholder="Weight (kg)" inputMode="decimal" value={weight} onChange={(e) => { setWeight(e.target.value); markDirty(); }} />
              <Input placeholder="Pulse (bpm)" inputMode="numeric" value={pulse} onChange={(e) => { setPulse(e.target.value); markDirty(); }} />
            </div>
          </div>
          <div>
            <Label htmlFor="diagnosis">Bimari (Dx)</Label>
            <Input id="diagnosis" value={diagnosis} onChange={(e) => { setDiagnosis(e.target.value); markDirty(); }} />
          </div>
          <div>
            <Label htmlFor="notes">Mashwara / hidayat</Label>
            <Textarea id="notes" rows={2} value={notes} onChange={(e) => { setNotes(e.target.value); markDirty(); }} />
          </div>
          <div>
            <Label htmlFor="followup">Follow-up date</Label>
            <Input
              id="followup"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={followUpDate}
              onChange={(e) => { setFollowUpDate(e.target.value); markDirty(); }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-ink">Nuskha (Rx)</h2>
        <TemplatePickerSheet
          trigger={
            <Button variant="ghost" size="sm">
              <Zap className="size-3.5 text-gold" />
              Template lagayein
            </Button>
          }
          onPick={(t) => { setItems((prev) => [...prev, ...t.items.map((i) => ({ ...i, id: uuid() }))]); markDirty(); }}
        />
      </div>

      <div className="mb-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">
                {item.drugName} {item.dosage}
              </p>
              <p className="text-[13px] text-ink-muted">
                {[item.frequency, item.duration, item.quantity, item.instructions].filter(Boolean).join(" · ")}
              </p>
            </div>
            <DrugPickerSheet
              editing={item}
              onSave={upsertItem}
              trigger={
                <Button variant="ghost" size="icon" className="size-8">
                  <Pencil className="size-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-danger hover:bg-danger-light hover:text-danger"
              onClick={() => { setItems((prev) => prev.filter((i) => i.id !== item.id)); markDirty(); }}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <DrugPickerSheet
        onSave={upsertItem}
        trigger={
          <Button variant="secondary" className="mb-6 w-full">
            <Plus className="size-4" />
            Dawa shamil karein
          </Button>
        }
      />

      <Button size="lg" className="w-full" onClick={save} disabled={saving}>
        {saving ? "Mehfooz ho raha hai..." : editId ? "Update karein" : "Mehfooz karein aur nuskha banayein"}
      </Button>
    </AppShell>
  );
}

export default function NewVisitPage() {
  return (
    <RequireAuth>
      <React.Suspense>
        <NewVisitContent />
      </React.Suspense>
    </RequireAuth>
  );
}
