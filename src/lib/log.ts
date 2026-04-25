/**
 * Vendor-agnostic structured logger. All server-side logging goes
 * through here so that wiring up Sentry / Axiom / Datadog later is a
 * one-file change instead of a project-wide grep.
 *
 * Design choices:
 *
 * 1. JSON Lines on stdout in production, pretty + colorless in dev.
 *    Vercel / most log shippers parse JSONL natively.
 * 2. Each call takes a short event name and an optional object. The
 *    object is shallow-cloned and Errors are unwrapped to
 *    `{ name, message, stack }` so they survive JSON.stringify.
 * 3. No log levels below "info" — debug spam in production is its own
 *    problem. Use console.log directly during development if needed.
 * 4. Synchronous and side-effect-free. A future Sentry call would be
 *    fire-and-forget inside `emit`.
 */

type Fields = Record<string, unknown>;

const isProd = process.env.NODE_ENV === "production";

function unwrap(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      // Preserve `cause` chain when present (Node 16+).
      ...(value.cause ? { cause: unwrap(value.cause) } : {}),
    };
  }
  if (Array.isArray(value)) return value.map(unwrap);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = unwrap(v);
    }
    return out;
  }
  return value;
}

function emit(
  level: "info" | "warn" | "error",
  event: string,
  fields: Fields | undefined,
) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(fields ? (unwrap(fields) as Fields) : {}),
  };

  // In dev, prefer the native console method so stack frames remain
  // clickable in the Next.js terminal output. JSONL would obscure them.
  if (!isProd) {
    const fn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;
    fn(`[${level}] ${event}`, fields ?? "");
    return;
  }

  // In prod, single-line JSON to stdout/stderr. Vercel's log drain
  // ingests this verbatim.
  const out = level === "error" ? process.stderr : process.stdout;
  out.write(JSON.stringify(payload) + "\n");

  // Hook for future error-tracking integration. Keep this branch tiny
  // — the actual Sentry/Axiom call would live behind a dynamic import
  // gated on an env var so the dependency is optional.
  // if (level === "error" && process.env.SENTRY_DSN) {
  //   import("@sentry/node").then((s) => s.captureException(...));
  // }
}

export const log = {
  info(event: string, fields?: Fields) {
    emit("info", event, fields);
  },
  warn(event: string, fields?: Fields) {
    emit("warn", event, fields);
  },
  error(event: string, fields?: Fields) {
    emit("error", event, fields);
  },
};
