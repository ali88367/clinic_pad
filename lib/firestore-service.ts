import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fsLimit,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Patient, Visit, Drug, RxTemplate, ClinicProfile, DrugUsage, Appointment } from "@/lib/types";

// ---------------- Patients ----------------

export async function getPatients(doctorId: string): Promise<Patient[]> {
  const ref = collection(db, "doctors", doctorId, "patients");
  const snap = await getDocs(query(ref, orderBy("name")));
  return snap.docs.map((d) => d.data() as Patient);
}

export async function getPatient(doctorId: string, patientId: string): Promise<Patient | null> {
  const ref = doc(db, "doctors", doctorId, "patients", patientId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Patient) : null;
}

export async function savePatient(doctorId: string, patient: Patient): Promise<void> {
  const ref = doc(db, "doctors", doctorId, "patients", patient.id);
  await setDoc(ref, patient);
}

export async function findDuplicatePatient(
  doctorId: string,
  name: string,
  phone: string,
  excludeId?: string
): Promise<Patient | null> {
  const patients = await getPatients(doctorId);
  const normalName = name.trim().toLowerCase();
  const normalPhone = phone.trim();
  return (
    patients.find(
      (p) =>
        p.id !== excludeId &&
        (p.phone === normalPhone ||
          p.name.toLowerCase() === normalName)
    ) ?? null
  );
}

export async function deletePatient(doctorId: string, patientId: string): Promise<void> {
  const batch = writeBatch(db);

  const visitsRef = collection(db, "doctors", doctorId, "patients", patientId, "visits");
  const visitSnap = await getDocs(visitsRef);
  visitSnap.docs.forEach((d) => batch.delete(d.ref));

  batch.delete(doc(db, "doctors", doctorId, "patients", patientId));

  const apptsRef = collection(db, "doctors", doctorId, "appointments");
  const apptSnap = await getDocs(apptsRef);
  apptSnap.docs.forEach((d) => {
    if ((d.data() as Appointment).patientId === patientId) {
      batch.delete(d.ref);
    }
  });

  await batch.commit();
}

// ---------------- Visits ----------------

export async function getVisits(doctorId: string, patientId: string): Promise<Visit[]> {
  const ref = collection(db, "doctors", doctorId, "patients", patientId, "visits");
  const snap = await getDocs(query(ref, orderBy("date", "desc")));
  return snap.docs.map((d) => d.data() as Visit);
}

export async function getVisit(
  doctorId: string,
  patientId: string,
  visitId: string
): Promise<Visit | null> {
  const ref = doc(db, "doctors", doctorId, "patients", patientId, "visits", visitId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Visit) : null;
}

export async function saveVisit(doctorId: string, visit: Visit): Promise<void> {
  const ref = doc(db, "doctors", doctorId, "patients", visit.patientId, "visits", visit.id);
  await setDoc(ref, visit);
}

export async function deleteVisit(doctorId: string, patientId: string, visitId: string): Promise<void> {
  await deleteDoc(doc(db, "doctors", doctorId, "patients", patientId, "visits", visitId));
}

// ---------------- Dashboard stats ----------------

export async function getDashboardStats(
  doctorId: string
): Promise<{
  todayCount: number;
  totalVisits: number;
  followUps: { patientName: string; followUpDate: string; patientId: string }[];
}> {
  const patients = await getPatients(doctorId);
  const todayFormatted = new Date().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const todayISO = new Date().toISOString().split("T")[0];

  const visitFetches = patients.map((p) =>
    getVisits(doctorId, p.id).then((visits) => ({ patient: p, visits }))
  );
  const results = await Promise.all(visitFetches);

  let todayCount = 0;
  let totalVisits = 0;
  const followUps: { patientName: string; followUpDate: string; patientId: string }[] = [];

  for (const { patient, visits } of results) {
    totalVisits += visits.length;
    todayCount += visits.filter((v) => v.date.startsWith(todayFormatted)).length;
    for (const v of visits) {
      if (v.followUpDate && v.followUpDate >= todayISO) {
        followUps.push({
          patientName: patient.name,
          followUpDate: v.followUpDate,
          patientId: patient.id,
        });
      }
    }
  }

  followUps.sort((a, b) => a.followUpDate.localeCompare(b.followUpDate));
  return { todayCount, totalVisits, followUps };
}

