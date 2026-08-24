<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Development Guidelines

## Styling & Color System
- **Single Source of Truth:** All design tokens, theme variables, and color palettes are defined exclusively in `global.css` (or `globals.css`).
- **No Hardcoded Values:** Do not invent or hardcode hex/RGB values directly in component files or inline styles unless specifically requested.
- **Color Inspection Protocol:**
  - When creating or modifying UI components, inspect `global.css` to locate the correct CSS custom properties or Tailwind utility classes (e.g., `bg-primary`, `text-muted`, `border-border`).
  - Read the inline comments inside `global.css` to determine the correct semantic usage for each color token (e.g., background surfaces, muted text, active/hover states, destructive alerts).
- **Tailwind Integration:** Always prefer semantic Tailwind utility classes mapped to CSS variables over raw CSS property overrides.


## General Implementation Rules
- Do not write code, which's size larger than 400 lines of code. If it's possible to split that into logical components, split that. Try to reuse components which repeat. Do not repeat yourself
- If you don't have any context about this project, what it does, features, look at dev_docs/Project Architecture.md file. You also can view some other files inside dev_docs/ folder. Look at their names first, don't waste tokens reading irrelevant files.


## Translation Rules
- **UI String Resolution:** Always use `useTranslations('<namespace>')` (Client Components) or `getTranslations('<namespace>')` (Server Components) from `next-intl` for user-facing UI text. Do not hardcode raw UI strings directly in TSX.
- **Key Tracking:** Each time you write text that should be translated, follow `dev_docs/002_TRANSLATION_SYSTEM.md`. Add new message keys and their corresponding English values as a JSON object to `translation_keys_new.json`.
- **Existing Keys:** Grep available keys in `translation_keys_existing.txt`. 
- **File Access:** NEVER touch files inside the `locales/` directory directly.
