/**
 * Template style system. Each template is a set of design tokens
 * that the interactive resume + PDF renderer both use.
 */

export type TemplateStyle = {
  id: string;
  name: string;
  description: string;

  // Typography
  fontFamily: string;
  headingFont: string;
  baseFontSize: string;
  lineHeight: string;

  // Header
  header: {
    align: "center" | "left";
    style: "plain" | "bordered-top" | "bordered-bottom" | "accent-bar" | "banner";
    nameSize: string;
    nameWeight: string;
    nameColor: string;
    contactStyle: "inline" | "stacked";
  };

  // Name letter spacing
  nameTracking: string;

  // Section headings
  sectionHeading: {
    case: "upper" | "normal";
    size: string;
    weight: string;
    color: string;
    tracking: string;
    border: "none" | "bottom" | "full-bottom" | "left-accent";
    marginBottom: string;
  };

  // Colors
  primaryColor: string;
  accentColor: string;
  textColor: string;
  mutedColor: string;
  dividerColor: string;
  accentBarColor: string;

  // Layout
  layout: "single" | "two-column";
  sidebarBg?: string;
  sidebarTextColor?: string;
  padding: string;

  // Bullets
  bulletStyle: "disc" | "square" | "dash" | "none";

  // Item spacing
  itemSpacing: string;
  sectionSpacing: string;
};

export const MODERN_CLEAN: TemplateStyle = {
  id: "modern-clean",
  name: "Modern Clean",
  description: "Clean sans-serif with centered header. Great for tech and design roles.",

  fontFamily: "'Inter', sans-serif",
  headingFont: "'Inter', sans-serif",
  baseFontSize: "10pt",
  lineHeight: "1.45",

  header: {
    align: "center",
    style: "plain",
    nameSize: "1.75rem",
    nameWeight: "700",
    nameColor: "#111827",
    contactStyle: "inline",
  },
  nameTracking: "-0.02em",

  sectionHeading: {
    case: "upper",
    size: "0.7rem",
    weight: "700",
    color: "#374151",
    tracking: "0.15em",
    border: "bottom",
    marginBottom: "0.5rem",
  },

  primaryColor: "#111827",
  accentColor: "#2563eb",
  textColor: "#374151",
  mutedColor: "#6b7280",
  dividerColor: "#d1d5db",
  accentBarColor: "#111827",

  layout: "single",
  padding: "2rem",

  bulletStyle: "disc",
  itemSpacing: "0.75rem",
  sectionSpacing: "1.25rem",
};

export const EXECUTIVE: TemplateStyle = {
  id: "executive",
  name: "Executive",
  description: "Bold serif with strong top border. Traditional, authoritative - finance, law, consulting.",

  fontFamily: "'Georgia', 'Times New Roman', serif",
  headingFont: "'Georgia', serif",
  baseFontSize: "10.5pt",
  lineHeight: "1.4",

  header: {
    align: "left",
    style: "bordered-bottom",
    nameSize: "2.25rem",
    nameWeight: "700",
    nameColor: "#000000",
    contactStyle: "inline",
  },
  nameTracking: "-0.01em",

  sectionHeading: {
    case: "upper",
    size: "0.75rem",
    weight: "700",
    color: "#000000",
    tracking: "0.18em",
    border: "full-bottom",
    marginBottom: "0.5rem",
  },

  primaryColor: "#000000",
  accentColor: "#000000",
  textColor: "#1f2937",
  mutedColor: "#4b5563",
  dividerColor: "#000000",
  accentBarColor: "#000000",

  layout: "single",
  padding: "2rem",

  bulletStyle: "square",
  itemSpacing: "0.875rem",
  sectionSpacing: "1.25rem",
};

export const ACCENT_MODERN: TemplateStyle = {
  id: "accent-modern",
  name: "Accent Modern",
  description: "Bold name with a colored accent bar. Contemporary, tech-forward.",

  fontFamily: "'Inter', sans-serif",
  headingFont: "'Manrope', 'Inter', sans-serif",
  baseFontSize: "10pt",
  lineHeight: "1.5",

  header: {
    align: "left",
    style: "accent-bar",
    nameSize: "2rem",
    nameWeight: "800",
    nameColor: "#0f172a",
    contactStyle: "inline",
  },
  nameTracking: "-0.02em",

  sectionHeading: {
    case: "upper",
    size: "0.7rem",
    weight: "700",
    color: "#6366f1",
    tracking: "0.15em",
    border: "none",
    marginBottom: "0.5rem",
  },

  primaryColor: "#0f172a",
  accentColor: "#6366f1",
  textColor: "#1e293b",
  mutedColor: "#64748b",
  dividerColor: "#e2e8f0",
  accentBarColor: "#6366f1",

  layout: "single",
  padding: "2rem",

  bulletStyle: "dash",
  itemSpacing: "0.875rem",
  sectionSpacing: "1.5rem",
};

export const TWO_COLUMN: TemplateStyle = {
  id: "two-column",
  name: "Two-Column",
  description: "Sidebar for contact & skills, main column for experience. Dense, efficient.",

  fontFamily: "'Inter', sans-serif",
  headingFont: "'Inter', sans-serif",
  baseFontSize: "9.5pt",
  lineHeight: "1.45",

  header: {
    align: "left",
    style: "banner",
    nameSize: "1.75rem",
    nameWeight: "700",
    nameColor: "#ffffff",
    contactStyle: "stacked",
  },
  nameTracking: "-0.01em",

  sectionHeading: {
    case: "upper",
    size: "0.65rem",
    weight: "700",
    color: "#1e293b",
    tracking: "0.15em",
    border: "bottom",
    marginBottom: "0.5rem",
  },

  primaryColor: "#1e3a8a",
  accentColor: "#3b82f6",
  textColor: "#1e293b",
  mutedColor: "#64748b",
  dividerColor: "#cbd5e1",
  accentBarColor: "#1e3a8a",

  layout: "two-column",
  sidebarBg: "#1e3a8a",
  sidebarTextColor: "#e2e8f0",
  padding: "0",

  bulletStyle: "disc",
  itemSpacing: "0.75rem",
  sectionSpacing: "1.25rem",
};

export const COMPACT: TemplateStyle = {
  id: "compact",
  name: "Compact",
  description: "Dense layout to fit more on one page. Good for heavy experience.",

  fontFamily: "'Inter', sans-serif",
  headingFont: "'Inter', sans-serif",
  baseFontSize: "9pt",
  lineHeight: "1.35",

  header: {
    align: "center",
    style: "plain",
    nameSize: "1.375rem",
    nameWeight: "700",
    nameColor: "#0f172a",
    contactStyle: "inline",
  },
  nameTracking: "0",

  sectionHeading: {
    case: "upper",
    size: "0.65rem",
    weight: "700",
    color: "#0f172a",
    tracking: "0.12em",
    border: "bottom",
    marginBottom: "0.25rem",
  },

  primaryColor: "#0f172a",
  accentColor: "#0f172a",
  textColor: "#334155",
  mutedColor: "#64748b",
  dividerColor: "#94a3b8",
  accentBarColor: "#0f172a",

  layout: "single",
  padding: "1.5rem",

  bulletStyle: "disc",
  itemSpacing: "0.5rem",
  sectionSpacing: "0.875rem",
};

export const ALL_STYLES: TemplateStyle[] = [
  MODERN_CLEAN,
  EXECUTIVE,
  ACCENT_MODERN,
  TWO_COLUMN,
  COMPACT,
];

export function getStyle(id: string): TemplateStyle {
  return ALL_STYLES.find((s) => s.id === id) ?? MODERN_CLEAN;
}
