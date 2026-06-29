"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Plus, AlertTriangle, Stethoscope, Pencil, Trash2, TrendingUp, FileText, CalendarPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getPatient, getVisits, savePatient, deletePatient, saveAppointment, checkAppointmentConflict } from "@/lib/firestore-service";
import type { Patient, Visit, Appointment } from "@/lib/types";

const PHONE_REGEX = /^[0-9]{10,13}$/;
const BUSINESS_START = 8;
const BUSINESS_END = 22;

function EditPatientSheet({
  patient,
  onSaved,
}: {
  patient: Patient;
  onSaved: (p: Patient) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(patient.name);
  const [age, setAge] = React.useState(String(patient.age));
  const [gender, setGender] = React.useState<Patient["gender"]>(patient.gender);
  const [phone, setPhone] = React.useState(patient.phone);
  const [allergies, setAllergies] = React.useState(patient.allergies);
  const [conditions, setConditions] = React.useState(patient.chronicConditions);

  const save = async () => {
    if (!user || !name.trim()) return;
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      toast.error("Age 0 se 150 ke darmiyan honi chahiye");
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      toast.error("Phone number 10-13 digits ka hona chahiye");
      return;
    }
    const updated: Patient = {
      ...patient,
      name: name.trim(),
      age: parsedAge,
      gender,
      phone: cleanPhone,
      allergies: allergies.trim(),
      chronicConditions: conditions.trim(),
    };
    await savePatient(user.uid, updated);
    toast.success("Patient update ho gaya");
    onSaved(updated);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Pencil className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Patient edit karein</SheetTitle>
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Poora naam</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="edit-age">Age</Label>
              <Input id="edit-age" type="number" min={0} max={150} value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-gender">Gender</Label>
              <select
                id="edit-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as Patient["gender"])}
                className="flex h-11 w-full rounded-md border border-border-strong bg-surface px-3.5 text-[15px] text-ink focus-visible:outline-none focus-visible:border-petrol focus-visible:ring-2 focus-visible:ring-petrol-light"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-allergies">Allergy</Label>
            <Input id="edit-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-conditions">Purani bemariyan</Label>
            <Input id="edit-conditions" value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </div>
          <Button className="w-full" size="lg" onClick={save}>
            Update karein
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BookAppointmentSheet({ patient }: { patient: Patient }) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState("");
  const [time, setTime] = React.useState("10:00");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!user || !date) {
      toast.error("Date zaroor select karein");
      return;
    }
    const h = parseInt(time.split(":")[0], 10);
    if (h < BUSINESS_START || h >= BUSINESS_END) {
      toast.error(`Appointment sirf ${BUSINESS_START}:00 se ${BUSINESS_END}:00 ke darmiyan ho sakti hai`);
      return;
    }
    setSaving(true);
    try {
      const conflict = await checkAppointmentConflict(user.uid, date, time);
      if (conflict) {
        toast.error(`Is waqt pehle se ${conflict.patientName} ki appointment hai`);
        setSaving(false);
        return;
      }
      const appt: Appointment = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        patientName: patient.name,
        patientPhone: patient.phone,
        date,
        time,
        reason: reason.trim(),
        status: "scheduled",
        createdAt: new Date().toISOString(),
      };
      await saveAppointment(user.uid, appt);
      toast.success("Appointment set ho gayi");
      setOpen(false);
      setDate("");
      setReason("");
    } catch {
      toast.error("Save nahi ho saka");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" size="sm">
          <CalendarPlus className="size-3.5" />
          Appointment
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetTitle>Appointment — {patient.name}</SheetTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bk-date">Date</Label>
              <Input id="bk-date" type="date" min={new Date().toISOString().split("T")[0]} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="bk-time">Time</Label>
              <Input id="bk-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="bk-reason">Wajah / notes</Label>
            <Input id="bk-reason" placeholder="Follow-up, lab results..." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? "Save ho raha hai..." : "Appointment save karein"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function VitalsChart({ visits }: { visits: Visit[] }) {
  const vitalsData = visits
    .filter((v) => v.parsedVitals && (v.parsedVitals.bp || v.parsedVitals.weight || v.parsedVitals.temp))
    .reverse();

  if (vitalsData.length < 2) return null;

  return (
    <div className="mb-5">
      <h2 className="mb-3 text-[15px] font-medium text-ink flex items-center gap-1.5">
        <TrendingUp className="size-4" />
        Vitals ka record
      </h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-ink-muted">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">BP</th>
              <th className="px-3 py-2 font-medium">Temp</th>
              <th className="px-3 py-2 font-medium">Weight</th>
              <th className="px-3 py-2 font-medium">Pulse</th>
            </tr>
          </thead>
          <tbody>
            {vitalsData.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-ink-muted whitespace-nowrap">{v.date.split(",")[0]}</td>
                <td className="px-3 py-2 text-ink">{v.parsedVitals?.bp || "—"}</td>
                <td className="px-3 py-2 text-ink">{v.parsedVitals?.temp || "—"}</td>
                <td className="px-3 py-2 text-ink">{v.parsedVitals?.weight || "—"}</td>
                <td className="px-3 py-2 text-ink">{v.parsedVitals?.pulse || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PatientDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [visits, setVisits] = React.useState<Visit[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    Promise.all([getPatient(user.uid, params.id), getVisits(user.uid, params.id)]).then(
      ([p, v]) => {
        setPatient(p);
        setVisits(v);
        setLoading(false);
      }
    );
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!user || !patient) return;
    if (!confirm("Kya aap is patient ko delete karna chahte hain? Saari visits aur appointments bhi delete ho jayein gi.")) return;
    setDeleting(true);
    try {
      await deletePatient(user.uid, patient.id);
      toast.success("Patient aur uski saari history delete ho gayi");
      router.replace("/patients");
    } catch {
      toast.error("Delete nahi ho saka");
      setDeleting(false);
    }
  };

  if (loading || !patient) {
    return (
      <AppShell>
        <div className="h-32 animate-pulse rounded-lg bg-petrol-light/50" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-petrol-light text-lg font-medium text-petrol-dark">
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium text-ink">{patient.name}</h1>
          <p className="text-[13px] text-ink-muted">
            {patient.age} yrs · {patient.gender} · {patient.phone}
          </p>
        </div>
        <BookAppointmentSheet patient={patient} />
        <EditPatientSheet patient={patient} onSaved={setPatient} />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-danger hover:bg-danger-light hover:text-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {(patient.allergies || patient.chronicConditions) && (
        <div className="mb-5 space-y-2">
          {patient.allergies && (
            <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger-light px-3.5 py-2.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
              <p className="text-[14px] text-danger">
                <span className="font-medium">Allergy: </span>
                {patient.allergies}
              </p>
            </div>
          )}
          {patient.chronicConditions && (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3.5 py-2.5">
              <Stethoscope className="mt-0.5 size-4 shrink-0 text-ink-muted" />
              <p className="text-[14px] text-ink-muted">
                <span className="font-medium text-ink">Purani bemariyan: </span>
                {patient.chronicConditions}
              </p>
            </div>
          )}
        </div>
      )}

      <VitalsChart visits={visits} />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-ink">Checkup ki taareekh</h2>
        <div className="flex items-center gap-2">
          {visits.length > 0 && (
            <Link href={`/patients/${patient.id}/history`}>
              <Button variant="ghost" size="sm">
                <FileText className="size-3.5" />
                Poori history
              </Button>
            </Link>
          )}
          <Badge variant="outline">{visits.length}</Badge>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong py-12 text-center">
          <p className="text-ink-muted">Abhi koi checkup nahi hua</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visits.map((v) => (
            <li key={v.id}>
              <Link
                href={`/patients/${patient.id}/visit/${v.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5 hover:border-petrol/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">
                    {v.diagnosis || v.complaint || "Checkup"}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {v.date} · {v.items.length} dawa{v.items.length === 1 ? "" : "yein"}
                    {v.followUpDate ? ` · Follow-up: ${v.followUpDate}` : ""}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-ink-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link href={`/patients/${patient.id}/visit/new`} className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8">
        <Button size="lg" className="rounded-full shadow-lg">
          <Plus className="size-5" />
          Naya checkup
        </Button>
      </Link>
    </AppShell>
  );
}

export default function PatientDetailPage() {
  return (
    <RequireAuth>
      <PatientDetailContent />
    </RequireAuth>
  );
}
