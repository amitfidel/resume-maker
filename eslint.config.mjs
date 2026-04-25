// Flat config for ESLint 9. The previous setup used `FlatCompat` to
// adapt eslint-config-next via the legacy `extends` mechanism, which
// crashes with `Converting circular structure to JSON` on ESLint 9.39
// + eslint-config-next 16. Modern eslint-config-next ships a flat
// config array we can spread directly — no compat shim needed.
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  // Cover .next, build artifacts, node_modules.
  {
    ignores: [
      ".next/**",
      "out/**",
      "dist/**",
      "node_modules/**",
      "next-env.d.ts",
      "**/*.tsbuildinfo",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // React 19 added an aspirational rule that flags every
      // useState-from-prop-sync pattern as an error. Those patterns are
      // legal and idiomatic in this codebase (form drafts, dnd-kit
      // sortable items mirroring server data, etc.). Demote to warn
      // so it nudges without blocking CI; revisit individually as we
      // refactor toward derived-state.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
