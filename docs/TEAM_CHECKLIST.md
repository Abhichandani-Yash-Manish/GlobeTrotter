# Hackathon operating checklist

## Before the clock

- [ ] All three GitHub accounts can clone, branch, commit, push, and open a pull request.
- [ ] Everyone uses Node 24 (`nvm use`) and has run `npm ci && npm run reset-demo`.
- [ ] Demo credentials work on every machine.
- [ ] One person owns final merges and the demo laptop; nobody pushes directly to `main`.

## While building

- [ ] Announce the file area before editing it.
- [ ] One task equals one branch and one focused commit/PR.
- [ ] Pull the stable core before starting the next task.
- [ ] Run the smallest relevant check while working and `npm run check` before review.
- [ ] Stop feature work at the freeze time; only verified bug fixes enter afterward.

## Contribution evidence

Fill this with real links only:

| Member | GitHub handle | Owned change | PR | What they will explain |
|---|---|---|---|---|
| Member 1 | | Core product | | Architecture and planner flow |
| Member 2 | | Mobile/keyboard QA fix | | Defect, reproduction, and fix |
| Member 3 | | Clean-clone/docs correction | | Setup and relational model |
