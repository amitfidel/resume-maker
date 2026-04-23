"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Wraps route children with a fade + subtle scale/blur morph on pathname change.
 * Honors `data-motion="none"` on <html> by skipping the animation.
 */
export function ViewTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [displayed, setDisplayed] = useState<{
    key: string;
    node: React.ReactNode;
  }>({ key: pathname ?? "/", node: children });
  const [phase, setPhase] = useState<"enter" | "active" | "exit">("active");
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) {
      // Just a children update on the same route — swap silently
      setDisplayed((d) => ({ ...d, node: children }));
      return;
    }

    const motionDisabled =
      typeof document !== "undefined" &&
      document.documentElement.dataset.motion === "none";

    if (motionDisabled) {
      setDisplayed({ key: pathname ?? "/", node: children });
      prevPath.current = pathname;
      return;
    }

    // Exit current
    setPhase("exit");
    const exitTimer = setTimeout(() => {
      setDisplayed({ key: pathname ?? "/", node: children });
      setPhase("enter");
      // Next tick, move to active
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPhase("active"));
      });
      prevPath.current = pathname;
    }, 220);

    return () => clearTimeout(exitTimer);
  }, [pathname, children]);

  return (
    <div
      key={displayed.key}
      className="view-transition"
      data-phase={phase}
      style={{
        transition:
          "opacity 380ms var(--ease-out), transform 380ms var(--ease-out), filter 380ms var(--ease-out)",
        willChange: "transform, opacity, filter",
        opacity: phase === "active" ? 1 : 0,
        transform:
          phase === "enter"
            ? "translateY(10px) scale(0.996)"
            : phase === "exit"
              ? "translateY(-6px) scale(1.004)"
              : "translateY(0) scale(1)",
        filter: phase === "active" ? "blur(0)" : "blur(4px)",
      }}
    >
      {displayed.node}
    </div>
  );
}
