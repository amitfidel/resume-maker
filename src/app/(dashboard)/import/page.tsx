"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        <h1 className="text-3xl font-bold tracking-tight">Import Resume</h1>
        <p className="mt-1 text-muted-foreground">
          Upload a PDF or paste your resume text. AI will extract structured
          data into your career profile.
        </p>
      </div>

      {!parsed ? (
        <Tabs defaultValue="paste">
          <TabsList>
            <TabsTrigger value="paste">Paste Text</TabsTrigger>
            <TabsTrigger value="upload">Upload PDF</TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <Textarea
              placeholder="Paste your resume text here..."
              rows={12}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
            <Button onClick={handlePasteSubmit} disabled={isLoading || !pasteText.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Parse Resume
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="mb-4 text-sm text-muted-foreground">
                  Upload a PDF resume file
                </p>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  disabled={isLoading}
                  className="max-w-xs"
                />
                {isLoading && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Parsing PDF...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parsed Results</CardTitle>
              <CardDescription>
                Review the extracted data before saving to your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-sm text-muted-foreground">
                    {parsed.fullName || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Headline</p>
                  <p className="text-sm text-muted-foreground">
                    {parsed.headline || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">
                    {parsed.email || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    {parsed.location || "—"}
                  </p>
                </div>
              </div>

              {parsed.summary && (
                <div>
                  <p className="text-sm font-medium">Summary</p>
                  <p className="text-sm text-muted-foreground">
                    {parsed.summary}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium">
                  Work Experience ({parsed.workExperiences.length})
                </p>
                {parsed.workExperiences.map((exp, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {exp.title} at {exp.company}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium">
                  Education ({parsed.education.length})
                </p>
                {parsed.education.map((edu, i) => (
                  <p key={i} className="text-sm text-muted-foreground">
                    {edu.degree} — {edu.institution}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-sm font-medium">
                  Skills ({parsed.skills.length})
                </p>
                <p className="text-sm text-muted-foreground">
                  {parsed.skills.map((s) => s.name).join(", ") || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save to Profile
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setParsed(null)}>
              Start Over
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}
    </div>
  );
}
