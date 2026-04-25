import { describe, it, expect } from "vitest";
import {
  translate,
  localizedHeading,
  notLegacy,
  isItemEmpty,
  messages,
} from "@/lib/i18n/dictionary";

describe("translate", () => {
  it("returns the english string for an english key", () => {
    expect(translate("en", "common.export")).toBe("Export");
  });

  it("returns the hebrew string for a hebrew key when present", () => {
    // Just verify we get a different non-empty string back. Asserting
    // exact translations here would couple the test to copy edits.
    const en = translate("en", "common.export");
    const he = translate("he", "common.export");
    expect(he).not.toBe("");
    expect(he).not.toBe(en);
  });

  it("falls back to english if a key is missing in the requested locale", () => {
    // Inject an EN-only key just for this assertion.
    (messages.en as Record<string, string>)["__test_only_key"] = "fallback";
    try {
      expect(translate("he", "__test_only_key")).toBe("fallback");
    } finally {
      delete (messages.en as Record<string, string>)["__test_only_key"];
    }
  });

  it("falls back to the key itself when neither locale has it", () => {
    expect(translate("en", "this.key.does.not.exist")).toBe(
      "this.key.does.not.exist",
    );
  });
});

describe("dictionary completeness", () => {
  it("every english key has a hebrew counterpart", () => {
    const enKeys = Object.keys(messages.en);
    const heKeys = new Set(Object.keys(messages.he));
    const missing = enKeys.filter((k) => !heKeys.has(k));
    // Surface the missing keys in the failure message so a future PR
    // can fix them in one pass.
    expect(missing, `missing in he: ${missing.join(", ")}`).toEqual([]);
  });

  it("hebrew dictionary has no orphan keys (keys not in english)", () => {
    const heKeys = Object.keys(messages.he);
    const enKeys = new Set(Object.keys(messages.en));
    const orphans = heKeys.filter((k) => !enKeys.has(k));
    expect(orphans, `orphan in he: ${orphans.join(", ")}`).toEqual([]);
  });
});

describe("localizedHeading", () => {
  // Stub `t` as identity so we can assert the resolution logic without
  // pulling in the full translator.
  const t = (k: string) => k;

  it("returns the localized canvas heading when the heading is the english default", () => {
    expect(localizedHeading("Work Experience", "experience", t)).toBe(
      "canvas.heading.experience",
    );
    expect(localizedHeading("Education", "education", t)).toBe(
      "canvas.heading.education",
    );
  });

  it("returns the localized canvas heading when the heading is empty", () => {
    expect(localizedHeading("", "summary", t)).toBe("canvas.heading.summary");
  });

  it("passes a custom user heading through unchanged", () => {
    expect(localizedHeading("My Awesome Skills", "skills", t)).toBe(
      "My Awesome Skills",
    );
  });
});

describe("notLegacy", () => {
  it("returns empty string for null/undefined/empty", () => {
    expect(notLegacy(null)).toBe("");
    expect(notLegacy(undefined)).toBe("");
    expect(notLegacy("")).toBe("");
  });

  it("returns empty string for known legacy seed values", () => {
    expect(notLegacy("Degree")).toBe("");
    expect(notLegacy("Job Title")).toBe("");
    expect(notLegacy("Company")).toBe("");
    expect(notLegacy("New Skill")).toBe("");
  });

  it("preserves real user values", () => {
    expect(notLegacy("Senior Engineer")).toBe("Senior Engineer");
    expect(notLegacy("MIT")).toBe("MIT");
    // "Other" is legacy; "Other Skills" is fine.
    expect(notLegacy("Other Skills")).toBe("Other Skills");
  });
});

describe("isItemEmpty", () => {
  it("treats an experience as empty when title and company are blank or legacy seeds", () => {
    expect(isItemEmpty("experience", { title: "", company: "" })).toBe(true);
    expect(
      isItemEmpty("experience", { title: "Job Title", company: "Company" }),
    ).toBe(true);
  });

  it("treats an experience as non-empty when either real value is present", () => {
    expect(
      isItemEmpty("experience", { title: "Engineer", company: "" }),
    ).toBe(false);
    expect(isItemEmpty("experience", { title: "", company: "Acme" })).toBe(
      false,
    );
  });

  it("treats education as empty only when degree, institution, and field are all blank", () => {
    expect(
      isItemEmpty("education", {
        degree: "",
        institution: "",
        fieldOfStudy: "",
      }),
    ).toBe(true);
    expect(
      isItemEmpty("education", {
        degree: "Degree", // legacy seed
        institution: "University", // legacy seed
        fieldOfStudy: "",
      }),
    ).toBe(true);
    expect(
      isItemEmpty("education", {
        degree: "BSc",
        institution: "",
        fieldOfStudy: "",
      }),
    ).toBe(false);
    expect(
      isItemEmpty("education", {
        degree: "",
        institution: "",
        fieldOfStudy: "Mathematics",
      }),
    ).toBe(false);
  });

  it("treats skill, project, and certification by their `name` field", () => {
    expect(isItemEmpty("skill", { name: "" })).toBe(true);
    expect(isItemEmpty("skill", { name: "TypeScript" })).toBe(false);
    expect(isItemEmpty("project", { name: "" })).toBe(true);
    expect(isItemEmpty("project", { name: "Resumi" })).toBe(false);
    expect(isItemEmpty("certification", { name: "" })).toBe(true);
    expect(isItemEmpty("certification", { name: "AWS SAA" })).toBe(false);
  });

  it("treats custom items as empty when both title and text are blank", () => {
    expect(isItemEmpty("custom", { title: "", text: "" })).toBe(true);
    expect(isItemEmpty("custom", { title: "Award", text: "" })).toBe(false);
    expect(isItemEmpty("custom", { title: "", text: "Some text" })).toBe(false);
  });
});
