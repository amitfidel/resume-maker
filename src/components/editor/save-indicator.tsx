"use client";

import { useEffect, useState } from "react";

/**
 * Listens for `resumi:save-start` / `resumi:save-end` window events
 * (dispatched by interactive-resume save helpers) and shows the
 * current save state. Concurrent saves are tracked via a counter.
 */
export function SaveIndicator() {
  const [active, setActive] = useState(0);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    const start = () => setActive((n) => n + 1);
    const end = () => {
      setActive((n) => Math.max(0, n - 1));
      setJustSaved(true);
      // Reset the "Saved" chip back to "ready" after a moment
      setTimeout(() => setJustSaved(false), 1800);
    };
    window.addEventListener("resumi:save-start", start);
    window.addEventListener("resumi:save-end", end);
    return () => {
      window.removeEventListener("resumi:save-start", start);
      window.removeEventListener("resumi:save-end", end);
    };
  }, []);

  const saving = active > 0;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-sunk)] px-2.5 py-1 text-[12px] transition-colors ${
        saving
          ? "text-[var(--magic-2)]"
          : justSaved
            ? "text-[var(--success)]"
            : "text-[var(--on-surface-muted)]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          saving
            ? "bg-[var(--magic-2)] dot-pulse"
            : justSaved
              ? "bg-[var(--success)]"
              : "bg-[var(--success)]"
        }`}
      />
      {saving ? "Saving…" : justSaved ? "Saved" : "Saved"}
    </span>
  );
}
