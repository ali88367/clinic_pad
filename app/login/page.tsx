"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) router.replace("/patients");
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/patients");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
        setError("Email ya password ghalat hai.");
      } else if (code === "auth/email-already-in-use") {
        setError("Yeh email pehle se registered hai. Sign in karein.");
      } else if (code === "auth/weak-password") {
        setError("Password kam az kam 6 characters ka hona chahiye.");
      } else if (code === "auth/invalid-email") {
        setError("Sahih email address likhein.");
      } else {
        setError("Kuch ghalat ho gaya. Dobara koshish karein.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="flex items-baseline justify-center gap-1">
            <span className="font-serif text-[28px] font-medium tracking-tight text-ink">
              Clinic
            </span>
            <span className="font-serif text-[28px] font-medium text-gold">Pad</span>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Nuskhe aur mareezon ka record, baghair kaghaz ke.
          </p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={busy || !email || !password}
              >
                {busy
                  ? mode === "signup"
                    ? "Account ban raha hai..."
                    : "Sign in ho raha hai..."
                  : mode === "signup"
                    ? "Account banayein"
                    : "Sign in karein"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-petrol hover:underline"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                }}
              >
                {mode === "login"
                  ? "Account nahi hai? Sign up karein"
                  : "Pehle se account hai? Sign in karein"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
