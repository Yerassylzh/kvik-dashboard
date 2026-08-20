<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Frontend Design System & Styling Rules

## Color Palette Constraints (CRITICAL)
- **STRICT RULE:** NEVER use arbitrary hex colors (e.g., `bg-[#0f172a]`, `text-[#059669]`, or `style={{ color: ... }}`) in JSX/TSX files.
- ALL color styling MUST use semantic Tailwind classes backed by our global CSS tokens.
- **Allowed Backgrounds:** `bg-background`, `bg-card`, `bg-muted`
- **Allowed Text:** `text-foreground`, `text-muted-foreground`, `text-primary`
- **Allowed Actions/Buttons:** `bg-primary`, `text-primary-foreground`
- **AI Agent Status/Triggers ONLY:** Use `bg-sky-500/10 text-sky-600 border-sky-200` or `var(--accent-ai)`.
- **Lead Conversion/Calendar Success ONLY:** Use `bg-emerald-500/10 text-emerald-600` or `var(--accent-success)`.

## Theme Rules
- Build ALL UI components for LIGHT MODE first.
- Ensure high contrast: Dark slate text (`text-slate-900`) on white/light-gray backgrounds (`bg-slate-50` or `bg-white`).
