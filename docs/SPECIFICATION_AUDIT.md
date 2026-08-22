# Specification completion audit

The supplied GlobeTrotter problem statement is the requirements source. This audit records the implemented evidence and deliberate exclusions; it is not a replacement for the problem statement.

| Required surface | Completion evidence |
|---|---|
| Authentication | sign-up/sign-in, demo access, generic forgot-password response, hashed expiring one-use reset token, password change |
| Dashboard | next route, owned/shared recents, saved ideas, spend status, incomplete-plan warnings, destination recommendations |
| Trip creation/editing | inclusive dates, name, description, budget, privacy, cover gallery/upload, persisted metadata editing |
| My Trips | search, time/scope filters, access badges, role-safe view/edit/publish/delete actions |
| Destination discovery | SQLite search/filters, rich dossier, map, season/stay/budget facts, saved state, add-to-trip action |
| Planner | city/activity filters, images and source facts, stops, arrival modes, schedule/cost/notes editing, stop/activity ordering |
| Itinerary/calendar | list/calendar/map views, expandable day cards, activity imagery, day totals, over-budget markers, planner edit handoff |
| Budget | INR-first display/input, exact base aggregate, remaining amount, average/day, category breakdown, dated FX pocket guide, donut, daily bars, ceiling violations |
| Public sharing | stable public ID, sanitized read model, native share, copy link, WhatsApp, email, print, independent deep-copy |
| Collaboration | seven-day editor/viewer invites, acceptance/revocation, member removal, shared-trip lists, nested server authorization |
| Settings | profile, processed avatar upload, default privacy, password/account actions, saved-list removal, persistent language choice |
| Responsive/accessibility | 375/768/desktop layouts, mobile Plan/Map/Budget modes, keyboard ordering, focus visibility, reduced motion, fallbacks |
| Database/content | 55 destinations, 390 unique activities, relational migrations, indexes, two seeded public journeys, deterministic data audit |

## Offline and failure behavior

- No key is required for the primary journey.
- Geoapify routing is optional, cached, server-only, timeout-bound, and falls back to persisted coordinates.
- A failed tile request leaves the route ribbon and text segments available.
- Failed destination/activity images render a branded, readable fallback.
- Password recovery uses a terminal email adapter locally.
- `npm run check` proves migration and seed quality in an isolated temporary SQLite database.

## Deliberate exclusions

- optional admin dashboard;
- live booking inventory or price claims;
- live transactional exchange rates or booking quotes;
- real-time sockets, cursors, chat, or voting;
- travel-document storage;
- hosted persistent database configuration.

These exclusions do not block the required create → discover → plan → budget → collaborate → publish → copy journey.
