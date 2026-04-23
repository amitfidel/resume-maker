# Setting up Resume Maker on your PC

Hi! This project was built with an AI assistant. If you're not sure how to set it up yourself, the easiest way is to **open ChatGPT, Claude, or any AI coding assistant, paste this whole file into the chat, and say:**

> "I just pulled this project from GitHub. Please walk me through setting it up on my computer, step by step, waiting for me to confirm each step is done before moving on. My operating system is [Windows / macOS / Linux]."

The AI will take it from there.

If you're comfortable with a terminal, skip to the "Quick path" section at the bottom.

---

## FOR YOUR AI ASSISTANT — read everything below

You are helping a non-developer friend set up a Next.js project on her personal computer. The project is complete; she just needs to install a few tools, clone the repo, and run some commands. **Proceed one step at a time. After each command, ask her to paste the terminal output so you can confirm it worked before moving on.** Don't dump the whole guide at once — she'll get overwhelmed.

### Project context

- **What it is**: "Resumi" — an AI-powered resume workspace. Block-based editor with live preview, AI writing assistance, job tailoring, and resume version tracking.
- **Repo**: https://github.com/amitfidel/resume-maker.git
- **Branch to use**: `claude/stoic-babbage-fc479a` (the main working branch — not `main`)
- **Tech stack**: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 · shadcn/ui · Drizzle ORM · PostgreSQL · Supabase (running locally via Docker) · Google Gemini API for AI features
- **Architecture gist**: A career-profile database is the "source of truth". Each resume draws from the profile and stores sparse overrides. Auth and DB both run locally via the Supabase CLI's Docker stack — no cloud service required.

### What's already in the repo she'll clone

- `LOCAL_DEV.md` — daily-use commands once setup is done
- `supabase/config.toml` — pre-configured ports (55321-55324)
- All the code

### What's NOT in the repo (she needs to create/obtain)

- `.env.local` file with secrets — template below
- Her own Google Gemini API key (free tier works)

### Her system requirements

Ask which OS she's on first. Then install:

| Tool | Why | Install on Windows | Install on macOS | Install on Linux |
|---|---|---|---|---|
| **Git** | To clone the repo | https://git-scm.com/download/win | `brew install git` or Xcode Command Line Tools | `sudo apt install git` (Ubuntu/Debian) |
| **Node.js 20+** | Runtime | https://nodejs.org (LTS installer) | `brew install node` | Use nvm: https://github.com/nvm-sh/nvm |
| **Docker Desktop** | Runs local Postgres + auth | https://www.docker.com/products/docker-desktop | https://www.docker.com/products/docker-desktop | https://docs.docker.com/engine/install |

**Before any Supabase command, Docker Desktop must be running.** On Windows/Mac, that means the Docker whale icon is in the system tray/menu bar and not shown as "starting". On Linux, `systemctl status docker` should say active.

Verify each tool installed correctly before moving on:
```bash
git --version      # should print something like "git version 2.x.x"
node --version     # should print "v20.x.x" or higher
npm --version      # should print "10.x.x" or higher
docker --version   # should print "Docker version 2x.x.x"
docker ps          # should print a table with no errors (even if empty)
```

If any fail, help her fix that before moving on.

### Step 1: Clone the repo

Open a terminal (Terminal.app on Mac, PowerShell on Windows, or any terminal on Linux). Pick a folder to put the project in — Documents is fine. Then:

```bash
cd Documents                                              # or wherever she wants it
git clone https://github.com/amitfidel/resume-maker.git
cd resume-maker
git checkout claude/stoic-babbage-fc479a
```

The branch checkout is important — the latest work lives there, not on `main`.

### Step 2: Install dependencies

```bash
npm install
```

This takes 1-3 minutes. It also installs the Supabase CLI locally (no global install needed). If she sees "vulnerabilities" warnings at the end, they're not errors — ignore them.

### Step 3: Start the local Supabase stack

**Make sure Docker Desktop is running first.** Then:

```bash
npm run sb:start
```

**The first time, this pulls ~2GB of Docker images. Expect 2-5 minutes.** Subsequent starts take 15-30 seconds.

When it finishes, she'll see a block of output with URLs and keys. The important ones look like:

```
API URL: http://127.0.0.1:55321
DB URL:  postgresql://postgres:postgres@127.0.0.1:55322/postgres
Studio URL: http://127.0.0.1:55323
anon key: eyJhbGciOi... (a very long JWT)
```

Have her copy the full `anon key` value — she'll need it in step 5.

### Step 4: Create the database tables

```bash
npm run db:push
```

This uses Drizzle to create all 16 tables. Should finish in under 10 seconds and print "Changes applied."

### Step 5: Create the `.env.local` file

This is the one file that has to be created manually — it's not in the repo because it holds secrets.

Have her create a new file named **exactly** `.env.local` in the project root (same folder as `package.json`). On Windows, she can do this from the terminal:

```bash
# On Mac/Linux:
touch .env.local

# On Windows PowerShell:
New-Item -Path .env.local -ItemType File
```

