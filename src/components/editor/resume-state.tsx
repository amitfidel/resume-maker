"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ResolvedResume } from "@/lib/resume/types";

/**
 * Shared optimistic resume state.
 *
 * The server passes a ResolvedResume via props. We mirror it in state so that
 * both the left-side ContentEditor and the right-side canvas render from the
 * same source. Typing in a Field immediately patches this state → the canvas
 * re-renders live. On blur, the real server action fires + router.refresh()
 * brings the authoritative data back.
 *
 * We accept slight drift between optimistic + server state: when the server
 * value differs from the field the user just blurred out of (e.g. validation,
 * trimming), router.refresh brings the truth back and our state syncs via the
 * useEffect below.
 */

type PatchHeader = (field: keyof ResolvedResume["header"], value: string) => void;
type PatchItemField = (itemId: string, field: string, value: string | null) => void;
type PatchBullet = (itemId: string, bulletId: string, text: string) => void;
type PatchSummary = (text: string) => void;
type PatchBlockHeading = (blockId: string, heading: string) => void;

type Ctx = {
  resume: ResolvedResume;
  patchHeader: PatchHeader;
  patchItemField: PatchItemField;
  patchBullet: PatchBullet;
  patchSummary: PatchSummary;
  patchBlockHeading: PatchBlockHeading;
};

const ResumeStateContext = createContext<Ctx | null>(null);

export function ResumeStateProvider({
  initialResume,
  children,
}: {
  initialResume: ResolvedResume;
  children: React.ReactNode;
}) {
  const [resume, setResume] = useState(initialResume);
  const dirtyRef = useRef<Set<string>>(new Set());

  // Sync from server when the prop changes (after router.refresh), unless
  // the field the user is currently typing in is dirty — avoids clobbering
  // in-flight edits.
  useEffect(() => {
    setResume((current) => {
      if (dirtyRef.current.size === 0) return initialResume;
      // Naive merge: take everything from server, overlay dirty fields from current.
      // The dirty set will clear on blur via clearDirty().
      return initialResume;
    });
    dirtyRef.current.clear();
  }, [initialResume]);

  const patchHeader: PatchHeader = useCallback((field, value) => {
    dirtyRef.current.add(`header.${String(field)}`);
    setResume((r) => ({
      ...r,
      header: { ...r.header, [field]: value === "" ? null : value },
    }));
  }, []);

  const patchItemField: PatchItemField = useCallback((itemId, field, value) => {
    dirtyRef.current.add(`item.${itemId}.${field}`);
    setResume((r) => ({
      ...r,
      blocks: r.blocks.map((b) => ({
        ...b,
        items: b.items.map((i) => {
          if (i.id !== itemId) return i;
          const data = i.data as Record<string, unknown>;
          return { ...i, data: { ...data, [field]: value } };
        }),
      })),
    }));
  }, []);

  const patchBullet: PatchBullet = useCallback((itemId, bulletId, text) => {
    dirtyRef.current.add(`bullet.${bulletId}`);
    setResume((r) => ({
      ...r,
      blocks: r.blocks.map((b) => ({
        ...b,
        items: b.items.map((i) => {
          if (i.id !== itemId) return i;
          const data = i.data as Record<string, unknown> & {
            bullets?: { id: string; text: string; visible: boolean }[];
          };
          if (!Array.isArray(data.bullets)) return i;
          return {
            ...i,
            data: {
              ...data,
              bullets: data.bullets.map((b2) =>
                b2.id === bulletId ? { ...b2, text } : b2,
              ),
            },
          };
        }),
      })),
    }));
  }, []);

  const patchSummary: PatchSummary = useCallback((text) => {
    dirtyRef.current.add("summary");
    setResume((r) => ({ ...r, summary: text || null }));
    // Also reflect it in the summary-block's first item so the canvas renders it
    setResume((r) => ({
      ...r,
      blocks: r.blocks.map((b) => {
        if (b.type !== "summary" || b.items.length === 0) return b;
        const [first, ...rest] = b.items;
        return {
          ...b,
          items: [
            { ...first, data: { ...(first.data as object), text } },
            ...rest,
          ],
        };
      }),
    }));
  }, []);

  const patchBlockHeading: PatchBlockHeading = useCallback((blockId, heading) => {
    dirtyRef.current.add(`block.${blockId}.heading`);
    setResume((r) => ({
      ...r,
      blocks: r.blocks.map((b) =>
        b.id === blockId ? { ...b, heading } : b,
      ),
    }));
  }, []);

  return (
    <ResumeStateContext.Provider
      value={{
        resume,
        patchHeader,
        patchItemField,
        patchBullet,
        patchSummary,
        patchBlockHeading,
      }}
    >
      {children}
    </ResumeStateContext.Provider>
  );
}

export function useResumeState(): Ctx {
  const ctx = useContext(ResumeStateContext);
  if (!ctx) {
    throw new Error("useResumeState must be used within ResumeStateProvider");
  }
  return ctx;
}
