import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal toast UI stub for hook compatibility
 * (used only to satisfy TS + runtime placeholder)
 */

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type ToastActionElement = React.ReactNode;

export function Toast({
  className,
  ...props
}: ToastProps) {
  return (
    <div
      className={cn(
        "rounded-md border bg-background p-4 shadow-md text-sm",
        className
      )}
      {...props}
    />
  );
}
