"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { saveImportedProfile } from "./actions";
import { useT } from "@/lib/i18n/context";

type ParsedData = {
  fullName: string;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  summary: string | null;
  workExperiences: Array<{
    company: string;
    title: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    bullets: string[];
    category?: "work" | "military" | "volunteer";
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string | null;
    startDate: string | null;
    endDate: string | null;
    gpa: string | null;
  }>;
  skills: Array<{ name: string; category: string | null }>;
  projects: Array<{
    name: string;
    description: string | null;
    technologies: string[];
    bullets: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string | null;
    issueDate: string | null;
  }>;
};

export default function ImportPage() {
  const router = useRouter();
  const [pasteText, setPasteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const t = useT();

  const handlePasteSubmit = useCallback(async () => {
    if (!pasteText.trim()) return;
    setIsLoading(true);
    setError(null);
    setParsed(null);

    try {
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pasteText }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setParsed(data.data);
      }
    } catch {
      setError("Failed to parse resume");
    } finally {
      setIsLoading(false);
    }
  }, [pasteText]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true);
      setError(null);
      setParsed(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setParsed(data.data);
        }
      } catch {
        setError("Failed to parse PDF");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!parsed) return;
    setIsLoading(true);
    const result = await saveImportedProfile(parsed);
    if (result?.error) {
      setIsLoading(false);
      setError(result.error);
      return;
    }
    // Resume created server-side — drop the user straight into the
    // editor for it instead of a "saved!" success page. They came here
    // to make a resume, not to admire their profile.
    if (result?.resumeId) {
      router.push(`/resumes/${result.resumeId}/edit`);
      return;
    }
    setIsLoading(false);
    setSaved(true);
  }, [parsed, router]);

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Check className="mb-4 h-16 w-16 text-green-500" />
        <h2 className="text-2xl font-bold">Profile Updated</h2>
        <p className="mt-2 text-muted-foreground">
          Your career profile has been populated with imported data.
        </p>
        <div className="mt-6 flex gap-3">
          <a href="/profile">
            <Button>View Profile</Button>
          </a>
          <a href="/resumes">
            <Button variant="outline">Create Resume</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--on-surface-muted)]">
          Bring it in
        </p>
        <h1 className="font-headline mt-1.5 text-[clamp(32px,4vw,44px)] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--on-surface)]">
          Import a <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">resume</em>
        </h1>
        <p className="mt-2 text-[var(--on-surface-muted)]">
          Upload a PDF or paste the text. AI extracts structured data into your
          career profile.
        </p>
      </div>

      {!parsed ? (
        <Tabs defaultValue="paste" className="space-y-4">
          <TabsList className="rounded-full bg-[var(--surface-sunk)] p-[3px]">
            <TabsTrigger
              value="paste"
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-[var(--on-surface-muted)] data-[state=active]:bg-[var(--surface-raised)] data-[state=active]:text-[var(--on-surface)] data-[state=active]:shadow-[var(--sh-1)]"
            >
              {t("import.tab.paste")}
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-[var(--on-surface-muted)] data-[state=active]:bg-[var(--surface-raised)] data-[state=active]:text-[var(--on-surface)] data-[state=active]:shadow-[var(--sh-1)]"
            >
              {t("import.tab.upload")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder={t("import.paste_ph")}
              rows={14}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="resumi-input"
            />
            <Button
              onClick={handlePasteSubmit}
              disabled={isLoading || !pasteText.trim()}
              className="magical-gradient magic-shine h-11 rounded-full px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("import.parsing")}
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  {t("import.parse")}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="resumi-card flex flex-col items-center justify-center py-14">
              <div className="mb-4 grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--surface-sunk)]">
                <Upload className="h-6 w-6 text-[var(--on-surface-muted)]" />
              </div>
              <p className="mb-4 text-sm text-[var(--on-surface-muted)]">
                {t("import.upload_lead")}
              </p>
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="resumi-input max-w-xs"
              />
              {isLoading && (
                <div className="font-mono mt-4 flex items-center gap-2 rounded-[10px] bg-[var(--surface-sunk)] px-3 py-2 text-[12px] text-[var(--on-surface-soft)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t("import.parsing_pdf")}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="resumi-card p-6">
            <h2 className="font-headline text-[24px] font-normal tracking-[-0.01em]">
              {t("import.parsed.title.part1")}{" "}
              <em className="serif-ital">{t("import.parsed.title.italic")}</em>
            </h2>
            <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
              {t("import.parsed.lead")}
            </p>
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ParsedField label={t("import.parsed.name")} value={parsed.fullName} />
                <ParsedField label={t("import.parsed.headline")} value={parsed.headline} />
                <ParsedField label={t("import.parsed.email")} value={parsed.email} />
                <ParsedField label="Phone" value={parsed.phone} />
                <ParsedField label={t("import.parsed.location")} value={parsed.location} />
              </div>

              {parsed.summary && <ParsedField label={t("import.parsed.summary")} value={parsed.summary} />}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  {t("import.parsed.experience")} ({parsed.workExperiences.length})
                </p>
                <ExperienceGrouped experiences={parsed.workExperiences} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  {t("import.parsed.education")} ({parsed.education.length})
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {parsed.education.map((edu, i) => (
                    <p key={i} className="text-sm text-[var(--on-surface-soft)]">
                      {edu.degree}
                      {edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}{" "}
                      <span className="text-[var(--on-surface-muted)]">
                        — {edu.institution}
                      </span>
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  {t("import.parsed.skills")} ({parsed.skills.length})
                </p>
                <SkillsByCategory skills={parsed.skills} />
              </div>

              {parsed.projects.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                    Projects ({parsed.projects.length})
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {parsed.projects.map((p, i) => (
                      <p
                        key={i}
                        className="text-sm text-[var(--on-surface-soft)]"
                      >
                        {p.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {parsed.certifications.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                    Certifications ({parsed.certifications.length})
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {parsed.certifications.map((c, i) => (
                      <p
                        key={i}
                        className="text-sm text-[var(--on-surface-soft)]"
                      >
                        {c.name}
                        {c.issuer ? (
                          <span className="text-[var(--on-surface-muted)]">
                            {" "}
                            — {c.issuer}
                          </span>
                        ) : null}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="magical-gradient magic-shine h-11 rounded-full px-5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("import.saving")}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t("import.save")}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setParsed(null)}
              className="h-11 rounded-full border-0 bg-[var(--surface-raised)] px-5 text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink)]"
            >
              {t("import.start_over")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="inline-flex items-center gap-2 rounded-[10px] bg-[color:color-mix(in_oklab,var(--destructive)_12%,transparent)] px-3 py-2 text-sm text-[var(--destructive)]">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}

function ParsedField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--on-surface)]">{value || "—"}</p>
    </div>
  );
}

function ExperienceGrouped({
  experiences,
}: {
  experiences: Array<{
    company: string;
    title: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    isCurrent: boolean;
    bullets: string[];
    category?: "work" | "military" | "volunteer";
  }>;
}) {
  if (experiences.length === 0) {
    return (
      <p className="mt-1.5 text-sm text-[var(--on-surface-muted)]">—</p>
    );
  }

  // Use the model's category. Parser falls back to "work" if it
  // couldn't tell — anything explicit (military/volunteer) wins.
  const labelOf = (cat: string): "Work" | "Military" | "Volunteering" => {
    if (cat === "military") return "Military";
    if (cat === "volunteer") return "Volunteering";
    return "Work";
  };

  const groups = new Map<
    "Work" | "Military" | "Volunteering",
    typeof experiences
  >();
  for (const e of experiences) {
    const k = labelOf(e.category ?? "work");
    const list = (groups.get(k) ?? []) as typeof experiences;
    list.push(e);
    groups.set(k, list);
  }

  // Stable visible order: Work first, then Military, then Volunteering.
  const order: Array<"Work" | "Military" | "Volunteering"> = [
    "Work",
    "Military",
    "Volunteering",
  ];

  return (
    <div className="mt-1.5 space-y-3">
      {order.map((cat) => {
        const list = groups.get(cat);
        if (!list || list.length === 0) return null;
        return (
          <div key={cat}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--on-surface-muted)]">
              {cat} ({list.length})
            </p>
            <div className="space-y-2">
              {list.map((exp, i) => (
                <div
                  key={i}
                  className="rounded-[10px] bg-[var(--surface-sunk)]/50 px-3 py-2"
                >
                  <p className="text-sm text-[var(--on-surface-soft)]">
                    {exp.title}{" "}
                    <span className="text-[var(--on-surface-muted)]">
                      · {exp.company}
                    </span>
                  </p>
                  {(exp.startDate || exp.endDate || exp.isCurrent) && (
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--on-surface-muted)]">
                      {exp.startDate?.slice(0, 7) ?? "?"} —{" "}
                      {exp.isCurrent
                        ? "Present"
                        : (exp.endDate?.slice(0, 7) ?? "?")}
                    </p>
                  )}
                  {exp.bullets.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-[12px] text-[var(--on-surface-muted)]">
                      {exp.bullets.map((b, j) => (
                        <li key={j} className="line-clamp-2">
                          · {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkillsByCategory({
  skills,
}: {
  skills: Array<{ name: string; category: string | null }>;
}) {
  if (skills.length === 0) {
    return (
      <p className="mt-1.5 text-sm text-[var(--on-surface-muted)]">—</p>
    );
  }

  // Group skills by category. Items without a category go into "Other"
  // so something always renders, even with sparse parser output.
  const groups = new Map<string, string[]>();
  for (const s of skills) {
    const key = s.category?.trim() || "Other";
    const list = groups.get(key) ?? [];
    list.push(s.name);
    groups.set(key, list);
  }

  // Stable order: Languages first, then Programming Languages, then
  // everything else alphabetical.
  const priority = (k: string) => {
    if (k === "Languages") return 0;
    if (k === "Programming Languages") return 1;
    if (k === "Frameworks") return 2;
    if (k === "Tools") return 3;
    if (k === "Soft Skills") return 4;
    if (k === "Other") return 99;
    return 50;
  };
  const ordered = [...groups.entries()].sort(
    (a, b) => priority(a[0]) - priority(b[0]) || a[0].localeCompare(b[0]),
  );

  return (
    <div className="mt-1.5 space-y-1.5">
      {ordered.map(([cat, names]) => (
        <div key={cat} className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--on-surface-muted)]">
            {cat}
          </span>
          <span className="text-sm text-[var(--on-surface-soft)]">
            {names.join(" · ")}
          </span>
        </div>
      ))}
    </div>
  );
}
