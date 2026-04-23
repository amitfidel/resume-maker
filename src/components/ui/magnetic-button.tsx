"use client";

import { useRef, useEffect } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  strength?: number; // 0..1 — how hard the button follows the cursor
};

/**
 * Wraps any interactive element in a magnetic-hover effect:
 * when the cursor approaches, the child translates toward it.
 * Effect is disabled when [data-motion="none"] is set on <html>.
 */
export function MagneticButton({ children, className, strength = 0.35 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.documentElement.dataset.motion === "none") return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - (rect.left + rect.width / 2);
      const my = e.clientY - (rect.top + rect.height / 2);
      const maxDist = Math.max(rect.width, rect.height);
      const distance = Math.hypot(mx, my);
      if (distance > maxDist) {
        targetX = 0;
        targetY = 0;
      } else {
        targetX = mx * strength;
        targetY = my * strength;
      }
      schedule();
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      schedule();
    };

    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(tick);
    }
    function tick() {
      raf = 0;
      curX += (targetX - curX) * 0.2;
      curY += (targetY - curY) * 0.2;
      if (el) {
        el.style.transform = `translate(${curX.toFixed(2)}px, ${curY.toFixed(2)}px)`;
      }
      if (Math.abs(targetX - curX) > 0.1 || Math.abs(targetY - curY) > 0.1) {
        schedule();
      }
    }

    window.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ display: "inline-block", willChange: "transform" }}
    >
      {children}
    </div>
  );
}
