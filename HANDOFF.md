# Handoff Notes

Last updated: 2026-04-16

This doc exists so a new Claude (or human) session can catch up fast. For the deep architecture, see `CLAUDE.md` and `src/db/schema.ts`. This is the "what's actually going on right now" summary.

## What the product is

**The Architect** — an AI resume workspace. Users build a structured career profile once, then create many resume versions from it. Each resume has its own arrangement, overrides, and tailoring. Block editor + AI rewrites + job tailoring + version history + PDF export.

Target user: high-volume job applicants who need to tailor resumes fast.

## Tech stack (confirmed working)

- Next.js 15 (App Router) — latest installed is 16.2.x via Turbopack
- Supabase (Postgres + Auth + Storage)
- Drizzle ORM with singleton client (`src/db/index.ts`) to avoid connection exhaustion
- @base-ui/react + shadcn/ui (v4) — note the Base UI switch means `<DialogTrigger>` uses `render={<Button />}` instead of `asChild`
- Tailwind CSS v4
- Google Gemini 2.0 Flash via Vercel AI SDK v6 + `@ai-sdk/google` (Anthropic package is still in `package.json` but not used)
- Puppeteer for PDF export
- Web Speech API for voice input (no dependency needed)
- zod for AI tool schemas

## Current state of features

### Fully working
- Auth (email + Google OAuth) — signup is idempotent via `ensureUserInDb()` helper in `src/app/(auth)/actions.ts`
- Career profile CRUD (all six entity types)
- Resume creation from profile (auto-populates blocks)
- Block editor with drag-and-drop reordering and visibility toggles
- Inline editing on every field — bullets, headings, dates, skills, all of it
- Five distinct templates (Modern Clean, Executive, Accent Modern, Two-Column, Compact) driven by style tokens in `src/templates/styles.ts`
- Template switching in editor + PDF export both use the same tokens
- Add/remove items, add bullets, add custom sections
- Preview/Editor/History tabs in toolbar actually switch modes
- Version history: save named versions, preview past version as a fully-rendered resume, restore (auto-saves current state before restoring), delete
- PDF export via Puppeteer at `/api/pdf/[id]`
- Resume parser (PDF upload + text paste → AI structured extraction)
- Job tailoring panel (paste JD → match score + keyword gaps + suggestions)
- Application tracker with kanban columns
- AI chat sidebar with tool calling (`/api/ai/chat`) — 7 tools: updateSummary, rewriteBullet, hideBullet, toggleItemVisibility, toggleBlockVisibility, reorderBlocks, renameSection
- Voice input in AI chat (mic button, Web Speech API, Chrome/Edge/Safari only)

### UX complete but blocked by external
- All AI features (rewrite popover, review panel, job tailoring, chat, resume parser) — code paths verified, but Gemini API quota is exhausted on the current free-tier key. The wiring is confirmed working; just need fresh quota or billing enabled.

### Not built yet
- DOCX export
- LinkedIn import
- Intelligence/analytics layer (Phase 11 in original plan)
- Multi-user collaboration
- Third template beyond the five

## Key files to know

| File | Why it matters |
|------|----------------|
| `src/db/schema.ts` | All 16 tables |
| `src/db/index.ts` | Singleton client with `max: 5` connections — critical for dev HMR |
| `src/lib/resume/resolve.ts` | `resolveResume(id)` for live resumes, `resolveSnapshot()` for version previews |
| `src/lib/resume/types.ts` | All resolved types |
| `src/templates/styles.ts` | Design tokens for all five templates |
| `src/templates/registry.ts` | Template lookup |
| `src/templates/renderer.tsx` | Non-interactive renderer used by PDF export AND the Preview tab |
| `src/components/editor/interactive-resume.tsx` | The big one — the editable preview, uses tokens |
| `src/components/editor/editor-shell.tsx` | Toolbar + three-tab layout (Editor / Preview / History) |
| `src/components/editor/editable-text.tsx` | Click-to-edit with empty-field fix (`inline-block min-w-[1.5ch]`) |
| `src/components/editor/editable-date-range.tsx` | Date popover (uses portal to escape overflow clipping) |
| `src/components/editor/version-history.tsx` | Version timeline + preview dialog that renders the actual resume |
| `src/components/editor/ai-chat-panel.tsx` | Chat UI with mic button |
| `src/hooks/use-speech-recognition.ts` | Web Speech API wrapper |
| `src/app/(dashboard)/resumes/actions.ts` | Biggest action file — CRUD + versioning + add/remove items/sections/bullets |
| `src/app/(dashboard)/profile/actions.ts` | Profile CRUD + date updates (dates update profile source, not per-resume) |
| `src/app/api/ai/chat/route.ts` | Tool-calling agent, max 8 steps |

