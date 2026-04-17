# Salsala — Design System (MASTER)

Single source of truth for Salsala (Hebrew RTL boutique ordering app).
Approved by product owner 2026-04-16. Synthesized from ui-ux-pro-max's
"Nature Distilled" style + "Bakery/Cafe" palette, with Hebrew-capable
typography substituted in.

## Vibe

Warm artisan / boutique bakery. Editorial restraint — serif for identity +
clean sans for UI. Generous whitespace. No dark mode, no gradients, no
glassmorphism, no emoji icons. The canvas is soft cream, surfaces are white,
primary actions are a warm clay brown.

## Color tokens

| Token | Hex | Role |
|---|---|---|
| `background` | `#FBF6EC` | Page canvas (cream) |
| `surface` | `#FFFFFF` | Cards, sheets, modals |
| `foreground` | `#1F1B17` | Body text, headings |
| `muted` | `#6B5D52` | Secondary text, helper copy |
| `primary` | `#8C4A1F` | CTAs, active links, brand emphasis |
| `primary-hover` | `#733A15` | Hover/press state of primary |
| `primary-foreground` | `#FBF6EC` | Text on primary backgrounds |
| `accent` | `#C67B5C` | Terracotta — highlights, badges |
| `border` | `#E6DED0` | Input borders, dividers |
| `danger` | `#991B1B` | Delete confirmations, errors |
| `success` | `#15803D` | Success toasts, saved state |

Contrast: body text `#1F1B17` on bg `#FBF6EC` is ~14:1 (WCAG AAA).
Primary `#8C4A1F` on bg is ~6.1:1 (AA). Muted `#6B5D52` on bg ~5.1:1 (AA body,
AAA large).

## Typography

- **Display** (brand, headings): `Frank Ruhl Libre` (Hebrew serif) — weights 400 / 500 / 700 / 900
- **UI body** (text, buttons, forms): `Heebo` (Hebrew sans) — weights 400 / 500 / 700
- Delivered via `next/font/google` with `subsets: ['hebrew', 'latin']`

> **Note on the original skill suggestion:** the auto-generated design system
> recommended `Amatic SC + Cabin`, which does not support Hebrew. Hebrew is
> mandatory for this project, so the pair was replaced with the
> Hebrew-native alternatives above. If this MASTER file gets regenerated in
> the future, the Hebrew pair MUST be restored.

Scale:

| Role | Size | Weight | Family |
|---|---|---|---|
| Brand / H1 | 32–40px (`text-4xl` / `text-5xl`) | 500 | display |
| H2 | 24px (`text-2xl`) | 500 | display |
| H3 / product name | 18–20px (`text-lg` / `text-xl`) | 400 | display |
| Body | 16px (`text-base`) | 400 | sans |
| Button | 15–16px | 500 | sans |
| Small / muted | 14px (`text-sm`) | 400 | sans |

Line-height 1.5–1.75 for body (per skill guideline), normal for display.

## Spacing & radius

- Spacing scale: Tailwind default 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px
- Radii: inputs + buttons `rounded-md` (6px), cards `rounded-lg` (8px),
  modals + sheets `rounded-xl` (12px)
- Section padding: `py-12 sm:py-16 lg:py-24` for landing-style sections

## Elevation

- Card at rest: `shadow-[0_1px_2px_rgba(31,27,23,0.06)]`
- Raised sheet / modal: `shadow-[0_10px_30px_rgba(31,27,23,0.12)]`
- Never dark / neon drop shadows.

## Motion

- Transitions on `color` / `opacity` only — 200ms ease-out
- No `scale` hover transforms (layout shift, skill anti-pattern)
- `prefers-reduced-motion` globally disables via `globals.css`

## Icons

- Library: **Lucide** (SVG, consistent 24×24 viewBox, wide icon coverage)
- Emoji-as-icon is banned (skill anti-pattern rule)

## Primitive components (components/ui/)

| Component | Purpose | File |
|---|---|---|
| `Button` | Primary / secondary / ghost / danger, sizes md / lg / icon | `button.tsx` |
| `Input` | Text input + Textarea, 44px tall, 16px font | `input.tsx` |
| `Label` | Form label | `label.tsx` |
| `Card` | Container with rest-shadow, used for product cards and panels | `card.tsx` |
| `Modal` | Centered overlay with backdrop + Esc close + focus trap | `modal.tsx` |
| `Banner` | Inline info / success / danger messaging with aria roles | `banner.tsx` |

## Component UX baseline

- **Touch targets** ≥ 44×44 px everywhere (iOS HIG). Buttons default `h-11`.
- **Cursor**: `cursor-pointer` on all interactive elements (skill rule).
- **Focus**: `focus-visible:ring-2` with tokenized ring color on all primitives.
- **Inputs**: 16px font-size mandated in globals.css to prevent iOS zoom.

## Stack-specific notes

- Tailwind v4 `@theme inline` wires CSS custom props to utilities: e.g. `bg-primary`, `text-foreground`, `border-border`, `ring-primary`.
- Next.js 16 `next/font/google` provides CSS vars `--font-heebo` and `--font-frank-ruhl`, consumed by `--font-sans` / `--font-display` in the theme.
- RTL: `<html dir="rtl" lang="he">` in root layout. Use Tailwind logical utilities (`ps-*` / `pe-*` over `pl-*` / `pr-*`) wherever possible — TBD for component polish.

## Anti-patterns avoided

- [x] No emoji icons
- [x] No dark mode
- [x] No hover `scale` transforms
- [x] No glass / low-opacity surfaces (light mode contrast issue)
- [x] No corporate SaaS gradients
- [x] No AI-slop stock-image hero
- [x] No decorative animations past micro-interactions

## Page-specific overrides

If a page deviates from this MASTER, drop a file in
`design-system/salsala/pages/<page-name>.md` and it will override during that
page's build.
