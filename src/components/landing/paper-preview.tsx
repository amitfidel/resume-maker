"use client";

import { useEffect, useState } from "react";

/**
 * Paper preview with a live "resume composing itself" effect:
 *  - Phase 0: typing the active bullet
 *  - Phase 1: bullet complete, magic-highlight sweeps across it
 *  - Phase 2: small pause, then advances to the next bullet
 */

const BULLETS = [
  "Led redesign of the icon system across 1,200+ components, cutting render cost by 38%.",
  "Built and open-sourced the tokens pipeline now adopted by 12 external teams.",
  "Shipped the Coda Packs design framework; used in 65% of installed Packs within a year.",
];

export function PaperPreview() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "highlight" | "rest">("typing");

  useEffect(() => {
    const full = BULLETS[idx];
    if (phase === "typing") {
      if (typed.length < full.length) {
        const t = setTimeout(() => setTyped(full.slice(0, typed.length + 1)), 28);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setPhase("highlight"), 400);
      return () => clearTimeout(t);
    }
    if (phase === "highlight") {
      const t = setTimeout(() => setPhase("rest"), 1600);
      return () => clearTimeout(t);
    }
    if (phase === "rest") {
      const t = setTimeout(() => {
        setIdx((i) => (i + 1) % BULLETS.length);
        setTyped("");
        setPhase("typing");
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [typed, phase, idx]);

  const rendered = typed;

  return (
    <div className="h-full px-14 pt-12 pb-8 text-[11px] leading-[1.5] text-[#0e1220]">
      <div className="border-b-2 border-[#0e1220] pb-3">
        <div className="font-headline text-[34px] leading-none tracking-[-0.01em]">
          Avery Chen
        </div>
        <div className="mt-1.5 text-[12px] text-[#3b4258]">
          Senior Product Designer · Systems &amp; Tooling
        </div>
        <div className="mt-2 flex flex-wrap gap-3.5 text-[10.5px] text-[#6b7183]">
          <span>avery@chen.design</span>
          <span>·</span>
          <span>San Francisco</span>
          <span>·</span>
          <span>chen.design/work</span>
        </div>
      </div>

      <Section title="Summary">
        <p className="text-[#3b4258]">
          Design systems lead focused on turning component libraries into
          product velocity. Built Linear&apos;s icon system; scaled Coda&apos;s
          design tokens to 400+ engineers.
        </p>
      </Section>

      <Section title="Experience">
        <Experience
          role="Design Systems Lead"
          company="Linear"
          dates="2023 — Present"
          bullets={[BULLETS[0], BULLETS[1]]}
          activeIndex={idx <= 1 ? idx : -1}
          activePhase={phase}
          activeTyped={rendered}
        />
        <Experience
          role="Senior Designer"
          company="Coda"
          dates="2020 — 2023"
          bullets={[BULLETS[2]]}
          activeIndex={idx === 2 ? 0 : -1}
          activePhase={phase}
          activeTyped={rendered}
        />
      </Section>

      <Section title="Skills">
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#3b4258]">
          {["Design systems", "Figma", "Tokens", "React", "TypeScript", "Motion"].map(
            (s, i, arr) => (
              <span key={s}>
                {s}
                {i < arr.length - 1 && <span className="ml-2 text-[#c0c4d0]">·</span>}
              </span>
            ),
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#0e1220]">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Experience({
  role,
  company,
  dates,
  bullets,
  activeIndex,
  activePhase,
  activeTyped,
}: {
  role: string;
  company: string;
  dates: string;
  bullets: string[];
  activeIndex: number;
  activePhase: "typing" | "highlight" | "rest";
  activeTyped: string;
}) {
  return (
    <div className="mb-2.5">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-semibold text-[#0e1220]">{role}</span>{" "}
          <span className="text-[#3b4258]">· {company}</span>
        </div>
        <div className="font-mono text-[10px] text-[#6b7183]">{dates}</div>
      </div>
      <ul className="mt-1 list-disc pl-3.5">
        {bullets.map((b, i) => {
          const isActive = i === activeIndex;
          if (isActive && activePhase === "typing") {
            return (
              <li key={i} className="mb-0.5 text-[10.5px] text-[#3b4258]">
                <span
                  className="border-r-[1.5px] border-[var(--magic-2)] pr-[2px]"
                  style={{ animation: "caret 1.1s steps(1) infinite" }}
                >
                  {activeTyped}
                </span>
              </li>
            );
          }
          if (isActive && activePhase === "highlight") {
            return (
              <li
                key={i}
                className="mb-0.5 text-[10.5px] text-[#3b4258]"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 60%, rgba(109,60,255,0.22) 60%)",
                  backgroundSize: "0% 100%",
                  backgroundRepeat: "no-repeat",
                  animation: "hl-sweep 1.4s ease-out both",
                }}
              >
                {b}
              </li>
            );
          }
          return (
            <li key={i} className="mb-0.5 text-[10.5px] text-[#3b4258]">
              {b}
            </li>
          );
        })}
      </ul>
      <style>{`
        @keyframes caret { 50% { border-color: transparent; } }
        @keyframes hl-sweep { from { background-size: 0% 100%; } to { background-size: 100% 100%; } }
      `}</style>
    </div>
  );
}
