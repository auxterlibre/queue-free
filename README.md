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
3. For a new category, add a sidebar entry in `astro.config.mjs`.

## Contribute form

`/contribute/` is a form that turns a filled-in page into a pull request. It needs a Cloudflare Pages Function (`functions/api/propose.ts`) and these settings on the Pages project:

| Where | Name | Value |
|---|---|---|
| Build variable | `PUBLIC_TURNSTILE_SITE_KEY` | Site key of a [Turnstile](https://dash.cloudflare.com/?to=/:account/turnstile) widget for `queuefree.dev` |
| Secret | `TURNSTILE_SECRET` | Secret key of the same widget |
| Secret | `GITHUB_TOKEN` | Fine-grained token for this repo with **Contents: read and write** and **Pull requests: read and write** |
| KV binding (optional) | `RATE_LIMIT` | Any KV namespace, used to cap submissions per IP |

Pull requests are opened by the token's account. Optional variables: `GITHUB_REPO` (`owner/repo`, defaults to this repo) and `GITHUB_BASE` (defaults to `main`).

Without `PUBLIC_TURNSTILE_SITE_KEY` the form builds with sending disabled. For local work copy `.env.example` to `.env`; it holds Turnstile's always-pass test key.

## Build

```
npm run build
```

The site is output to `dist/`.
