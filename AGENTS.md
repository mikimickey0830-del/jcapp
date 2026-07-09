# AGENTS.md

## Project

JC-App is a Next.js web app for Junior Chamber organizations. The first target LOM is Tamashima JCI, but the data model must stay LOM-aware so that other LOMs can be added later.

## Current Architecture

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase
- Vercel deployment target
- iPhone-first responsive UI

## Development Rules

- Keep domain types in `types/`.
- Keep data access in `services/`.
- Keep page-friendly data helpers in `hooks/`.
- Do not import mock data from `lib/` directly inside `app/` or `components/`.
- Supabase credentials must be read from environment variables only.
- Never commit `.env.local`, Supabase secret keys, service role keys, logs, build output, or `node_modules`.
- Keep member base information separate from yearly role, committee, and permission data.
- Preserve `lom_id` in database design and service logic so future multi-LOM support remains possible.
- Keep UI readable on iPhone widths.

## Supabase Rules

- Use `lib/supabase/client.ts` for the browser/server public client.
- Use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the frontend app.
- Do not use or store `service_role` keys in this repository.
- RLS must remain enabled on production tables.
- Development select grants and permissive select policies are temporary. Replace them with LOM-scoped policies before production.

## Git Rules

- Default branch: `main`.
- Feature branches: `feature/<short-name>`.
- Fix branches: `fix/<short-name>`.
- Documentation branches: `docs/<short-name>`.
- Commit messages should be short and imperative, for example `Add Supabase member read`.
- Run TypeScript check and lint before creating a pull request.

## Suggested Workflow

1. Create a feature branch from `main`.
2. Implement a small scoped change.
3. Run checks.
4. Commit with a clear message.
5. Push the branch to GitHub.
6. Open a pull request into `main`.

## Naming

- LOM: `lom`
- Fiscal year: `fiscalYear`
- Member: `member`
- Committee: `committee`
- Position: `position`
- Annual assignment: `annualAssignment`
- Event: `event`
- Attendance response: `attendanceResponse`
- Document: `document`
- Notification: `notification`
- Announcement: `announcement`
