"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Undo2, Redo2 } from "lucide-react";
import { useT } from "@/lib/i18n/context";
import {
  recordUndoCheckpoint,
  getUndoCheckpoints,
  restoreUndoCheckpoint,
  discardUndoCheckpointsAfter,
} from "@/app/(dashboard)/resumes/actions";

type Checkpoint = {
  id: string;
  versionNumber: number;
  createdAt: Date | string;
};

// Server actions return a union (created | skipped | error). This helper
// narrows it to "the row was created" so callers don't have to repeat
// the in-check pattern (which TS can't always narrow across unions).
function isCreated(
  result: unknown,
): result is { id: string; versionNumber: number; createdAt: Date | string } {
  if (!result || typeof result !== "object") return false;
  const r = result as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.versionNumber === "number" &&
    (r.createdAt instanceof Date || typeof r.createdAt === "string")
  );
}

/**
 * Editor undo/redo controller. Backed by `resume_versions` rows tagged
 * `auto_undo`: every save event creates a snapshot, the cursor walks
 * the list, and forward checkpoints are dropped on a fresh edit.
 *
 * Tradeoffs vs. a real client-side action log:
 *   + Survives page refresh (state lives in DB).
 *   + Trivial to implement on top of the existing version system.
 *   - Coarse — the granularity is "between saves", not per-keystroke.
 *   - One server round-trip per undo/redo (not instant).
 *
 * Renders nothing visible on its own; mounts <UndoRedoButtons /> in the
 * editor toolbar, listens for save-end events, and binds Cmd/Ctrl+Z
 * and Cmd/Ctrl+Shift+Z.
 */
export function UndoRedoController({ resumeId }: { resumeId: string }) {
  const t = useT();
  const router = useRouter();

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
  // The cursor points at the checkpoint that matches the *current*
  // resume state. -1 means "no checkpoints yet" (first paint).
  const [cursor, setCursor] = useState(-1);
  const [busy, setBusy] = useState(false);

  // Refs let the save-end listener and key handler read the latest
  // state without re-binding on every render.
  const checkpointsRef = useRef(checkpoints);
  const cursorRef = useRef(cursor);
  const busyRef = useRef(busy);
  useEffect(() => {
    checkpointsRef.current = checkpoints;
  }, [checkpoints]);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // Hydrate the stack on mount. If empty, take an initial snapshot so
  // the first undo has somewhere to go back to.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getUndoCheckpoints(resumeId);
      if (cancelled) return;
      if (list.length === 0) {
        const created = await recordUndoCheckpoint(resumeId);
        if (cancelled) return;
        if (isCreated(created)) {
          setCheckpoints([
            {
              id: created.id,
              versionNumber: created.versionNumber,
              createdAt: created.createdAt,
            },
          ]);
          setCursor(0);
        }
      } else {
        setCheckpoints(list);
        setCursor(list.length - 1);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resumeId]);

  // Take a checkpoint after each save. Debounced so a flurry of edits
  // collapses into a single snapshot.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const handler = () => {
      // Don't capture saves that the undo/redo itself triggered — the
      // server-side restore already updated state, and we don't want a
      // duplicate snapshot of the just-restored cursor position.
      if (busyRef.current) return;

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const cp = checkpointsRef.current;
        const cur = cursorRef.current;
        const trimmedFuture = cur >= 0 && cur < cp.length - 1;

        // Block re-entrant captures while we're talking to the server.
        // Without this, two saves landing inside the debounce window
        // could both pass the "discard future" branch and produce
        // duplicate / orphan checkpoints.
        busyRef.current = true;
        try {
          // If the user undid and is now editing, drop everything past
          // the cursor before recording the new state.
          if (trimmedFuture) {
            const last = cp[cur];
            await discardUndoCheckpointsAfter(resumeId, last.versionNumber);
          }

          const created = await recordUndoCheckpoint(resumeId);

          if (!isCreated(created)) {
            // Server skipped (snapshot identical to last) or errored. If
            // we just deleted the future entries, our local checkpoint
            // array now references rows that no longer exist on the
            // server — re-sync from the source of truth.
            if (trimmedFuture) {
              const fresh = await getUndoCheckpoints(resumeId);
              setCheckpoints(fresh);
              setCursor(fresh.length - 1);
            }
            return;
          }

          const newCp: Checkpoint = {
            id: created.id,
            versionNumber: created.versionNumber,
            createdAt: created.createdAt,
          };
          // Re-read refs in case state shifted while we awaited.
          const cpNow = checkpointsRef.current;
          const curNow = cursorRef.current;
          const trimmed =
            curNow < cpNow.length - 1 ? cpNow.slice(0, curNow + 1) : cpNow;
          // Honor the cap: keep only the most recent N entries on the
          // client too, so the cursor math matches the server.
          const next = [...trimmed, newCp].slice(-30);
          setCheckpoints(next);
          setCursor(next.length - 1);
        } finally {
          busyRef.current = false;
        }
      }, 1500);
    };

    window.addEventListener("resumi:save-end", handler);
    return () => {
      window.removeEventListener("resumi:save-end", handler);
      if (timer) clearTimeout(timer);
    };
  }, [resumeId]);

  const undo = useCallback(async () => {
    const cp = checkpointsRef.current;
    const cur = cursorRef.current;
    if (busyRef.current || cur <= 0) return;
    setBusy(true);
    try {
      const target = cp[cur - 1];
      const result = await restoreUndoCheckpoint(resumeId, target.id);
      if (!result?.error) {
        setCursor(cur - 1);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [resumeId, router]);

  const redo = useCallback(async () => {
    const cp = checkpointsRef.current;
    const cur = cursorRef.current;
    if (busyRef.current || cur < 0 || cur >= cp.length - 1) return;
    setBusy(true);
    try {
      const target = cp[cur + 1];
      const result = await restoreUndoCheckpoint(resumeId, target.id);
      if (!result?.error) {
        setCursor(cur + 1);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [resumeId, router]);

  // Cmd/Ctrl+Z (undo) and Cmd/Ctrl+Shift+Z (redo). Skip when typing in
  // an input/textarea/contenteditable so the browser's text-undo wins.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable === true;
      if (isEditable) return;

      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  const canUndo = cursor > 0 && !busy;
  const canRedo = cursor >= 0 && cursor < checkpoints.length - 1 && !busy;

  return (
    <div className="inline-flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        title={t("editor.undo")}
        aria-label={t("editor.undo")}
        className="h-9 w-9 rounded-[10px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)] disabled:opacity-30"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        title={t("editor.redo")}
        aria-label={t("editor.redo")}
        className="h-9 w-9 rounded-[10px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)] disabled:opacity-30"
      >
        <Redo2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
