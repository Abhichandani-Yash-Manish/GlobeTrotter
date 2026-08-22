# GlobeTrotter demonstration runbook

## Prepare the judged machine

```bash
nvm use
npm ci
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run check
npm run dev
```

Open `http://localhost:3000`. Use `demo@globetrotter.com` / `password123`.

## Three-minute story

**0:00–0:25 — The promise**

Open the landing page: “GlobeTrotter turns a multi-city idea into a dated, budget-aware route that a crew can plan and another traveler can reuse.” Open the Western India public itinerary to establish the editorial atlas, persistent data, photography, map, and sharing before signing in.

**0:25–1:20 — Discover and plan**

Use demo sign-in. Open Explore, search Ahmedabad, and open its destination dossier. Point to best season, daily estimate, map, distinct POIs, and “Add to trip.” Continue into the European planner: show the route board, quick activity/stop edits, activity filters, arrival modes, and keyboard/drag ordering. Trigger one overlapping stop to show actionable validation.

**1:20–2:00 — Calendar, map, budget, health**

Switch between Plan, Map, and Budget. Add or edit one cost and show the donut, daily bars, category totals, remaining amount, and Trip Health update from the same persisted data. Open review and switch List → Calendar → Map.

**2:00–2:35 — Controlled collaboration**

Open Crew and generate a viewer or editor link. Explain: editors can change planning data; viewers are read-only; only owners publish, invite, remove members, or delete. The API rechecks access on every child mutation.

**2:35–2:50 — Publish and reuse**

Open the stable public URL. Show copy link, native/social/print actions, then “Copy this trip.” The new owner receives a transactional deep copy of metadata, stops, activities, arrival context, and costs.

**2:50–3:00 — Engineering proof**

Show `npm run check`, the temporary clean-database audit, ERD, migrations, focused Git history, and the known dependency advisory. Each teammate explains only the change they personally made and tested.

## Freeze checklist

- `npm run check` passes on Node 24.
- Both public demo URLs work.
- Demo login, one persisted edit, overlap rejection, map fallback, charts, invite roles, public sharing, and independent copying are rehearsed.
- 375 px, 768 px, and desktop layouts have no horizontal page overflow.
- Keyboard ordering, visible focus, reduced motion, image fallback, and print view are checked.
- Browser console is clear on the demonstration path.
- GitHub pull requests are reviewed and the intended commit history is present on `main`.
- A successful screen recording is available as a backup.
