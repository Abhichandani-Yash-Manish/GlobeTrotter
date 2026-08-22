# Three-minute demo runbook

## Reset before judging

```bash
nvm use
npm ci
npm run reset-demo
npm run check
npm run dev
```

Open `http://localhost:3000`. Sign in with `demo@globetrotter.com` / `password123`.

## Rehearsed story

**0:00–0:25 — Product promise**

Show the landing page and say: “GlobeTrotter turns a multi-city idea into a dated, budget-aware itinerary that remains useful when shared.” Open the seeded European itinerary to prove database-backed content before signing in.

**0:25–1:30 — Persisted planning**

Use demo login. Open the European trip and add a destination with valid dates. Try an overlapping date once so the actionable validation appears. Reorder stops, refresh, and point out that the order persisted in SQLite. Browse a city’s activities and schedule one.

**1:30–2:10 — Budget and Trip Health**

Add a transport or stay cost. Show the total, category breakdown, daily average, remaining budget, and Trip Health changing after the mutation. Explain that the checks are deterministic rules—not an opaque AI claim.

**2:10–2:40 — Publish and copy**

Publish the trip, copy/open the public URL in a private window, and show that it works without authentication. Sign in and copy the public trip. Open the copy and explain that trips, stops, activities, and expenses were cloned transactionally and are now independent.

**2:40–3:00 — Engineering proof**

Show the ERD in the README, the migration, the passing `npm run check`, and the three GitHub pull requests. Each member gives one sentence about the code they personally changed and tested.

## Freeze checklist

- Reset and seed succeeds from a clean clone.
- Demo login, one mutation, refresh persistence, public link, and copy flow are rehearsed.
- Browser console is clear on the demo path.
- Repository is on the intended branch and every PR is merged.
- Keep a screen recording of the successful path as backup.
