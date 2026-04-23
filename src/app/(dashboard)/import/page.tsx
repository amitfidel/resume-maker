"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { saveImportedProfile } from "./actions";

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
  const [pasteText, setPasteText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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
    setIsLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
  }, [parsed]);

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
              Paste text
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-[var(--on-surface-muted)] data-[state=active]:bg-[var(--surface-raised)] data-[state=active]:text-[var(--on-surface)] data-[state=active]:shadow-[var(--sh-1)]"
            >
              Upload PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder="Paste your resume text here…"
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
                  Parsing…
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Parse resume
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
                Upload a PDF resume file
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
                  Parsing PDF…
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <div className="resumi-card p-6">
            <h2 className="font-headline text-[24px] font-normal tracking-[-0.01em]">
              Parsed <em className="serif-ital">results</em>
            </h2>
            <p className="mt-0.5 text-sm text-[var(--on-surface-muted)]">
              Review the extracted data before saving to your profile.
            </p>
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <ParsedField label="Name" value={parsed.fullName} />
                <ParsedField label="Headline" value={parsed.headline} />
                <ParsedField label="Email" value={parsed.email} />
                <ParsedField label="Location" value={parsed.location} />
              </div>

              {parsed.summary && <ParsedField label="Summary" value={parsed.summary} />}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  Work experience ({parsed.workExperiences.length})
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {parsed.workExperiences.map((exp, i) => (
                    <p key={i} className="text-sm text-[var(--on-surface-soft)]">
                      {exp.title} <span className="text-[var(--on-surface-muted)]">· {exp.company}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  Education ({parsed.education.length})
                </p>
                <div className="mt-1.5 space-y-0.5">
                  {parsed.education.map((edu, i) => (
                    <p key={i} className="text-sm text-[var(--on-surface-soft)]">
                      {edu.degree} <span className="text-[var(--on-surface-muted)]">— {edu.institution}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  Skills ({parsed.skills.length})
                </p>
                <p className="mt-1.5 text-sm text-[var(--on-surface-soft)]">
                  {parsed.skills.map((s) => s.name).join(" · ") || "—"}
                </p>
              </div>
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
                  Saving…
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save to profile
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setParsed(null)}
              className="h-11 rounded-full border-0 bg-[var(--surface-raised)] px-5 text-[var(--on-surface)] shadow-[inset_0_0_0_1px_var(--border-ghost-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink)]"
            >
              Start over
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
