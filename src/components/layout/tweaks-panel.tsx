"use client";

import { useEffect, useState } from "react";
import { Settings2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/dictionary";

type Accent = "indigo" | "plum" | "moss" | "ember" | "cobalt";
type Density = "compact" | "comfortable" | "spacious";
type Motion = "none" | "soft" | "expressive";
type Texture = "flat" | "paper" | "grain";
type Mode = "light" | "dark";

type Tweaks = {
  accent: Accent;
  density: Density;
  motion: Motion;
  texture: Texture;
  mode: Mode;
};

const DEFAULTS: Tweaks = {
  accent: "indigo",
  density: "comfortable",
  motion: "expressive",
  texture: "paper",
  mode: "light",
};

const STORAGE_KEY = "resumi.tweaks.v1";

const ACCENT_SWATCHES: { id: Accent; color: string }[] = [
  { id: "indigo", color: "#6d3cff" },
  { id: "plum", color: "#b24bb7" },
  { id: "moss", color: "#2f9b6a" },
  { id: "ember", color: "#e2622f" },
  { id: "cobalt", color: "#2f6bff" },
];

function apply(t: Tweaks) {
  const root = document.documentElement;
  root.dataset.accent = t.accent;
  root.dataset.density = t.density;
  root.dataset.motion = t.motion;
  root.dataset.texture = t.texture;
  if (t.mode === "dark") {
    root.dataset.theme = "dark";
  } else {
    delete root.dataset.theme;
  }
}

export function TweaksPanel() {
  const { locale, setLocale, t: tr } = useI18n();
  const [open, setOpen] = useState(false);
  const [t, setT] = useState<Tweaks>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Tweaks>) };
        setT(parsed);
        apply(parsed);
      } else {
        apply(DEFAULTS);
      }
    } catch {
      apply(DEFAULTS);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    apply(t);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
    } catch {
      // ignore
    }
  }, [t, hydrated]);

  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener("resumi:open-tweaks", open);
    return () => window.removeEventListener("resumi:open-tweaks", open);
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 end-6 z-40 w-[300px] rounded-[22px] bg-[var(--surface-raised)] p-[18px] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]"
          style={{
            transformOrigin: "bottom right",
            animation: "tweaks-in 280ms var(--ease-spring)",
          }}
        >
          <style>{`@keyframes tweaks-in { from { opacity: 0; transform: translateY(8px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
          <div className="mb-1.5 flex items-start justify-between">
            <h4 className="font-headline text-[20px] font-normal tracking-[-0.01em]">
              {tr("tweaks.title")}
            </h4>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-[var(--on-surface-muted)] transition-colors hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
              aria-label={tr("common.close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-4 text-[12px] text-[var(--on-surface-muted)]">
            {tr("tweaks.lead")}
          </p>

          <Row label={tr("tweaks.language")} valueLabel={locale === "he" ? "עברית" : "English"}>
            <Seg
              options={["en", "he"] as Locale[]}
              value={locale}
              onChange={(v) => setLocale(v)}
              labels={{ en: "English", he: "עברית" }}
            />
          </Row>

          <Row label={tr("tweaks.accent")} valueLabel={t.accent}>
            <div className="flex gap-2">
              {ACCENT_SWATCHES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setT((v) => ({ ...v, accent: s.id }))}
                  aria-label={s.id}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    t.accent === s.id
                      ? "scale-110 shadow-[0_0_0_2px_var(--surface-raised),0_0_0_4px_var(--ink)]"
                      : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)]"
                  }`}
                  style={{ background: s.color }}
                />
              ))}
            </div>
          </Row>

          <Row label={tr("tweaks.mode")} valueLabel={t.mode}>
            <Seg
              options={["light", "dark"] as Mode[]}
              value={t.mode}
              onChange={(v) => setT((x) => ({ ...x, mode: v }))}
            />
          </Row>

          <Row label={tr("tweaks.density")} valueLabel={t.density}>
            <Seg
              options={["compact", "comfortable", "spacious"] as Density[]}
              value={t.density}
              onChange={(v) => setT((x) => ({ ...x, density: v }))}
            />
          </Row>

          <Row label={tr("tweaks.motion")} valueLabel={t.motion}>
            <Seg
              options={["none", "soft", "expressive"] as Motion[]}
              value={t.motion}
              onChange={(v) => setT((x) => ({ ...x, motion: v }))}
            />
          </Row>

          <Row label={tr("tweaks.texture")} valueLabel={t.texture}>
            <Seg
              options={["flat", "paper", "grain"] as Texture[]}
              value={t.texture}
              onChange={(v) => setT((x) => ({ ...x, texture: v }))}
            />
          </Row>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 end-6 z-40 inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-4 py-2.5 text-[13px] font-medium text-[var(--cream)] shadow-[var(--sh-3)] transition-transform hover:-translate-y-px"
      >
        <Settings2 className="h-4 w-4" />
        {tr("tweaks.btn")}
      </button>
    </>
  );
}

function Row<T extends string>({
  label,
  valueLabel,
  children,
}: {
  label: string;
  valueLabel: T;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-center justify-between text-[12px] text-[var(--on-surface-soft)]">
        <span>{label}</span>
        <span className="font-mono text-[11px] capitalize text-[var(--on-surface)]">
          {valueLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

function Seg<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labels?: Record<T, string>;
}) {
  return (
    <div className="flex gap-[2px] rounded-full bg-[var(--surface-sunk)] p-[3px]">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`flex-1 rounded-full px-2.5 py-1.5 text-[12px] capitalize transition-all ${
            value === o
              ? "bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-[var(--sh-1)]"
              : "text-[var(--on-surface-muted)]"
          }`}
        >
          {labels?.[o] ?? o}
        </button>
      ))}
    </div>
  );
}
