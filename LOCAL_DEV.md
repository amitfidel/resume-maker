# Local dev — Supabase on Docker

The cloud Supabase project was replaced with a **local stack running on Docker**. Zero app code changed; only env vars point elsewhere. Both Postgres and Auth (email/password + OAuth) run locally.

## Ports (picked to not collide with other Supabase projects)

| Service              | URL                          |
| -------------------- | ---------------------------- |
| API gateway + Auth   | `http://127.0.0.1:55321`     |
| Postgres             | `postgres://…@127.0.0.1:55322/postgres` |
| Studio (DB browser)  | `http://127.0.0.1:55323`     |
| Mailpit (fake SMTP)  | `http://127.0.0.1:55324`     |

Default Supabase ports (54321-54329) stay free for other projects.

## First-time setup

Already done for you. For reference:

```bash
npm install                    # includes supabase CLI as a devDependency
npm run sb:start               # pulls images, starts all containers
npm run db:push                # drizzle creates 16 tables in local Postgres
```

`.env.local` was created with the local stack's keys. It is gitignored.

## Daily use

```bash
npm run sb:start               # boot the stack (idempotent; fast after first run)
npm run dev                    # Next.js on http://localhost:3001
npm run sb:stop                # shut everything down
npm run sb:status              # list service URLs + keys
npm run sb:reset               # wipe DB + re-run drizzle schema (destructive)
```

Open **Studio at `http://127.0.0.1:55323`** to browse tables / run SQL. No login needed.

## How email/password signup works locally

- `enable_confirmations = false` in `supabase/config.toml` — users are auto-confirmed; no email needed.
- Any emails the app *would* send (password reset, invite) are captured by **Mailpit** at `http://127.0.0.1:55324`. Open that URL to read them.

## Google OAuth locally

Currently disabled in local config (`[auth.external.google]` block is commented out). Email/password works out of the box. To enable Google OAuth against your *own* dev-mode Google client:

1. In Google Cloud Console, add `http://127.0.0.1:55321/auth/v1/callback` as an authorized redirect URI.
2. Add this to `supabase/config.toml`:
   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(GOOGLE_CLIENT_ID)"
   secret = "env(GOOGLE_CLIENT_SECRET)"
   redirect_uri = "http://127.0.0.1:55321/auth/v1/callback"
   skip_nonce_check = true
   ```
3. Put `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in `.env.local`.
4. `npm run sb:stop && npm run sb:start` to pick up the new config.

## Switching back to cloud Supabase

If you ever reanimate a cloud project: comment out Option A in `.env.local`, uncomment Option B in `.env.example` with your project's URL/keys/pooler DB URL. No code changes.

## Data loss

`npm run sb:reset` drops all data and re-applies the Drizzle schema. The Supabase CLI also wipes data when you `supabase stop --no-backup`. Use `npm run sb:stop` (plain `stop`) to preserve.
