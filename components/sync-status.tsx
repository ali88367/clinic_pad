"use client";

import { useOnlineStatus } from "@/lib/use-online-status";
import { Badge } from "@/components/ui/badge";

export function SyncStatus() {
  const online = useOnlineStatus();

  if (online) {
    return (
      <Badge variant="neutral">
        <span className="size-1.5 rounded-full bg-petrol" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="gold">
      <span className="size-1.5 rounded-full bg-gold" />
      Offline · local save ho raha hai
    </Badge>
  );
}
