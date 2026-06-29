"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Plus, ChevronRight, AlertCircle, Users, CalendarCheck, Clock, CalendarDays } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { SyncStatus } from "@/components/sync-status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPatients, getDashboardStats, getAppointmentsByDate } from "@/lib/firestore-service";
import type { Patient, Appointment } from "@/lib/types";

function formatFollowUp(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex size-9 items-center justify-center rounded-full bg-petrol-light">
        <Icon className="size-4 text-petrol-dark" />
      </div>
      <div>
        <p className="text-[20px] font-medium text-ink leading-tight">{value}</p>
        <p className="text-[12px] text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

function PatientsContent() {
  const { user } = useAuth();
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [todayCount, setTodayCount] = React.useState(0);
  const [followUps, setFollowUps] = React.useState<{ patientName: string; followUpDate: string; patientId: string }[]>([]);
  const [todayAppointments, setTodayAppointments] = React.useState<Appointment[]>([]);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>(null);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(value), 200);
  };

  React.useEffect(() => {
    if (!user) return;

    const todayISO = new Date().toISOString().split("T")[0];

    getPatients(user.uid).then((pts) => {
      setPatients(pts);
      setLoading(false);
    });

    getAppointmentsByDate(user.uid, todayISO).then((appts) =>
      setTodayAppointments(appts.filter((a) => a.status === "scheduled"))
    );

    getDashboardStats(user.uid).then(({ todayCount: tc, followUps: fu }) => {
      setTodayCount(tc);
      setFollowUps(fu);
    });
  }, [user]);

  const filtered = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      p.phone.includes(debouncedQuery)
  );

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Dashboard</h1>
        <SyncStatus />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={Users} label="Total patients" value={patients.length} />
        <StatCard icon={CalendarCheck} label="Aaj ke checkup" value={todayCount} />
        <StatCard icon={CalendarDays} label="Aaj appointments" value={todayAppointments.length} />
      </div>

      {todayAppointments.length > 0 && (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-ink flex items-center gap-1.5">
              <CalendarDays className="size-4 text-petrol" />
              Aaj ki appointments
            </h2>
            <Link href="/appointments">
              <Button variant="ghost" size="sm">Sab dekhein</Button>
            </Link>
          </div>
          <div className="space-y-1.5">
            {todayAppointments.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {a.patientId ? (
                    <Link href={`/patients/${a.patientId}`} className="text-[14px] text-ink font-medium hover:text-petrol">
                      {a.patientName}
                    </Link>
                  ) : (
                    <p className="text-[14px] text-ink font-medium">{a.patientName}</p>
                  )}
                  {a.reason && <span className="text-[12px] text-ink-muted">· {a.reason}</span>}
                </div>
                <Badge variant="gold">
                  {(() => { const [h,m] = a.time.split(":").map(Number); return `${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`; })()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {followUps.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-2 text-[15px] font-medium text-ink flex items-center gap-1.5">
            <Clock className="size-4 text-gold" />
            Aanay wale follow-ups
          </h2>
          <div className="space-y-1.5">
            {followUps.slice(0, 5).map((f, i) => (
              <Link
                key={i}
                href={`/patients/${f.patientId}`}
                className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-2.5 hover:border-petrol/40"
              >
                <p className="text-[14px] text-ink">{f.patientName}</p>
                <Badge variant="gold">{formatFollowUp(f.followUpDate)}</Badge>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-[15px] font-medium text-ink">Patients</h2>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          placeholder="Naam ya phone se talaash karein"
          className="pl-10"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-lg bg-petrol-light/50" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong py-16 text-center">
          <p className="text-ink-muted">
            {patients.length === 0
              ? "Abhi koi patient nahi. Pehla patient register karein."
              : "Is talaash ka koi nateeja nahi mila."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li key={p.id}>
              <Link
                href={`/patients/${p.id}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3.5 transition-colors hover:border-petrol/40"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-petrol-light font-medium text-petrol-dark">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    {p.allergies && (
                      <AlertCircle className="size-3.5 shrink-0 text-danger" />
                    )}
                  </div>
                  <p className="truncate text-[13px] text-ink-muted">
                    {p.age} yrs · {p.gender} · {p.phone}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-ink-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/patients/new"
        className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8"
      >
        <Button size="icon" className="size-14 rounded-full shadow-lg">
          <Plus className="size-6" />
        </Button>
      </Link>
    </AppShell>
  );
}

export default function PatientsPage() {
  return (
    <RequireAuth>
      <PatientsContent />
    </RequireAuth>
  );
}
