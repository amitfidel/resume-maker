"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Replaces the native `confirm()` with a theme-matched Dialog. Usage:
 *
 *   const confirm = useConfirm();
 *   const ok = await confirm({
 *     title: "Delete section?",
 *     description: "Education will be removed from this resume.",
 *     confirmLabel: "Delete",
 *     destructive: true,
 *   });
 *   if (ok) run(...)
 */

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmContext = (opts: ConfirmOptions) => Promise<boolean>;

const Ctx = createContext<ConfirmContext | null>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(v: boolean) => void>(null);

  const confirm = useCallback<ConfirmContext>((o) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const settle = (v: boolean) => {
    setOpen(false);
    resolveRef.current?.(v);
    resolveRef.current = null;
  };

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(v) => !v && settle(false)}>
        <DialogContent className="max-w-md rounded-[22px] border-0 bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div
                className={`grid h-10 w-10 flex-none place-items-center rounded-[10px] ${
                  opts?.destructive
                    ? "bg-[color:color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[var(--destructive)]"
                    : "bg-[var(--magic-tint)] text-[var(--magic-1)]"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-headline text-[20px] font-normal tracking-[-0.01em]">
                  {opts?.title}
                </DialogTitle>
                {opts?.description && (
                  <DialogDescription className="mt-1 text-[13px] text-[var(--on-surface-muted)]">
                    {opts.description}
                  </DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2 sm:justify-end">
            <Button
              variant="ghost"
              onClick={() => settle(false)}
              className="h-10 rounded-full px-5 text-[14px] text-[var(--on-surface-soft)]"
            >
              {opts?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              onClick={() => settle(true)}
              className={
                opts?.destructive
                  ? "h-10 rounded-full bg-[var(--destructive)] px-5 text-[14px] text-white hover:bg-[var(--destructive)]/90"
                  : "magical-gradient magic-shine h-10 rounded-full px-5 text-[14px]"
              }
            >
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

export function useConfirm(): ConfirmContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return ctx;
}
