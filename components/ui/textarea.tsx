import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-20 w-full rounded-md border border-border-strong bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint transition-colors resize-none",
          "focus-visible:outline-none focus-visible:border-petrol focus-visible:ring-2 focus-visible:ring-petrol-light",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
