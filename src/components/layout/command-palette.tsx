"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FileText,
  Briefcase,
  User,
  Upload,
  Plus,
  Sparkles,
  Settings2,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Cmd = {
  id: string;
  label: string;
  group: "navigate" | "create" | "tools";
  icon: LucideIcon;
  sub?: string;
  run: () => void | Promise<void>;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Hide during auth flow
  const hide = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const commands: Cmd[] = useMemo(
    () => [
      {
        id: "nav-dashboard",
        label: "Go to Dashboard",
        group: "navigate",
        icon: LayoutDashboard,
        sub: "G D",
        run: () => router.push("/dashboard"),
      },
      {
        id: "nav-resumes",
        label: "Go to Resumes",
        group: "navigate",
        icon: FileText,
        sub: "G R",
        run: () => router.push("/resumes"),
      },
      {
        id: "nav-apps",
        label: "Go to Job Tracker",
        group: "navigate",
        icon: Briefcase,
        sub: "G J",
        run: () => router.push("/applications"),
      },
      {
        id: "nav-profile",
        label: "Go to Profile",
        group: "navigate",
        icon: User,
        sub: "G P",
        run: () => router.push("/profile"),
      },
      {
        id: "nav-import",
        label: "Import from PDF",
        group: "navigate",
        icon: Upload,
        run: () => router.push("/import"),
      },
      {
        id: "create-resume",
        label: "New resume",
        group: "create",
        icon: Plus,
        sub: "N",
        run: async () => {
          const res = await fetch("/api/ai/chat", { method: "HEAD" }).catch(() => null);
          // Fallback: just navigate to resumes page — user can hit "New resume" there
          void res;
          router.push("/resumes");
        },
      },
      {
        id: "tool-tailor",
        label: "Tailor resume to a job",
        group: "tools",
        icon: Sparkles,
        run: () => router.push("/resumes"),
      },
      {
        id: "tool-tweaks",
        label: "Open Tweaks",
        group: "tools",
        icon: Settings2,
        run: () => {
          window.dispatchEvent(new CustomEvent("resumi:open-tweaks"));
        },
      },
    ],
    [router],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  const grouped = useMemo(() => {
    const groups: Record<string, Cmd[]> = { navigate: [], create: [], tools: [] };
    for (const c of filtered) groups[c.group].push(c);
    return groups;
  }, [filtered]);

  if (hide || !open) return null;

  const flat = filtered;
  const run = (cmd: Cmd) => {
    setOpen(false);
    cmd.run();
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-start justify-items-center pt-[12vh]"
      style={{
        background: "rgba(14,18,32,0.4)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        animation: "cmd-bd-in var(--t-mid) var(--ease-out)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <style>{`
        @keyframes cmd-bd-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cmd-in {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div
        className="w-[min(560px,92vw)] overflow-hidden rounded-[22px] bg-[var(--surface-raised)] shadow-[var(--sh-4),0_0_0_1px_var(--border-ghost)]"
        style={{ animation: "cmd-in 300ms var(--ease-spring)" }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, flat.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (flat[active]) run(flat[active]);
          }
        }}
      >
        <div className="flex items-center gap-3 px-5">
          <Search className="h-4 w-4 flex-none text-[var(--on-surface-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Jump to anywhere, or run a command…"
            className="w-full bg-transparent py-[18px] text-[16px] text-[var(--on-surface)] outline-none placeholder:text-[var(--on-surface-faint)]"
          />
          <kbd className="font-mono rounded border border-[var(--border-ghost-strong)] bg-[var(--surface-sunk)] px-1.5 py-0.5 text-[11px] text-[var(--on-surface-muted)]">
            esc
          </kbd>
        </div>
        <div className="h-px bg-[var(--border-ghost)]" />
        <div className="max-h-[420px] overflow-y-auto p-2">
          {flat.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-[var(--on-surface-muted)]">
              No commands match &ldquo;{query}&rdquo;.
            </div>
          )}
          {(["navigate", "create", "tools"] as const).map((g) => {
            const items = grouped[g];
            if (!items || items.length === 0) return null;
            const label = g === "navigate" ? "Navigate" : g === "create" ? "Create" : "Tools";
            return (
              <div key={g}>
                <div className="px-3.5 pb-1.5 pt-2.5 text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  {label}
                </div>
                {items.map((c) => {
                  const idx = flat.indexOf(c);
                  const isActive = idx === active;
                  return (
                    <button
                      key={c.id}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => run(c)}
                      className={`flex w-full items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left text-[14px] text-[var(--on-surface)] transition-colors ${
                        isActive ? "bg-[var(--surface-sunk)]" : ""
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 flex-none place-items-center rounded-[8px] ${
                          isActive
                            ? "bg-[var(--ink)] text-[var(--cream)]"
                            : "bg-[var(--surface-sunk)] text-[var(--on-surface-soft)]"
                        }`}
                      >
                        <c.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex-1">{c.label}</span>
                      {c.sub && (
                        <span className="font-mono text-[11px] text-[var(--on-surface-muted)]">
                          {c.sub}
                        </span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--on-surface-faint)]" />
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