// ---------------- Favourite drugs (doctor-scoped) ----------------

export async function getFavouriteDrugs(doctorId: string): Promise<DrugUsage[]> {
  const ref = collection(db, "doctors", doctorId, "drugUsage");
  const snap = await getDocs(query(ref, orderBy("count", "desc"), fsLimit(10)));
  return snap.docs.map((d) => d.data() as DrugUsage);
}

export async function trackDrugUsage(doctorId: string, drugName: string, dosage: string, frequency: string): Promise<void> {
  const id = drugName.toLowerCase().replace(/\s+/g, "-");
  const ref = doc(db, "doctors", doctorId, "drugUsage", id);
  const snap = await getDoc(ref);
  const current = snap.exists() ? (snap.data() as DrugUsage) : { drugName, dosage, frequency, count: 0 };
  await setDoc(ref, { ...current, drugName, dosage, frequency, count: current.count + 1 });
}

// ---------------- Drugs (shared master list, cached) ----------------

let drugCache: Drug[] | null = null;

export async function searchDrugs(query_: string): Promise<Drug[]> {
  if (!drugCache) {
    const ref = collection(db, "drugs");
    const snap = await getDocs(query(ref, fsLimit(500)));
    drugCache = snap.docs.map((d) => d.data() as Drug);
  }
  if (!query_) return drugCache.slice(0, 20);
  const q = query_.toLowerCase();
  return drugCache.filter(
    (d) =>
      d.brandName.toLowerCase().includes(q) || d.genericName.toLowerCase().includes(q)
  );
}

// ---------------- Rx templates (doctor-scoped) ----------------

export async function getTemplates(doctorId: string): Promise<RxTemplate[]> {
  const ref = collection(db, "doctors", doctorId, "templates");
  const snap = await getDocs(query(ref, orderBy("name")));
  return snap.docs.map((d) => d.data() as RxTemplate);
}

export async function saveTemplate(doctorId: string, template: RxTemplate): Promise<void> {
  const ref = doc(db, "doctors", doctorId, "templates", template.id);
  await setDoc(ref, template);
}

export async function deleteTemplate(doctorId: string, templateId: string): Promise<void> {
  await deleteDoc(doc(db, "doctors", doctorId, "templates", templateId));
}

// ---------------- Appointments (doctor-scoped) ----------------

export async function getAppointments(doctorId: string): Promise<Appointment[]> {
  const ref = collection(db, "doctors", doctorId, "appointments");
  const snap = await getDocs(ref);
  const all = snap.docs.map((d) => d.data() as Appointment);
  return all.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export async function getAppointmentsByDate(doctorId: string, date: string): Promise<Appointment[]> {
  const all = await getAppointments(doctorId);
  return all.filter((a) => a.date === date);
}

export async function checkAppointmentConflict(
  doctorId: string,
  date: string,
  time: string,
  excludeId?: string
): Promise<Appointment | null> {
  const dayAppts = await getAppointmentsByDate(doctorId, date);
  return (
    dayAppts.find(
      (a) => a.time === time && a.status === "scheduled" && a.id !== excludeId
    ) ?? null
  );
}

export async function saveAppointment(doctorId: string, appointment: Appointment): Promise<void> {
  const ref = doc(db, "doctors", doctorId, "appointments", appointment.id);
  await setDoc(ref, appointment);
}

export async function deleteAppointment(doctorId: string, appointmentId: string): Promise<void> {
  await deleteDoc(doc(db, "doctors", doctorId, "appointments", appointmentId));
}

// ---------------- Clinic profile (one doc per doctor) ----------------

export async function getClinicProfile(doctorId: string): Promise<ClinicProfile | null> {
  const ref = doc(db, "doctors", doctorId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ClinicProfile) : null;
}

export async function saveClinicProfile(doctorId: string, profile: ClinicProfile): Promise<void> {
  const ref = doc(db, "doctors", doctorId);
  await setDoc(ref, profile, { merge: true });
}
