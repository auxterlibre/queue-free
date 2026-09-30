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

1. Copy `templates/tutorial.md` into a category folder under `src/content/docs/`, for example `src/content/docs/movement/`.
2. Save screenshots as `.webp` in `src/assets/<category>/`.
3. For a new category, add a sidebar entry in `astro.config.mjs`.

## Build

```
npm run build
```

The site is output to `dist/`.