Then open it in any text editor (Notepad, VS Code, whatever she has). Paste this content and adjust as noted:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_ANON_KEY=PASTE_THE_ANON_KEY_FROM_STEP_3_HERE
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55322/postgres
GOOGLE_GENERATIVE_AI_API_KEY=SHE_NEEDS_HER_OWN_KEY
```

The Supabase anon key: paste the long JWT from step 3's output. If she can't find it, she can re-print it any time with:
```bash
npx supabase status -o env
```
and look for the `ANON_KEY=` line.

**Gemini API key**: she needs her own. It's free. Walk her through:
1. Go to https://aistudio.google.com/apikey
2. Sign in with any Google account
3. Click "Create API key"
4. Copy the generated key, paste it into `.env.local` replacing `SHE_NEEDS_HER_OWN_KEY`

If she skips this, the app still runs — just AI chat, AI review, AI tailoring, and AI rewrite features won't work. She can add the key later.

Save and close the file.

### Step 6: Run the app

```bash
npm run dev
```

After ~5-10 seconds it prints `Ready in X.Xs` and a URL. Open a browser to **http://localhost:3001**.

She should see the Resumi landing page. Clicking "Get started" or going to /signup lets her create an account (all local — no email verification required).

### Verifying everything works

Walk her through this checklist:
1. Landing page loads at http://localhost:3001 — **works**
2. Sign up with any email + password (e.g. test@test.com / testpass1) — **works** (no email confirmation needed locally)
3. She lands in the dashboard — **works**
4. Click "New resume" — creates a resume, opens the editor — **works**
5. On the left, type in any field — right-side preview updates as she types — **works**
6. (Optional, only if Gemini key is set) Click "AI Chat" in the toolbar and say "hi" — gets a response — **AI works**

Open Supabase Studio at http://127.0.0.1:55323 to browse the database if curious. No login.

### Daily workflow (after setup is done)

In one terminal:
```bash
npm run sb:start    # start Docker stack (idempotent — safe to re-run)
npm run dev         # start Next.js
```

When done for the day:
```bash
npm run sb:stop     # stops Docker containers (keeps her data)
```

Full command reference is in `LOCAL_DEV.md` in the repo.

### Troubleshooting — common failures and fixes

If she runs into issues, ask her what the exact error message is, then:

- **"docker: command not found" or "Cannot connect to the Docker daemon"**
  Docker Desktop isn't running. Open it from Start Menu / Applications, wait for the whale icon to stop spinning, try again.

- **"Port 55321 is already in use" (or 55322, 55323, 55324)**
  Another Supabase stack is running on her machine. She can either stop it (`supabase stop` in whichever project owns those ports) or change our ports by editing `supabase/config.toml` — bump each port by 1000 (so 56321-56324), then update `.env.local` URLs + DATABASE_URL to match.

- **`npm install` errors about peer dependencies**
  Most are warnings, not errors. If it refuses to install, try `npm install --legacy-peer-deps`.

- **`npm run db:push` fails with "connect ECONNREFUSED 127.0.0.1:55322"**
  Supabase isn't running. Run `npm run sb:start` first, wait for it to finish, then retry.

- **`npm run dev` prints "Port 3000 is in use, using 3001" — or similar**
  Normal. Just use the port it prints.

- **Sign up succeeds but dashboard crashes with "invalid token" or similar**
  The anon key in `.env.local` doesn't match what the local Supabase generated. Run `npx supabase status -o env` and copy the `ANON_KEY=` value again carefully (it's very long — make sure there's no line break in the middle when she pastes).

- **"GOOGLE_GENERATIVE_AI_API_KEY is required" when using AI features**
  She didn't set the Gemini key. Follow step 5's Gemini sub-steps.

- **On Windows: weird path errors or "is not recognized as the name of a cmdlet"**
  She's probably in CMD instead of PowerShell. Ask her to use PowerShell or Git Bash.

- **Everything says "permission denied" on Mac**
  She may need to give her terminal Full Disk Access in System Settings → Privacy & Security, or the project is in a protected folder (iCloud Desktop, etc.). Move it to `~/Documents/resume-maker` if so.

- **Hydration mismatch error in the browser console mentioning `fdprocessedid`**
  Already handled in the code. If she still sees it, it's a browser extension (Edge autofill, LastPass, etc.) — harmless, can ignore.

### What about her data?

She gets a fresh, empty database. Account + resumes she creates are hers alone, stored locally. If she wants to import data from somewhere else (e.g. a PDF resume), the app has a built-in `/import` page once she's logged in.

### When she's done

Tell her:
- `npm run sb:stop` to shut down Docker containers (data persists)
- Close the terminal running `npm run dev`
- That's it — she can pick up any time with `sb:start` + `dev`

---

## Quick path (if you know your way around a terminal)

```bash
# Prereqs: Git, Node 20+, Docker Desktop (running)

git clone https://github.com/amitfidel/resume-maker.git
cd resume-maker
git checkout claude/stoic-babbage-fc479a
npm install
npm run sb:start                        # pulls ~2GB first time
npm run db:push

# Create .env.local — see template in "Step 5" above
# Get Gemini key at https://aistudio.google.com/apikey

npm run dev                             # http://localhost:3001
```

Full details in `LOCAL_DEV.md`.
