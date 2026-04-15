# Resume Maker

AI-powered resume workspace built with Next.js 15, Supabase, Drizzle ORM, and Google Gemini.

## Quick Start

```bash
npm install
npm run dev          # starts on localhost:3001 (if 3000 is taken)
npm run db:push      # push schema to Supabase
npm run db:studio    # open Drizzle Studio
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **UI**: shadcn/ui (Base UI) + Tailwind CSS v4
- **Database**: PostgreSQL via Supabase (session pooler for IPv4)
- **ORM**: Drizzle ORM
- **AI**: Google Gemini 2.0 Flash via Vercel AI SDK + @ai-sdk/google
- **PDF**: Puppeteer for export
- **Auth**: Supabase Auth (email + Google OAuth)

## Architecture

### Override Model
Career profile is source of truth. Resumes store sparse JSONB overrides in `resume_block_items.overrides`. Resolution: load profile item -> deep merge with overrides -> render. See `src/lib/resume/resolve.ts`.

### Templates
Templates are React components in `src/templates/<slug>/`. Registry at `src/templates/registry.ts`. Each template receives `{ resume, mode }` where mode is 'edit' | 'preview' | 'export'.

### AI
API routes at `src/app/api/ai/`. Prompt templates at `src/lib/ai/prompts/`. Uses `generateText()` from Vercel AI SDK with `@ai-sdk/google` provider.

## Key Files

- `src/db/schema.ts` — All 16 database tables
- `src/lib/resume/resolve.ts` — Override resolution engine
- `src/lib/resume/types.ts` — Resolved resume types
- `src/templates/registry.ts` — Template lookup
- `src/components/editor/` — Editor components (block list, preview, AI panels)
- `src/app/(dashboard)/resumes/actions.ts` — Resume CRUD server actions
- `src/app/(dashboard)/profile/actions.ts` — Profile CRUD server actions

## DB Connection Note
The DB client uses a singleton pattern (`src/db/index.ts`) to prevent connection pool exhaustion during dev hot reloads. Max 5 connections.
