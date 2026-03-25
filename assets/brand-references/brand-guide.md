# Jio Brand Identity Reference — Verified Sources Only

Everything in this document is sourced from publicly verifiable references. Where exact values aren't publicly documented, this is stated explicitly.

**Last verified: March 2026** — Cross-checked against jio.com, jio.com/selfcare, jio.com/business, jio.com/apps, jiomart.com, and live logo SVG from myjiostatic.cdn.jio.com.

---

## CRITICAL: Brand Colors Have Changed

Older brand reference sites (schemecolor.com, brandpalettes.com) cite `#005AAC` as the Jio Blue. **This is outdated.** Jio's current live website uses `#0F3CC9` as their primary blue, set as CSS variable `--color-blue-100` across all jio.com pages.

| What | Old Value | Current Value (March 2026) | Source |
|------|-----------|---------------------------|--------|
| **Primary Blue** | `#005AAC` (Pantone PMS 2935 C) | **`#0F3CC9`** | jio.com CSS `--color-blue-100` |
| **Primary Red** | `#FF0000` | **`#DA2441`** | Live logo SVG from myjiostatic.cdn.jio.com |
| **Deep Blue** | — | **`#0a2885`** | jio.com/business accents, Wikipedia logo |
| **Focus Blue** | — | **`#005fcc`** | jio.com focus/outline states |
| **Light Tint** | — | **`#E7EBF8`** | jio.com submenu/section backgrounds |
| **Gold/Orange** | — | **`#EFA73D`** | jio.com/business accent, promotional elements |
| **Black** | — | **`#141414`** | `--color-black-100` on jio.com |

---

## Current Logo (March 2026)

The current Jio logo has **three elements** (from live SVG at `myjiostatic.cdn.jio.com/cms/assets/500-logo-mob-latest.svg`):

1. **Red "5" numeral** — Stylized, `#DA2441`
2. **Blue circle with "jio" text** — White lowercase "jio" in `#0F3CC9` circle
3. **Gold gradient circle** — Linear gradient from `#FBBE4C` through `#FFFD8C` to `#BD7F2E`

The blue circle with "jio" remains the core brand mark. The "5" and gold circle appear to be part of the current campaign/branding evolution.

### Logo files in this pack

| File | Description |
|------|------------|
| `assets/jio-logo-current.svg` | Full current logo (3 elements, from live site) |
| `assets/jio-logo-blue.svg` | Blue circle mark only (standalone, `#0F3CC9`) |
| `assets/jio-logo-red.svg` | Red circle mark only (standalone, `#DA2441`) |
| `assets/jio-logo-white.svg` | White mark for dark backgrounds |

### Logo details
- White lowercase "jio" in Omnes Bold inside a circle
- The dot on the "i" is slightly detached and positioned above-right
- The "j" has a distinctive small loop at the upper portion
- Source typeface: Omnes Bold by Darden Studio (confirmed via fontsinuse.com)

---

## Verified Typography

### Corporate Typeface: JioType (REAL FILES INCLUDED)

**Real JioType font files are included in `assets/fonts/jiotype/`** — downloaded from Jio's own CDN (`jep-asset.akamaized.net/jiocom/static/fonts/`).

| Weight | TTF File | WOFF File | Size |
|--------|----------|-----------|------|
| Light (300) | `JioTypeW04-Light.ttf` | `JioTypeW04-Light.woff` | ~58K / ~32K |
| Medium (500) | `JioTypeW04-Medium.ttf` | `JioTypeW04-Medium.woff` | ~58K / ~32K |
| Bold (700) | `JioTypeW04-Bold.ttf` | `JioTypeW04-Bold.woff` | ~58K / ~32K |

**Font metadata:** Copyright 2016 Reliance Jio Infocomm Ltd, created by Monotype Imaging Inc.

- Geometric sans-serif with friendly, open curves
- Increased tracking (letter-spacing: 0.02em) for digital readability
- jio.com/selfcare confirmed font-family: `JioTypeW04-Light` (body), `JioTypeW04-Medium`, `JioTypeW04-Bold`

### Logo Typeface: Omnes Bold
- Created by Darden Studio
- "jio" is set in the Bold weight, standard width, all lowercase
- Source: Fonts In Use (fontsinuse.com/uses/48948/jio-logo)

### Tagline Typeface: Neue Helvetica
- "Digital Life" tagline uses all-caps Neue Helvetica

### Fallback Web Font
If JioType cannot be loaded, use **Nunito** from Google Fonts — closest publicly available match to JioType's geometric-but-friendly character.

```
font-family: 'JioType', 'Nunito', sans-serif;
```

---

## Extended "Colours of India" Palette

Studio Schnauze developed an algorithmically generated 8-color palette called "Colours of India." The specific hex codes are NOT officially published. These are sampled from public Jio marketing materials:

| Color | Hex (approximate) | Used in |
|-------|--------------------|---------|
| Saffron/Orange | `#FF6F00` | JioPattern, promotional materials |
| Magenta/Pink | `#D9008D` | JioCinema branding, JioPattern |
| Green | `#00C853` | Success states, JioPattern |
| Teal/Cyan | `#00BCD4` | Digital/tech contexts |
| Purple | `#7B1FA2` | Premium tiers |
| Gold/Yellow | `#FFD600` | Highlights, celebrations |
| Sky Blue | `#29B6F6` | Light accent |
| Coral/Orange-Red | `#FF7043` | Warm accents |

---

## JDS (Jio Design System) Tokens

Jio uses a design system called **JDS** (previously known as **Tesseract**) with CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-blue-100` | `#0F3CC9` | Primary actions, links, active states |
| `--color-white-100` | `#FFFFFF` | Surfaces |
| `--color-black-100` | `#141414` | Text |
| `--color-grey-90` | `rgba(0,0,0,0.65)` | Secondary text |
| `--spacing-xs` through `--spacing-massive` | varies | Spacing scale |
| `--radius-pill` | large value | Pill/round buttons |
| `--radius-large` | medium value | Mobile cards |
| `--radius-xl` | larger value | Desktop cards |

Active state indicator: `border-bottom: 4px solid #0F3CC9`
Card shadows: `0 4px 16px rgba(0,0,0,0.16)`

---

## Brand Design Language

### Verified Principles
- **"Digital Life"** — Jio's brand promise
- **"jio" means "live long"** in Hindi
- **Three brand pillars:** Simple, Smart, Secure
- **Visual DNA:** Vibrant, digital, inclusive, unmistakably Indian
- **The circle** = "the mother of all shapes — deeply rooted in Indian culture"
- **JioPattern** — Algorithmically unique dot-based patterns using the Colours of India

### Sub-brands observed
| Sub-brand | Primary Color | Notes |
|-----------|--------------|-------|
| JioMart | `#0c5273` (dark teal) | Separate design system (DS2) |
| JioCinema | `#D9008D` (magenta) | Streaming |
| JioSaavn | `#2BC5B4` (teal) | Music |

---

## What This Pack Includes vs. What's Missing

### Included (bulletproof)
- Real JioType font files (TTF + WOFF, 3 weights)
- Current live logo SVG (from jio.com CDN)
- Blue/red/white circle marks
- Corrected brand colors verified against live site
- CSS theme with @font-face declarations
- JS design tokens
- Accenture logo (full + subtle grey version)

### Still approximate
- Extended "Colours of India" palette (sampled, not from official docs)
- Exact JDS spacing/radius token values (CSS variable names known, values not public)
- Dark mode palette

### Not included
- Omnes Bold font (logo typeface — licensed from Darden Studio)
- Full Tesseract/JDS design system documentation
- JioPattern generation algorithm
