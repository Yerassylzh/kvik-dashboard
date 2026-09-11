<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Development Guidelines

## General Implementation Rules

- Do not write code, which's size larger than 400 lines of code. If it's possible to split that into logical components, split that. Try to reuse components which repeat. Do not repeat yourself
- If you don't have any context about this project, what it does, features, look at dev_docs/Project Architecture.md file. You also can view some other files inside dev_docs/ folder. Look at their names first, don't waste tokens reading irrelevant files.

## Translation Rules

The product is Russian-only. `locales/ru/` is the source of truth; all values are Russian.

- **UI String Resolution:** Always use `useTranslations('<namespace>')` (Client Components) or `getTranslations('<namespace>')` (Server Components) from `next-intl` for user-facing UI text. Do not hardcode raw UI strings directly in TSX.
- **Namespace Convention:** The first segment of a dotted key (before the first ".") is the **namespace** and maps to the locale file name in `locales/<lang>/`. For example, `onboarding.data_source.realty_label` belongs to namespace `onboarding` → file `locales/ru/onboarding.json`, stored under the nested path `data_source.realty_label`. Always write keys in the full `<namespace>.<path.to.key>` form.
- **Existing Keys:** Before creating a new key, GREP, not fully read `locales/translation_keys_existing.txt` (all keys) or `locales/backend_keys_existing.txt` (backend `api.*` keys only). Both are auto-regenerated on every commit. Reuse an existing key when the string already exists.
- **New Keys:** Add new keys with their Russian values to `locales/translation_keys_new.json`, then merge them into the locale files with `scripts/apply-translation-keys.mjs`. The script never modifies the input files and skips keys that already exist, so it is safe to re-run.
- **Backend Keys:** Backend response translations (`api` namespace, resolved client-side by the axios interceptor against `locales/ru/api.json`) use a separate input file: `locales/backend_new_keys.json`. The same merge script sends those keys into `api.json` (a leading `api.` on keys is optional).
- **File Access:** Do not edit files inside `locales/` directly — change values via the new-keys files + the merge script.

## Styling & Color System

- **Single Source of Truth:** All design tokens, theme variables, and color palettes are defined exclusively in `global.css` (or `globals.css`).
- **No Hardcoded Values:** Do not invent or hardcode hex/RGB values directly in component files or inline styles unless specifically requested.
- **Color Inspection Protocol:**
  - When creating or modifying UI components, inspect `global.css` to locate the correct CSS custom properties or Tailwind utility classes (e.g., `bg-primary`, `text-muted`, `border-border`).
  - Read the inline comments inside `global.css` to determine the correct semantic usage for each color token (e.g., background surfaces, muted text, active/hover states, destructive alerts).
- **Contrast & Foreground Token Rules:**
  - `*-foreground` tokens (e.g. `text-primary-foreground`, `text-destructive-foreground`, `text-secondary-foreground`) are designed **exclusively** for text rendered on top of the corresponding solid fill background (`bg-primary`, `bg-destructive`, etc.).
  - **Never** use `text-destructive-foreground` on light/tinted backgrounds (e.g., `bg-destructive/10`, `bg-destructive/20`), because `--destructive-foreground` is near-white (`210 40% 98%`), making text invisible.
  - For soft/tinted alerts and banners, use the semantic helper classes (`.alert-destructive`, `.alert-warning`, `.alert-success`, `.alert-info`) or use saturated dark text tokens (e.g. `text-destructive`, `text-amber-700`, `text-emerald-700`).
- **Tailwind Integration:** Always prefer semantic Tailwind utility classes mapped to CSS variables over raw CSS property overrides.

## During Development
You should use english for comments, when replying inside of the dev chat. However the content presented to the client/user should be in ru.