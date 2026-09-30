# End-to-end tests

These tests drive the real app in a real browser against the **real Supabase
backend** — there is no mocking. Running them creates and deletes actual rows
in the live database.

## Safety

Every record a test creates is named with an `[e2e]` prefix (see
`uniqueName()` in `fixtures.js`), and `afterEach` hooks sweep up anything
matching that tag after every test, regardless of whether the test passed or
failed. Nothing else in the database is touched.

## Running

```bash
npm run test:e2e
```

This starts a local dev server automatically and runs against it. Requires
`frontend/.env.local` to have:

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (same as the app itself)
- `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` — a real admin login the suite signs
  in with. There is **no hardcoded fallback** (this repo is public), so the
  suite refuses to run without these set.

To run against an already-deployed site instead of a local server:

```bash
BASE_URL=https://your-deployment.vercel.app npm run test:e2e
```

## Why this isn't wired into CI

These tests need real credentials and mutate a real database on every run.
GitHub Actions CI (`.github/workflows/ci.yml`) only runs the fast, offline
unit tests (`npm test`) and a production build check — both safe to run
automatically on every push with no secrets involved. Run this suite manually
before a release, or ask to have it added to CI if that tradeoff becomes
worth it later.
