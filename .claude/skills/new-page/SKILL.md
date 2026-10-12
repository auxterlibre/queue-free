---
name: new-page
description: Scaffold a new tutorial page for the site from the how-to or error template, in the right category, with frontmatter filled in. Use when asked to add, create, or start a new page, tutorial, how-to, or error page.
---

# New page

Create one page under `src/content/docs/<category>/<slug>.mdx` from the matching template, ready to write.

## Inputs

Get these from the request. Ask only when the question itself is unclear.

- **Question**: the page title, phrased as the reader would search it. `How do I ...?` or `Why does ...?`.
- **Type**: `how-to` for "How do I", `error` for "Why does ... error". Infer from the title.
- **Category**: a key from `src/categories.json`. Pick the closest existing one. Create a new one only when nothing fits, and say so.
- **Slug**: derive from the title. Lowercase, hyphens, no filler words, matching `/^[a-z0-9]+(-[a-z0-9]+)*$/`. Examples: `move-character-2d`, `signal-already-connected`.

## Steps

1. Read `src/categories.json` and list `src/content/docs/<category>/` to confirm the slug is free. A taken slug needs a different one, never a suffix like `-2`.
2. Copy the template:
   - `templates/how-to.mdx` for how-to pages
   - `templates/error.mdx` for error pages
3. Fill the frontmatter:
   - `title`: the question, ending with `?`
   - `description`: one sentence, what the reader will be able to do, or for errors the exact error text in quotes plus the words people search for
   - `godot`: keep `4.x` unless the answer is version-specific
   - `sidebar.label`: two to four words, no question mark, for example `Connect a signal`
4. For an error page, put the real error text in the `GodotError` component and remove the placeholder.
5. Leave the body sections in place with their placeholder text. Replace them only when the request also provides the content. Keep the `Related` section but point it at real pages that exist, or remove the placeholder card.
6. New category only: add `"<key>": "<Label>"` to `src/categories.json`, keeping the existing order style, and create the folder.
7. Screenshots go in `src/assets/<category>/` as `.webp`. Create the folder only when an image is added.
8. Run `node .claude/skills/ship/scripts/check.mjs`. The new page will fail on remaining placeholders if the body was not written; say which ones are left.
9. Report the file path and what still needs writing.

## Writing rules for the body

- Lead with the `Short answer` aside: the fix in one or two sentences.
- Scene examples use the `SceneTree` component. Keep trees small, three to five nodes.
- Code blocks carry `title="main.gd"` or `title="Main.cs"`. GDScript uses snake_case for variables, functions and signals, and PascalCase for classes and nodes. Use `del={n}` and `ins={n}` to show a wrong line and its fix.
- When the page shows code, give both tabs: GDScript and C#, inside `<Tabs syncKey="lang">`.
- Headings are plain and short. No "Step 1". Steps go inside `<Steps>`.
- Comments in code only when a line would otherwise be unclear. Good names beat comments.
