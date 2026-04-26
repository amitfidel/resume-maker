"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  FileText,
  Plus,
  Sparkles,
  Trash2,
  Download,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";
import {
  createCoverLetter,
  deleteCoverLetter,
  listCoverLetters,
  saveGeneratedCoverLetter,
  updateCoverLetter,
} from "@/app/(dashboard)/cover-letters/actions";
import { useT, useI18n } from "@/lib/i18n/context";
import type { CoverLetter } from "@/db/schema";

type Tone = "formal" | "direct" | "warm";

/**
 * Cover-letter workspace. Lives inside the resume editor as a 4th
 * top-level tab. Left rail lists the user's existing letters for this
 * resume, right pane is the editor: title, recipient bits, JD, body.
 *
 * The body field is a free textarea — the user can edit anything the
 * AI emits. "Generate" hits /api/ai/cover-letter and streams deltas
 * straight into the textarea; "Save" persists what's there.
 */
export function CoverLetterView({ resumeId }: { resumeId: string }) {
  const t = useT();
  const { locale } = useI18n();
  const confirm = useConfirm();

  const [letters, setLetters] = useState<CoverLetter[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const generationAbort = useRef<AbortController | null>(null);

  // Local form state — debounced save back to the row.
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCompany, setRecipientCompany] = useState("");
  const [tone, setTone] = useState<Tone>("direct");

  const refreshList = useCallback(async () => {
    const list = await listCoverLetters(resumeId);
    setLetters(list);
    if (!activeId && list.length > 0) {
      setActiveId(list[0].id);
    } else if (activeId && !list.some((l) => l.id === activeId)) {
      // Active letter was deleted from elsewhere — pick the first.
      setActiveId(list[0]?.id ?? null);
    }
  }, [resumeId, activeId]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  // Hydrate the form whenever the active letter changes.
  useEffect(() => {
    if (!letters) return;
    const cl = letters.find((l) => l.id === activeId);
    if (!cl) {
      setTitle("");
      setBody("");
      setJobDescription("");
      setRecipientName("");
      setRecipientCompany("");
      return;
    }
    setTitle(cl.title);
    setBody(cl.body);
    setJobDescription(cl.jobDescription ?? "");
    setRecipientName(cl.recipientName ?? "");
    setRecipientCompany(cl.recipientCompany ?? "");
  }, [activeId, letters]);

  const activeLetter = useMemo(
    () => letters?.find((l) => l.id === activeId) ?? null,
    [letters, activeId],
  );

  const handleNew = useCallback(() => {
    startTransition(async () => {
      const result = await createCoverLetter(resumeId);
      const newId = (result as { id?: string }).id;
      if (newId) {
        await refreshList();
        setActiveId(newId);
      }
    });
  }, [resumeId, refreshList]);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: t("cl.confirm.delete.title"),
        description: t("cl.confirm.delete.desc"),
        confirmLabel: t("cl.confirm.delete.cta"),
        destructive: true,
      });
      if (!ok) return;
      startTransition(async () => {
        await deleteCoverLetter(id);
        await refreshList();
      });
    },
    [confirm, refreshList, t],
  );

  const handleSave = useCallback(async () => {
    if (!activeId) return;
    setIsSaved(false);
    startTransition(async () => {
      await updateCoverLetter(activeId, {
        title,
        body,
        jobDescription: jobDescription || null,
        recipientName: recipientName || null,
        recipientCompany: recipientCompany || null,
      });
      setIsSaved(true);
      // Visible "Saved" badge for 2s.
      window.setTimeout(() => setIsSaved(false), 2000);
      await refreshList();
    });
  }, [
    activeId,
    title,
    body,
    jobDescription,
    recipientName,
    recipientCompany,
    refreshList,
  ]);

  const handleGenerate = useCallback(async () => {
    if (!activeId) return;
    if (isGenerating) {
      generationAbort.current?.abort();
      setIsGenerating(false);
      return;
    }

    // Snapshot the JD/recipient into the row before generating so the
    // server-side prompt sees the latest values, not whatever was
    // persisted by an earlier save.
    await updateCoverLetter(activeId, {
      jobDescription: jobDescription || null,
      recipientName: recipientName || null,
      recipientCompany: recipientCompany || null,
    });

    const controller = new AbortController();
    generationAbort.current = controller;
    setIsGenerating(true);
    setBody(""); // Clear and stream into the textarea.

    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ coverLetterId: activeId, tone }),
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setBody(accumulated);
      }

      // Persist the final body. The server action also re-saves the
      // JD/recipient bits.
      await saveGeneratedCoverLetter(
        activeId,
        accumulated,
        jobDescription || null,
      );
      await refreshList();
    } catch (err) {
      // Abort is silent.
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Cover letter generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [
    activeId,
    isGenerating,
    jobDescription,
    recipientName,
    recipientCompany,
    tone,
    refreshList,
  ]);

  // Empty state — no letters yet.
  if (letters && letters.length === 0) {
    return (
      <div className="mx-auto max-w-[640px] py-16 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-[14px] bg-[var(--surface-sunk)]">
          <FileText className="h-6 w-6 text-[var(--on-surface-soft)]" />
        </div>
        <h2 className="font-headline mt-5 text-[28px] font-normal tracking-[-0.015em]">
          {t("cl.empty.title.part1")}{" "}
          <em className="serif-ital text-[var(--magic-1)] dark:text-[var(--magic-2)]">
            {t("cl.empty.title.italic")}
          </em>
          .
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-[var(--on-surface-muted)]">
          {t("cl.empty.lead")}
        </p>
        <Button
          onClick={handleNew}
          disabled={isPending}
          className="magical-gradient magic-shine mt-6 h-11 rounded-full px-5 text-[14px]"
        >
          <Plus className="me-1.5 h-4 w-4" />
          {t("cl.empty.cta")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1100px] gap-6 p-6">
      {/* Left rail: list of letters */}
      <aside className="w-[260px] shrink-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[11px] uppercase tracking-[0.18em] text-[var(--on-surface-muted)]">
            {t("cl.list.heading")}
          </h3>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNew}
            disabled={isPending}
            title={t("cl.list.new")}
            aria-label={t("cl.list.new")}
            className="h-7 w-7 rounded-[8px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ul className="space-y-1.5">
          {(letters ?? []).map((cl) => {
            const active = cl.id === activeId;
            return (
              <li key={cl.id}>
                <button
                  onClick={() => setActiveId(cl.id)}
                  className={`group flex w-full items-start gap-2 rounded-[10px] px-3 py-2.5 text-start transition-colors ${
                    active
                      ? "bg-[var(--magic-tint)] text-[var(--magic-1)]"
                      : "text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                  }`}
                >
                  <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">
                      {cl.title || t("cl.untitled")}
                    </div>
                    <div className="truncate text-[11px] text-[var(--on-surface-muted)]">
                      {new Date(cl.updatedAt).toLocaleDateString(
                        locale === "he" ? "he-IL" : "en-US",
                        { month: "short", day: "numeric" },
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Right pane: editor */}
      {activeLetter && (
        <div className="flex-1 min-w-0">
          <div className="resumi-card p-6">
            <div className="flex items-start justify-between gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                placeholder={t("cl.title.placeholder")}
                className="!h-auto max-w-[420px] !border-0 !bg-transparent !px-0 !text-[20px] !font-medium text-[var(--on-surface)] !shadow-none focus-visible:!ring-0"
              />
              <div className="flex items-center gap-2">
                {isSaved && (
                  <span className="inline-flex items-center gap-1 text-[12px] text-[var(--success)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t("cl.saved")}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSave}
                  disabled={isPending}
                  className="h-8 gap-1.5 rounded-full text-[12px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                >
                  <Save className="h-3 w-3" />
                  {t("common.save")}
                </Button>
                <a
                  href={`/api/cover-letter/${activeLetter.id}/pdf`}
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 rounded-full text-[12px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                    title={t("cl.export.pdf")}
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </Button>
                </a>
                <a
                  href={`/api/cover-letter/${activeLetter.id}/docx`}
                  download
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 rounded-full text-[12px] text-[var(--on-surface-soft)] hover:bg-[var(--surface-sunk)] hover:text-[var(--on-surface)]"
                    title={t("cl.export.docx")}
                  >
                    <Download className="h-3 w-3" />
                    DOCX
                  </Button>
                </a>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDelete(activeLetter.id)}
                  className="h-8 w-8 rounded-[8px] text-[var(--on-surface-muted)] hover:bg-[var(--destructive)]/10 hover:text-[var(--destructive)]"
                  title={t("cl.delete")}
                  aria-label={t("cl.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Recipient + JD */}
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  {t("cl.recipient.name")}
                </label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  onBlur={handleSave}
                  placeholder={t("cl.recipient.name.placeholder")}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                  {t("cl.recipient.company")}
                </label>
                <Input
                  value={recipientCompany}
                  onChange={(e) => setRecipientCompany(e.target.value)}
                  onBlur={handleSave}
                  placeholder={t("cl.recipient.company.placeholder")}
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                <span>{t("cl.jd.label")}</span>
                <span className="text-[10px] normal-case tracking-normal">
                  {jobDescription.length.toLocaleString()} / 16k
                </span>
              </label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                onBlur={handleSave}
                placeholder={t("cl.jd.placeholder")}
                rows={5}
                className="resize-y"
              />
            </div>

            {/* Tone + generate */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex rounded-full bg-[var(--surface-sunk)] p-[3px]">
                {(["formal", "direct", "warm"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTone(m)}
                    className={`rounded-full px-3 py-1 text-[12px] font-medium transition-all ${
                      tone === m
                        ? "bg-[var(--surface-raised)] text-[var(--on-surface)] shadow-[var(--sh-1)]"
                        : "text-[var(--on-surface-muted)] hover:text-[var(--on-surface-soft)]"
                    }`}
                  >
                    {t(`cl.tone.${m}`)}
                  </button>
                ))}
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isPending}
                className={
                  isGenerating
                    ? "magical-surface h-9 gap-2 rounded-full px-4"
                    : "magical-gradient magic-shine h-9 gap-2 rounded-full px-4"
                }
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t("cl.generate.cancel")}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    {body.trim() ? t("cl.generate.again") : t("cl.generate")}
                  </>
                )}
              </Button>
            </div>

            {/* Body editor */}
            <div className="mt-5">
              <label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--on-surface-muted)]">
                {t("cl.body.label")}
              </label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onBlur={handleSave}
                placeholder={t("cl.body.placeholder")}
                rows={18}
                className="resize-y font-body leading-[1.65]"
              />
              <p className="mt-2 text-[11px] text-[var(--on-surface-muted)]">
                {body.split(/\s+/).filter(Boolean).length} {t("cl.words")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
