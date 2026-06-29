"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { getPatient, getVisits, getClinicProfile } from "@/lib/firestore-service";
import type { Patient, Visit, ClinicProfile } from "@/lib/types";

function HistoryContent() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const [patient, setPatient] = React.useState<Patient | null>(null);
  const [visits, setVisits] = React.useState<Visit[]>([]);
  const [clinic, setClinic] = React.useState<ClinicProfile | null>(null);

  React.useEffect(() => {
    if (!user) return;
    Promise.all([
      getPatient(user.uid, params.id),
      getVisits(user.uid, params.id),
      getClinicProfile(user.uid),
    ]).then(([p, v, c]) => {
      setPatient(p);
      setVisits(v);
      setClinic(c);
    });
  }, [user, params.id]);

  if (!patient) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-lg bg-petrol-light/50" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="print-area mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-medium text-ink">Poori history — {patient.name}</h1>
          <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
            <Printer className="size-4" />
            Print / PDF
          </Button>
        </div>

        <div className="mb-4 rounded-lg border border-border bg-surface p-4">
          {clinic?.doctorName && (
            <p className="font-serif text-[17px] font-medium text-ink">{clinic.doctorName}</p>
          )}
          {clinic?.clinicName && <p className="text-[13px] text-ink">{clinic.clinicName}</p>}
          <div className="mt-2 border-t border-border pt-2">
            <p className="text-[14px] text-ink">
              {patient.name} — {patient.age} yrs, {patient.gender} — {patient.phone}
            </p>
            {patient.allergies && (
              <p className="text-[13px] font-medium text-danger">Allergy: {patient.allergies}</p>
            )}
            {patient.chronicConditions && (
              <p className="text-[13px] text-ink-muted">Purani bemariyan: {patient.chronicConditions}</p>
            )}
          </div>
        </div>

        {visits.length === 0 ? (
          <p className="py-12 text-center text-ink-muted">Koi visit nahi mili</p>
        ) : (
          <div className="space-y-4">
            {visits.map((v, idx) => (
              <div key={v.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-baseline justify-between mb-2">
                  <p className="font-medium text-ink">
                    Visit #{visits.length - idx}
                  </p>
                  <p className="text-[12px] text-ink-faint">{v.date}</p>
                </div>
                {v.complaint && <p className="text-[13px] text-ink-muted">Takleef: {v.complaint}</p>}
                {v.vitals && <p className="text-[13px] text-ink-muted">Vitals: {v.vitals}</p>}
                {v.diagnosis && <p className="text-[13px] text-ink-muted">Bimari: {v.diagnosis}</p>}
                {v.items.length > 0 && (
                  <>
                    <p className="mt-2 font-serif text-[16px] font-medium text-gold">Rx</p>
                    <ol className="mt-1 space-y-1">
                      {v.items.map((item, i) => (
                        <li key={item.id} className="text-[13px] text-ink">
                          <span className="font-medium">{i + 1}. {item.drugName} {item.dosage}</span>
                          <span className="text-ink-muted">
                            {" "}— {[item.frequency, item.duration].filter(Boolean).join(", ")}
                            {item.quantity ? ` — Qty: ${item.quantity}` : ""}
                            {item.instructions ? ` (${item.instructions})` : ""}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
                {v.notes && (
                  <p className="mt-2 text-[13px] text-ink-muted">
                    <span className="font-medium text-ink">Mashwara:</span> {v.notes}
                  </p>
                )}
                {v.followUpDate && (
                  <p className="mt-1 text-[13px] text-petrol font-medium">Follow-up: {v.followUpDate}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function PatientHistoryPage() {
  return (
    <RequireAuth>
      <HistoryContent />
    </RequireAuth>
  );
}