## Recent changes (last 10 commits, most recent first)

1. **8c67d09** Signup idempotency — `ensureUserInDb()` checks if user row exists before inserting, wrapped in try-catch. Fixes crash when a user signs up twice.
2. **163f1d7** Voice input in AI chat — new `useSpeechRecognition` hook, mic button with red pulse while listening, interim + final transcripts append to input.
3. **d28746f** Version preview now renders the actual resume (using `TemplateRenderer`) instead of useless metadata counts. New `resolveSnapshot()` resolves snapshot against current profile data.
4. **a3c0bc3** Wrapped version actions in try-catch; removed stale `formatDateRange` import that caused runtime errors.
5. **a80c170** Full version history — save / list / preview / restore / delete. Auto-saves current state before restore. Snapshot stores block structure only (not profile data).
6. **031a178** Preview/Editor/History tabs actually switch modes (previously they just updated state but rendered the same thing).
7. **4042557** Templates made actually distinct via token system — 5 templates now, including a Two-Column layout with sidebar.
8. **5802ace** Add-item / add-bullet / add-section buttons in the editor. Custom sections supported (stored entirely in overrides JSONB).
9. **4162f4c** Empty fields (like GPA) now clickable — `inline-block min-w-[1.5ch]`. Dates also editable via popover.
10. **8c26eb7** All resume fields editable with proper override merging.

## Known gotchas

- **DB connection pool** limit is 15 on Supabase free tier. Dev HMR can accumulate connections; if queries start failing with "max clients reached," kill stale node processes and restart. The singleton in `src/db/index.ts` caps us at 5 per process.
- **Database URL must use Session Pooler** (IPv4 compatible) — `aws-X-REGION.pooler.supabase.com`, not the direct `db.PROJECT.supabase.co` hostname. URL-encode the `$` in passwords as `%24`.
- **Supabase signup rate limit** — free tier limits confirmation emails to 2/hour per address. Disable "Confirm email" in Auth settings during dev.
- **Base UI dialog trigger** — use `<DialogTrigger render={<Button />}>` not `asChild`. This tripped us up multiple times.
- **Port 3000 often taken** on this machine — dev server falls back to 3001. Site URL + redirect URL in Supabase Auth config were set to `http://localhost:3001/auth/callback`.
- **Gemini free tier quota is exhausted** on the current API key. All AI features show errors until quota refreshes or billing is enabled.
- **Server actions returning `{ error }`** — the resume versioning actions use try-catch so they always return structured errors. Older actions may throw raw errors; if you see "unexpected response from server" in the browser, wrap the action in try-catch.
- **Puppeteer package is `puppeteer` (full, ~200MB)**, not `puppeteer-core`. Works locally but too big for Vercel serverless. For Vercel deploy, swap to `puppeteer-core + @sparticuz/chromium`.

## Deploy status

- Repo is at `https://github.com/amitfidel/resume-maker`
- **Not yet deployed** to any hosting. User is evaluating Vercel vs Railway.
- Setup instructions in the README-style guide sent to a friend: create own Supabase project, run `npm run db:push`, configure redirect URLs, set env vars, `npm run dev`.

## Environment variables needed

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL                         # session pooler URI
GOOGLE_GENERATIVE_AI_API_KEY         # Gemini
```

## If you're jumping in to work on this

- Product brief was in the first message of the session that built this. Target is "Gamma for resumes" — block editor, AI inside the doc flow, not a chatbot slapped onto a document.
- Design language is "The Curated Architect" from `stitch_career_flow_workspace.zip`. Key tokens: deep navy `#182034` primary, indigo `#2b0066` tertiary (AI/Magic), Manrope headlines + Inter body. "No-line rule" — sections divided by tonal background shifts, not borders.
- When adding UI, favor tonal layers and ambient shadows over borders. Magical elements (AI) use the `magical-gradient` or `magical-surface` utility classes.
- The override model is the heart of the data layer. Anything you add that varies per-resume should live in `resume_block_items.overrides` JSONB, not mutate the profile.
