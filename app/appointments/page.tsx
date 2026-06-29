"use client";

import * as React from "react";
import Link from "next/link";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  Search,
  Pencil,
  CalendarOff,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  getAppointments,
  saveAppointment,
  deleteAppointment,
  getPatients,
  checkAppointmentConflict,
} from "@/lib/firestore-service";
import type { Appointment, Patient } from "@/lib/types";

const BUSINESS_START = 8;
const BUSINESS_END = 22;

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime12(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function statusBadge(status: Appointment["status"]) {
  switch (status) {
    case "completed":
      return <Badge variant="neutral">Checkup ho gaya</Badge>;
    case "cancelled":
      return <Badge variant="danger">Cancel</Badge>;
    default:
      return <Badge variant="gold">Scheduled</Badge>;
  }
}

function validateBusinessHours(time: string): boolean {
  const h = parseInt(time.split(":")[0], 10);
  return h >= BUSINESS_START && h < BUSINESS_END;
}

function AppointmentSheet({
  selectedDate,
  onSaved,
  editing,
  onClose,
}: {
  selectedDate: string;
  onSaved: () => void;
  editing?: Appointment | null;
  onClose?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [patientQuery, setPatientQuery] = React.useState("");
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [date, setDate] = React.useState(selectedDate);
  const [time, setTime] = React.useState("10:00");
  const [reason, setReason] = React.useState("");
  const [manualName, setManualName] = React.useState("");
  const [manualPhone, setManualPhone] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (editing) {
      setOpen(true);
      setDate(editing.date);
      setTime(editing.time);
      setReason(editing.reason);
      setManualName(editing.patientName);
      setManualPhone(editing.patientPhone);
    }
  }, [editing]);

  React.useEffect(() => {
    if (!editing) setDate(selectedDate);
  }, [selectedDate, editing]);

  React.useEffect(() => {
    if (!open || !user) return;
    getPatients(user.uid).then(setPatients);
  }, [open, user]);

  const filteredPatients = patientQuery.trim()
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(patientQuery.toLowerCase()) ||
          p.phone.includes(patientQuery)
      )
    : [];

  const reset = () => {
    setSelectedPatient(null);
    setPatientQuery("");
    setManualName("");
    setManualPhone("");
    setTime("10:00");
    setReason("");
  };

  const save = async () => {
    if (!user) return;
    const pName = selectedPatient?.name || manualName.trim();
    const pPhone = selectedPatient?.phone || manualPhone.trim();
    if (!pName) {
      toast.error("Patient ka naam zaroori hai");
      return;
    }
    if (!validateBusinessHours(time)) {
      toast.error(`Appointment sirf ${BUSINESS_START}:00 se ${BUSINESS_END}:00 ke darmiyan ho sakti hai`);
      return;
    }

    setSaving(true);
    try {
      const conflict = await checkAppointmentConflict(user.uid, date, time, editing?.id);
      if (conflict) {
        toast.error(`Is waqt ${formatTime12(time)} par pehle se ${conflict.patientName} ki appointment hai`);
        setSaving(false);
        return;
      }

      const appt: Appointment = {
        id: editing?.id ?? uuid(),
        patientId: selectedPatient?.id ?? editing?.patientId ?? "",
        patientName: pName,
        patientPhone: pPhone,
        date,
        time,
        reason: reason.trim(),
        status: editing?.status ?? "scheduled",
        createdAt: editing?.createdAt ?? new Date().toISOString(),
      };
      await saveAppointment(user.uid, appt);
      toast.success(editing ? "Appointment update ho gayi" : "Appointment set ho gayi");
      reset();
      setOpen(false);
      onClose?.();
      onSaved();
    } catch {
      toast.error("Save nahi ho saka - connection check karein");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          reset();
          onClose?.();
        }
      }}
    >
      {!editing && (
        <SheetTrigger asChild>
          <Button size="icon" className="fixed bottom-24 right-6 size-14 rounded-full shadow-lg sm:bottom-8 sm:right-8">
            <Plus className="size-6" />
          </Button>
        </SheetTrigger>
      )}
      <SheetContent>
        <SheetTitle>{editing ? "Appointment edit karein" : "Nayi appointment"}</SheetTitle>
        <div className="space-y-4">
          {editing ? (
            <div className="flex items-center gap-3 rounded-lg border border-petrol/30 bg-petrol-light px-3.5 py-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-petrol-dark/10 font-medium text-petrol-dark text-[13px]">
                {(selectedPatient?.name || manualName || "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-ink">{selectedPatient?.name || manualName}</p>
                <p className="text-[12px] text-ink-muted">{selectedPatient?.phone || manualPhone}</p>
              </div>
            </div>
          ) : selectedPatient ? (
            <div className="flex items-center gap-3 rounded-lg border border-petrol/30 bg-petrol-light px-3.5 py-2.5">
              <div className="flex size-8 items-center justify-center rounded-full bg-petrol-dark/10 font-medium text-petrol-dark text-[13px]">
                {selectedPatient.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium text-ink">{selectedPatient.name}</p>
                <p className="text-[12px] text-ink-muted">{selectedPatient.phone}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPatient(null);
                  setPatientQuery("");
                }}
              >
                Badlein
              </Button>
            </div>
          ) : (
            <div>
              <Label>Patient dhundhein</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
                <Input
                  placeholder="Naam ya phone..."
                  className="pl-9"
                  value={patientQuery}
                  onChange={(e) => setPatientQuery(e.target.value)}
                />
              </div>
              {filteredPatients.length > 0 && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
                  {filteredPatients.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPatient(p);
                        setPatientQuery("");
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left hover:bg-petrol-light"
                    >
                      <span className="text-[14px] font-medium text-ink">{p.name}</span>
                      <span className="text-[12px] text-ink-muted">{p.phone}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 rounded-lg border border-dashed border-border-strong p-3">
                <p className="mb-2 text-[12px] text-ink-muted">Ya naya patient likhein:</p>
                <div className="space-y-2">
                  <Input
                    placeholder="Patient ka naam"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone number"
                    type="tel"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="appt-date">Date</Label>
              <Input
                id="appt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="appt-time">Time</Label>
              <Input
                id="appt-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="appt-reason">Wajah / notes</Label>
            <Input
              id="appt-reason"
              placeholder="Maslan follow-up, lab results, naya checkup"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? "Save ho raha hai..." : editing ? "Update karein" : "Appointment save karein"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WeekStrip({
  selectedDate,
  onSelect,
  appointmentCounts,
}: {
  selectedDate: string;
  onSelect: (d: string) => void;
  appointmentCounts: Record<string, number>;
}) {
  const [weekStart, setWeekStart] = React.useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const todayStr = formatDate(new Date());

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" onClick={prevWeek} className="size-8">
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-[14px] font-medium text-ink">
          {days[0].toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
        </p>
        <Button variant="ghost" size="icon" onClick={nextWeek} className="size-8">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const ds = formatDate(d);
          const isSelected = ds === selectedDate;
          const isToday = ds === todayStr;
          const count = appointmentCounts[ds] || 0;
          return (
            <button
              key={ds}
              type="button"
              onClick={() => onSelect(ds)}
              className={`flex flex-col items-center rounded-lg py-2 text-center transition-colors ${
                isSelected
                  ? "bg-petrol text-white"
                  : isToday
                    ? "border border-petrol/40 bg-petrol-light text-petrol-dark"
                    : "border border-border text-ink-muted hover:border-petrol/40"
              }`}
            >
              <span className="text-[11px] uppercase">
                {d.toLocaleDateString("en", { weekday: "short" })}
              </span>
              <span className="text-[16px] font-medium">{d.getDate()}</span>
              {count > 0 && (
                <span
                  className={`mt-0.5 size-1.5 rounded-full ${
                    isSelected ? "bg-white" : "bg-gold"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppointmentsContent() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState(formatDate(new Date()));
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = React.useState<Appointment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingAppt, setEditingAppt] = React.useState<Appointment | null>(null);

  const loadAll = React.useCallback(async () => {
    if (!user) return;
    const all = await getAppointments(user.uid);
    setAllAppointments(all);
    setAppointments(all.filter((a) => a.date === selectedDate));
    setLoading(false);
  }, [user, selectedDate]);

  React.useEffect(() => {
    loadAll();
  }, [loadAll]);

  React.useEffect(() => {
    setAppointments(allAppointments.filter((a) => a.date === selectedDate));
  }, [selectedDate, allAppointments]);

  const appointmentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of allAppointments) {
      if (a.status !== "cancelled") {
        counts[a.date] = (counts[a.date] || 0) + 1;
      }
    }
    return counts;
  }, [allAppointments]);

  const updateStatus = async (appt: Appointment, status: Appointment["status"]) => {
    if (!user) return;
    if (appt.status === "cancelled" && status === "completed") {
      toast.error("Cancel shuda appointment complete nahi ho sakti");
      return;
    }
    const updated = { ...appt, status };
    await saveAppointment(user.uid, updated);
    toast.success(status === "completed" ? "Checkup ho gaya" : "Appointment cancel ho gayi");
    loadAll();
  };

  const remove = async (id: string) => {
    if (!user) return;
    if (!confirm("Appointment delete karein?")) return;
    await deleteAppointment(user.uid, id);
    toast.success("Appointment delete ho gayi");
    loadAll();
  };

  const scheduled = appointments.filter((a) => a.status === "scheduled");
  const completed = appointments.filter((a) => a.status === "completed");
  const cancelled = appointments.filter((a) => a.status === "cancelled");

  return (
    <AppShell>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Appointments</h1>
        <Badge variant="outline">
          {appointments.filter((a) => a.status !== "cancelled").length} patients
        </Badge>
      </div>

      <WeekStrip
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        appointmentCounts={appointmentCounts}
      />

      <p className="mb-3 text-[14px] font-medium text-ink">{formatDateDisplay(selectedDate)}</p>

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-lg bg-petrol-light/50" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-strong py-16 text-center">
          <CalendarOff className="mx-auto mb-3 size-8 text-ink-faint" />
          <p className="text-ink-muted">Is din koi appointment nahi hai</p>
          <p className="mt-1 text-[13px] text-ink-faint">+ button daba kar nayi appointment banayein</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduled.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-muted uppercase tracking-wide">Scheduled</p>
              <ul className="space-y-2">
                {scheduled.map((a) => (
                  <li
                    key={a.id}
                    className="rounded-lg border border-border bg-surface p-3.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold/10 font-medium text-gold text-[14px]">
                          {a.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {a.patientId ? (
                              <Link
                                href={`/patients/${a.patientId}`}
                                className="font-medium text-ink hover:text-petrol"
                              >
                                {a.patientName}
                              </Link>
                            ) : (
                              <p className="font-medium text-ink">{a.patientName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                            <Clock className="size-3" />
                            {formatTime12(a.time)}
                            {a.patientPhone && (
                              <>
                                <Phone className="size-3 ml-1" />
                                {a.patientPhone}
                              </>
                            )}
                          </div>
                          {a.reason && (
                            <p className="mt-1 text-[12px] text-ink-faint">{a.reason}</p>
                          )}
                        </div>
                      </div>
                      {statusBadge(a.status)}
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus(a, "completed")}
                      >
                        <CheckCircle2 className="size-3.5" />
                        Ho gaya
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => updateStatus(a, "cancelled")}
                      >
                        <XCircle className="size-3.5" />
                        Cancel
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => setEditingAppt(a)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-danger hover:bg-danger-light hover:text-danger"
                        onClick={() => remove(a.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-muted uppercase tracking-wide">Completed</p>
              <ul className="space-y-2">
                {completed.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 p-3.5 opacity-75"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-petrol-light font-medium text-petrol-dark text-[14px]">
                      {a.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{a.patientName}</p>
                      <p className="text-[13px] text-ink-muted">
                        {formatTime12(a.time)}
                        {a.reason ? ` · ${a.reason}` : ""}
                      </p>
                    </div>
                    {statusBadge(a.status)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {cancelled.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink-muted uppercase tracking-wide">Cancelled</p>
              <ul className="space-y-2">
                {cancelled.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-surface/40 p-3.5 opacity-50"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-light font-medium text-danger text-[14px]">
                      {a.patientName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink line-through">{a.patientName}</p>
                      <p className="text-[13px] text-ink-muted">{formatTime12(a.time)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-danger"
                      onClick={() => remove(a.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <AppointmentSheet selectedDate={selectedDate} onSaved={loadAll} />
      {editingAppt && (
        <AppointmentSheet
          selectedDate={selectedDate}
          onSaved={loadAll}
          editing={editingAppt}
          onClose={() => setEditingAppt(null)}
        />
      )}
    </AppShell>
  );
}

export default function AppointmentsPage() {
  return (
    <RequireAuth>
      <AppointmentsContent />
    </RequireAuth>
  );
}
