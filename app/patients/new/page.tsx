"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { savePatient, findDuplicatePatient } from "@/lib/firestore-service";
import type { Patient } from "@/lib/types";

const PHONE_REGEX = /^[0-9]{10,13}$/;

function NewPatientContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState<Patient["gender"]>("Male");
  const [phone, setPhone] = React.useState("");
  const [allergies, setAllergies] = React.useState("");
  const [conditions, setConditions] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    if (!user || !name.trim() || !age.trim() || !phone.trim()) {
      toast.error("Name, age aur phone zaroori hai");
      return;
    }
    const parsedAge = parseInt(age, 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      toast.error("Age 0 se 150 ke darmiyan honi chahiye");
      return;
    }
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
    if (!PHONE_REGEX.test(cleanPhone)) {
      toast.error("Phone number 10-13 digits ka hona chahiye");
      return;
    }

    setSaving(true);
    try {
      const duplicate = await findDuplicatePatient(user.uid, name, cleanPhone);
      if (duplicate) {
        const proceed = confirm(
          `"${duplicate.name}" (${duplicate.phone}) pehle se registered hai. Kya phir bhi naya patient register karna chahte hain?`
        );
        if (!proceed) {
          setSaving(false);
          return;
        }
      }

      const patient: Patient = {
        id: uuid(),
        name: name.trim(),
        age: parsedAge,
        gender,
        phone: cleanPhone,
        allergies: allergies.trim(),
        chronicConditions: conditions.trim(),
        createdAt: new Date().toISOString(),
      };
      await savePatient(user.uid, patient);
      toast.success("Patient register ho gaya");
      router.push(`/patients/${patient.id}`);
    } catch {
      toast.error("Save nahi ho saka - connection check karein");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <h1 className="mb-5 text-xl font-medium text-ink">Register patient</h1>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div>
            <Label htmlFor="name">Poora naam</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                inputMode="numeric"
                min={0}
                max={150}
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
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
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="03001234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="allergies">Allergy (agar koi ho)</Label>
            <Input
              id="allergies"
              placeholder="Maslan Penicillin, Sulfa"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="conditions">Purani bemariyan</Label>
            <Input
              id="conditions"
              placeholder="Maslan Sugar, BP"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
          </div>
          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? "Mehfooz ho raha hai..." : "Patient save karein"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default function NewPatientPage() {
  return (
    <RequireAuth>
      <NewPatientContent />
    </RequireAuth>
  );
}
