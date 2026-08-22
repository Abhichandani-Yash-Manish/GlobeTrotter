# Contributing to GlobeTrotter

The goal is a stable demo and genuine, explainable contributions from all three team members.

## Safe beginner workflow

1. Start from the latest stable core:

   ```bash
   git switch codex/globetrotter-core
   git pull
   git switch -c teammate/<short-task-name>
   ```

2. Change one bounded area. Run `npm run check` before committing.
3. Review `git diff` and make sure no `.env` or database file is included.
4. Commit under your own GitHub identity:

   ```bash
   git add <files-you-changed>
   git commit -m "fix: describe the user-visible improvement"
   git push -u origin teammate/<short-task-name>
   ```

5. Open a pull request into `codex/globetrotter-core`. Explain what you tested. A second teammate reviews it before merge.

Never share a working directory, patch files, account, or direct push to `main`. Agents may explain commands and review diffs, but the teammate who understands and made the change owns the commit.

## Suggested teammate slices

- Teammate 2: test at 375px, keyboard through login/planner, fix one issue, and explain the before/after behavior.
- Teammate 3: perform the clean-clone setup from the README, correct any missing step, add final screenshots, and explain the ERD.

Keep each pull request small enough to review in ten minutes.
