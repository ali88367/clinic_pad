"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Settings, Zap, LogOut, CalendarDays, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const tabs = [
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/templates", label: "Templates", icon: Zap },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/patients" className="flex items-baseline gap-1">
            <span className="font-serif text-[19px] font-medium tracking-tight text-ink">
              Clinic
            </span>
            <span className="font-serif text-[19px] font-medium text-gold">Pad</span>
          </Link>

          {/* Desktop nav — hidden on mobile where bottom tabs take over */}
          <nav className="hidden items-center gap-1 sm:flex">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Button
                  key={href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={active ? "bg-petrol-light text-petrol-dark" : ""}
                >
                  <Link href={href} aria-label={label}>
                    <Icon className="size-4" />
                    <span className="hidden md:inline">{label}</span>
                  </Link>
                </Button>
              );
            })}
            <div className="ml-1 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              aria-label="Sign out"
              onClick={async () => {
                await signOut();
                router.push("/login");
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </nav>

          {/* Mobile: only show logout in header (nav is in bottom tabs) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            className="sm:hidden"
            onClick={async () => {
              await signOut();
              router.push("/login");
            }}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4 sm:pb-8">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-around">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                  active ? "text-petrol font-medium" : "text-ink-faint"
                }`}
              >
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
