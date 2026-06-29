"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Printer, Share2, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getPatient, getVisit, getClinicProfile, deleteVisit } from "@/lib/firestore-service";
import type { Patient, Visit, ClinicProfile } from "@/lib/types";

function shareText(clinic: ClinicProfile | null, patient: Patient, visit: Visit) {
  const lines = [
    clinic?.doctorName || "Doctor",
    clinic?.clinicName,
    "",
    `Patient: ${patient.name} (${patient.age} yrs / ${patient.gender})`,
    visit.date,
    visit.diagnosis ? `Bimari: ${visit.diagnosis}` : "",
    "",
    "Rx",
    ...visit.items.map(
      (item, i) =>
        `${i + 1}. ${item.drugName} ${item.dosage} - ${item.frequency}, ${item.duration}${
          item.quantity ? ` — Qty: ${item.quantity}` : ""
        }${item.instructions ? ` (${item.instructions})` : ""}`
    ),
    visit.notes ? `\nMashwara: ${visit.notes}` : "",
    visit.followUpDate ? `\nFollow-up: ${visit.followUpDate}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

function PrescriptionPreviewContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string; visitId: string }>();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [visit, setVisit] = React.useState<Visit | null>(null);
  const [clinic, setClinic] = React.useState<ClinicProfile | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    Promise.all([
      getPatient(user.uid, params.id),
      getVisit(user.uid, params.id, params.visitId),
      getClinicProfile(user.uid),
    ]).then(([p, v, c]) => {
      setPatient(p);
      setVisit(v);
      setClinic(c);
    });
  }, [user, params.id, params.visitId]);

  const share = async () => {
    if (!patient || !visit) return;
    const text = shareText(clinic, patient, visit);
    if (navigator.share) {
      try {
        await navigator.share({ text, title: `Rx - ${patient.name}` });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(text);
    toast.success("Copy ho gaya - WhatsApp mein paste karein");
  };

  const handleEdit = () => {
    router.push(`/patients/${params.id}/visit/new?edit=${params.visitId}`);
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Kya aap yeh checkup delete karna chahte hain?")) return;
    setDeleting(true);
    try {
      await deleteVisit(user.uid, params.id, params.visitId);
      toast.success("Checkup delete ho gaya");
      router.replace(`/patients/${params.id}`);
    } catch {
      toast.error("Delete nahi ho saka");
      setDeleting(false);
    }
  };

  if (!patient || !visit) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-lg bg-petrol-light/50" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="print-area mx-auto max-w-md rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="mb-3">
          <p className="font-serif text-[17px] font-medium text-ink">
            {clinic?.doctorName || "Doctor"}
          </p>
          {clinic?.qualification && <p className="text-[12px] text-ink-muted">{clinic.qualification}</p>}
          {clinic?.clinicName && <p className="text-[13px] text-ink">{clinic.clinicName}</p>}
          {clinic?.clinicAddress && <p className="text-[11px] text-ink-faint">{clinic.clinicAddress}</p>}
        </div>
        <div className="border-t border-border pt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-[14px] text-ink">
              {patient.name} <span className="text-ink-muted">({patient.age}/{patient.gender})</span>
            </p>
            <p className="text-[12px] text-ink-faint">{visit.date}</p>
          </div>
          {patient.allergies && (
            <p className="mt-1 text-[12px] font-medium text-danger">Allergy: {patient.allergies}</p>
          )}
          {visit.complaint && <p className="mt-2 text-[13px] text-ink-muted">Takleef: {visit.complaint}</p>}
          {visit.vitals && <p className="text-[13px] text-ink-muted">Vitals: {visit.vitals}</p>}
          {visit.diagnosis && <p className="text-[13px] text-ink-muted">Bimari: {visit.diagnosis}</p>}
        </div>

        <p className="font-serif mt-5 text-[22px] font-medium text-gold">Rx</p>
        <ol className="mt-2 space-y-3">
          {visit.items.map((item, i) => (
            <li key={item.id} className="text-[14px] text-ink">
              <span className="font-medium">
                {i + 1}. {item.drugName} {item.dosage}
              </span>
              <span className="text-ink-muted">
                {" "}
                — {[item.frequency, item.duration].filter(Boolean).join(", ")}
                {item.quantity ? ` — Qty: ${item.quantity}` : ""}
                {item.instructions ? ` (${item.instructions})` : ""}
              </span>
            </li>
          ))}
        </ol>

        {visit.notes && (
          <p className="mt-5 text-[13px] text-ink-muted">
            <span className="font-medium text-ink">Mashwara: </span>
            {visit.notes}
          </p>
        )}

        {visit.followUpDate && (
          <p className="mt-3 text-[13px] text-petrol font-medium">
            Follow-up: {visit.followUpDate}
          </p>
        )}

        <div className="mt-10 flex justify-end">
          <div className="text-center">
            <div className="mb-1 h-8 w-32 border-b border-ink-faint" />
            <p className="text-[11px] text-ink-faint">Dastakhat</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => window.print()}>
          <Printer className="size-4" />
          Print karein
        </Button>
        <Button className="flex-1" onClick={share}>
          <Share2 className="size-4" />
          WhatsApp par bhejein
        </Button>
      </div>

      <div className="mt-3 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={handleEdit}>
          <Pencil className="size-4" />
          Edit karein
        </Button>
        <Button
          variant="secondary"
          className="flex-1 text-danger hover:bg-danger-light hover:text-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="size-4" />
          {deleting ? "Delete ho raha hai..." : "Delete karein"}
        </Button>
      </div>
    </AppShell>
  );
}

export default function PrescriptionPreviewPage() {
  return (
    <RequireAuth>
      <PrescriptionPreviewContent />
    </RequireAuth>
  );
}
