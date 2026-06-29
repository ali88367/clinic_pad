"use client";

import * as React from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { RequireAuth } from "@/components/require-auth";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getClinicProfile, saveClinicProfile } from "@/lib/firestore-service";
import type { ClinicProfile } from "@/lib/types";

const empty: ClinicProfile = {
  doctorName: "",
  qualification: "",
  clinicName: "",
  clinicAddress: "",
  clinicPhone: "",
};

function SettingsContent() {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<ClinicProfile>(empty);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    getClinicProfile(user.uid)
      .then((p) => setProfile(p ?? empty))
      .finally(() => setLoading(false));
  }, [user]);

  const update = (key: keyof ClinicProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((prev) => ({ ...prev, [key]: e.target.value }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveClinicProfile(user.uid, profile);
      toast.success("Clinic ki maloomat save ho gayi");
    } catch {
      toast.error("Save nahi ho saka - connection check karein");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-lg bg-petrol-light/50" />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="mb-1 text-xl font-medium text-ink">Clinic ki maloomat</h1>
      <p className="mb-5 text-[14px] text-ink-muted">
        Yeh har nuskhe par dikhega jo aap print ya share karein ge.
      </p>
      <Card>
        <CardContent className="space-y-4 pt-5">
          <div>
            <Label htmlFor="doctorName">Doctor ka naam</Label>
            <Input id="doctorName" value={profile.doctorName} onChange={update("doctorName")} />
          </div>
          <div>
            <Label htmlFor="qualification">Degree / Qualification</Label>
            <Input
              id="qualification"
              placeholder="MBBS, FCPS (Medicine)"
              value={profile.qualification}
              onChange={update("qualification")}
            />
          </div>
          <div>
            <Label htmlFor="clinicName">Clinic ka naam</Label>
            <Input id="clinicName" value={profile.clinicName} onChange={update("clinicName")} />
          </div>
          <div>
            <Label htmlFor="clinicAddress">Clinic ka pata</Label>
            <Input id="clinicAddress" value={profile.clinicAddress} onChange={update("clinicAddress")} />
          </div>
          <div>
            <Label htmlFor="clinicPhone">Clinic ka phone</Label>
            <Input id="clinicPhone" value={profile.clinicPhone} onChange={update("clinicPhone")} />
          </div>
          <Button className="w-full" size="lg" onClick={save} disabled={saving}>
            {saving ? "Save ho raha hai..." : "Mehfooz karein"}
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}
