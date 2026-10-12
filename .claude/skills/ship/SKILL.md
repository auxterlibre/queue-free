---
name: ship
description: Validate the site and push the current branch. Runs the content checks and the Astro build, then commits with the repo's message style and pushes. Use when asked to ship, commit, push, or publish changes to the site.
---

# Ship

Push only when the site builds and the content checks pass.

## Steps

1. Run `git status --short`. If there is nothing to commit and nothing to push, say so and stop.
2. Run the content checks:
   ```
   node .claude/skills/ship/scripts/check.mjs
   ```
   Fix every `error:` line before continuing. Mention `warning:` lines to the user but do not block on them.
3. Build. Install first if `node_modules/` is missing:
   ```
   npm run build
   ```
   A failed build means broken MDX, a bad import, or a missing image. Fix it and build again. Never push a red build.
4. Stage the related files with `git add <paths>`. Do not add `dist/`, `.astro/`, `.env`, or `src/styles/palette.css`; they are ignored, but check anyway.
5. Commit in the repo's style, one commit per logical change:
   - Subject: imperative, sentence case, no prefix, no trailing period, under 72 characters. Examples from the log: `Clarify connect-signal short answer`, `Add a Support page with a Ko-fi button and a header tab`.
   - Body only when the subject does not explain the why. Keep it to two or three plain sentences.
   - Keep any attribution lines the session requires.
6. Push with `git push -u origin <current-branch>`. Retry on network errors with backoff (2s, 4s, 8s, 16s). Never push to a different branch than the one checked out.
7. Report in two or three lines: what was committed, the branch, and whether the build and checks passed.

## Notes

- Deploys happen from `main` on Cloudflare Pages. Pushing a feature branch does not publish anything; merging to `main` does.
- A new category folder must have a label in `src/categories.json`. The checker fails without it.
- Links inside pages are site-relative with a trailing slash, for example `/signals/connect-signal-in-code/`.
