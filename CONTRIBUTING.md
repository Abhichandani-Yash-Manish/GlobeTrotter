# Contributing to GlobeTrotter

Every contribution should be small enough to understand, test, and explain during judging.

## Beginner-safe workflow

```bash
git switch main
git pull --ff-only
git switch -c teammate/<short-task-name>
```

1. Change one bounded behavior.
2. Run the smallest relevant test, then `npm run check` before the pull request.
3. Review `git diff` and confirm that `.env`, SQLite files, tokens, or generated uploads are absent.
4. Commit from your own configured GitHub identity.

```bash
git add <files-you-understand>
git commit -m "fix: describe the user-visible improvement"
git push -u origin teammate/<short-task-name>
```

5. Open a pull request into `main` with the defect, fix, and verification evidence. A teammate reviews it before merge.

Do not share accounts, fabricate authorship, transfer patch files as a substitute for collaboration, or let multiple people push directly to `main`.

## Useful teammate slices

- Mobile/keyboard QA: reproduce one issue at 375 px, fix it, and document the before/after behavior.
- Clean-clone QA: follow the README on another machine, correct one real setup gap, and update the demo checklist.
- Data review: verify a showcase destination’s POIs, facts, imagery attribution, and filters; fix one evidence-backed issue.
- Access review: exercise owner/editor/viewer behavior and add a focused regression test.

Keep a pull request reviewable in roughly ten minutes.
