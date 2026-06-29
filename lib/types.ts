export interface ClinicProfile {
  doctorName: string;
  qualification: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  allergies: string;
  chronicConditions: string;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

export interface Vitals {
  bp?: string;
  temp?: string;
  weight?: string;
  pulse?: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: string;
  complaint: string;
  vitals: string;
  parsedVitals?: Vitals;
  diagnosis: string;
  notes: string;
  items: PrescriptionItem[];
  followUpDate?: string;
}

export interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  commonDosage: string;
  commonFrequency: string;
}

export interface RxTemplate {
  id: string;
  name: string;
  items: PrescriptionItem[];
}

export interface DrugUsage {
  drugName: string;
  dosage: string;
  frequency: string;
  count: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}
