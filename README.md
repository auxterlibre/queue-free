# Queue Free

Short, practical answers to the most asked Godot 4 questions. Live at [queuefree.dev](https://queuefree.dev).

Built with [Astro Starlight](https://starlight.astro.build).

## Run locally

```
npm install
npm run dev
```

Open http://localhost:4321.

## Add a tutorial

1. Copy `templates/how-to.mdx` (how do I...?) or `templates/error.mdx` (why does this error...?) into a category folder under `src/content/docs/`, for example `src/content/docs/movement/`.
2. Save screenshots as `.webp` in `src/assets/<category>/`.
3. For a new category, add its folder name and label to `src/categories.json`. The sidebar and the landing page read from it.

## Contribute form

`/write/` is a form that turns a filled-in page into a pull request. It needs a Cloudflare Pages Function (`functions/api/propose.ts`) and these settings on the Pages project:

| Where | Name | Value |
|---|---|---|
| Secret | `TURNSTILE_SECRET` | Secret key of the [Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) widget for `queuefree.dev` |
| Secret | `GITHUB_TOKEN` | Fine-grained token for this repo with **Contents: read and write** and **Pull requests: read and write** |
| KV binding (optional) | `RATE_LIMIT` | Any KV namespace, used to cap submissions per IP |

Pull requests are opened by the token's account, unless the contributor signs in with GitHub.

### Optional: let contributors sign in with GitHub

With sign-in, the form forks the site under the contributor's account and opens the pull request from there, so the commit and the PR are theirs and they get contributor credit. Without these settings the sign-in option is hidden and everything still works through the token above.

1. On GitHub open **Settings → Developer settings → OAuth Apps → New OAuth App**. Homepage URL `https://queuefree.dev`, Redirect URI `https://queuefree.dev/api/github/callback`. Leave wildcard matching and device flow off.
2. Add to the Pages project as secrets: `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET`, and `SESSION_SECRET` (any long random string, used to seal the sign-in cookie).

The sign-in asks for GitHub's `public_repo` scope, the smallest one that allows forking and opening pull requests on a public repository. The token lives only in an encrypted, HttpOnly cookie for eight hours. Optional variables: `GITHUB_REPO` (`owner/repo`, defaults to this repo) and `GITHUB_BASE` (defaults to `main`).

The widget's site key is public and lives in `src/pages/write.astro`. For local work copy `.env.example` to `.env`: it sets `PUBLIC_TURNSTILE_SITE_KEY` to Turnstile's always-pass test key, since the real widget only renders on `queuefree.dev`. Pair it with the test secret `1x0000000000000000000000000000000AA` when running the function locally.

## Build

```
npm run build
```

The site is output to `dist/`.
