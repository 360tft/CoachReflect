# Design System Specification

**Purpose:** Ensure visual consistency across all products in each ecosystem.

**Reference Implementation:** 360tft.co.uk (brand colors) + FootballGPT (patterns)

---

## Brand Ecosystems

| Ecosystem | Products | Primary Color | Dark BG |
|-----------|----------|---------------|---------|
| **360TFT (Football)** | FootballGPT, ScoutGPT, RefereeGPT, CoachReflection, GPSInsights, TeamManager, 360AtHome | Gold #E5A11C | #0A0A0A |
| **360 Cruising** | CruiseGPT | Navy/Cyan #0077B6 | #1a1a2e |
| **Standalone** | prsnce | Purple | TBD |

---

## 360TFT (Football) Design System

**Brand colors from 360tft.co.uk (matches Skool communities)**

### Colors

#### Primary (Gold/Amber)

| Usage | Value | CSS Variable | Tailwind Equivalent |
|-------|-------|--------------|---------------------|
| **Primary action** | #E5A11C | `var(--brand-primary)` | `amber-500` approx |
| **Hover** | #CC8F17 | `var(--brand-primary-hover)` | `amber-600` approx |
| **Light background** | rgba(229,161,28,0.1) | `var(--brand-primary-light)` | `amber-500/10` |

```css
/* CSS Variables (globals.css) */
:root {
  /* Brand Colour - Gold/Amber (matches Skool communities) */
  --brand-primary: #E5A11C;
  --brand-primary-hover: #CC8F17;
  --brand-primary-light: rgba(229, 161, 28, 0.1);
}

/* Focus indicator */
:focus-visible {
  outline: 2px solid #E5A11C;
  outline-offset: 2px;
}
```

#### Tailwind Mapping

For Tailwind projects, use amber with custom primary:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E5A11C',
          hover: '#CC8F17',
          light: 'rgba(229, 161, 28, 0.1)',
        }
      }
    }
  }
}
```

Or use closest Tailwind equivalents:
- Primary: `amber-500` (#f59e0b) or custom `#E5A11C`
- Hover: `amber-600` (#d97706) or custom `#CC8F17`

#### Neutrals (Dark Theme - 360TFT Default)

360TFT uses a **dark theme by default** to match the website and Skool.

| Usage | Value | CSS Variable |
|-------|-------|--------------|
| **Background (page)** | #0A0A0A | `var(--bg-dark)` |
| **Background (card)** | #111111 | `var(--bg-card)` |
| **Background (hover)** | #1A1A1A | `var(--bg-card-hover)` |
| **Text primary** | #FFFFFF | `var(--text-primary)` |
| **Text secondary** | #B3B3B3 | `var(--text-secondary)` |
| **Text muted** | #666666 | `var(--text-muted)` |
| **Border** | #222222 | `var(--border-color)` |

```css
:root {
  --bg-dark: #0A0A0A;
  --bg-card: #111111;
  --bg-card-hover: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #B3B3B3;
  --text-muted: #666666;
  --border-color: #222222;
}
```

#### Light Mode (Optional)

If a product needs light mode:

| Usage | Light Mode | Dark Mode |
|-------|------------|-----------|
| **Background** | white | #0A0A0A |
| **Surface** | gray-50 | #111111 |
| **Text primary** | gray-900 | white |
| **Text secondary** | gray-600 | #B3B3B3 |
| **Border** | gray-200 | #222222 |

#### Semantic Colors

| State | Light Mode | Dark Mode | Use For |
|-------|------------|-----------|---------|
| **Success** | green-600/50/100 | green-400/900 | Confirmations, completed |
| **Error** | red-600/50/100 | red-400/900 | Errors, destructive |
| **Warning** | amber-600/50/100 | amber-400/900 | Caution, premium |
| **Info** | blue-600/50/100 | blue-400/900 | Information, links |

### Typography

#### Font Family

```css
body {
  font-family: Arial, Helvetica, sans-serif;
}
```

Or with Geist fonts (Next.js):
```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
```

#### Text Sizes (Usage Frequency)

| Size | Tailwind | Use For | Count in FootballGPT |
|------|----------|---------|---------------------|
| **xs** | `text-xs` | Labels, badges, meta | 175 |
| **sm** | `text-sm` | Body text, UI | 499 (most used) |
| **base** | `text-base` | Paragraphs | 42 |
| **lg** | `text-lg` | Subheadings | 85 |
| **xl** | `text-xl` | Section headers | 100 |
| **2xl** | `text-2xl` | Page titles | 75 |
| **3xl** | `text-3xl` | Hero text | 48 |
| **4xl+** | `text-4xl` | Marketing only | 22 |

#### Font Weights

| Weight | Tailwind | Use For | Count |
|--------|----------|---------|-------|
| **normal** | `font-normal` | Body text | 21 |
| **medium** | `font-medium` | UI elements, labels | 332 |
| **semibold** | `font-semibold` | Headings, emphasis | 207 |
| **bold** | `font-bold` | Strong emphasis | 157 |

### Spacing

#### Padding Scale (Most Used)

| Value | Tailwind | Use For |
|-------|----------|---------|
| 1 (4px) | `p-1` | Tight spacing |
| 2 (8px) | `p-2`, `py-2` | Buttons, small cards |
| 3 (12px) | `p-3`, `px-3` | Medium elements |
| 4 (16px) | `p-4`, `px-4` | Cards, sections |
| 6 (24px) | `p-6` | Large sections |
| 8 (32px) | `p-8`, `py-8` | Page sections |

#### Gap Scale

| Value | Tailwind | Use For |
|-------|----------|---------|
| 1 (4px) | `gap-1` | Icon + text |
| 2 (8px) | `gap-2` | Inline elements |
| 3 (12px) | `gap-3` | List items |
| 4 (16px) | `gap-4` | Card grids |
| 6 (24px) | `gap-6` | Section spacing |

#### Max Widths

| Width | Tailwind | Use For |
|-------|----------|---------|
| md (28rem) | `max-w-md` | Modals, small forms |
| 2xl (42rem) | `max-w-2xl` | Content areas |
| 3xl (48rem) | `max-w-3xl` | Footer grids |
| 4xl (56rem) | `max-w-4xl` | Main content |
| 5xl (64rem) | `max-w-5xl` | Wide layouts |
| 6xl (72rem) | `max-w-6xl` | Full-width sections |

### Border Radius

| Radius | Tailwind | Use For | Count |
|--------|----------|---------|-------|
| **lg** (8px) | `rounded-lg` | Cards, buttons, inputs | 366 (default) |
| **xl** (12px) | `rounded-xl` | Large cards, modals | 62 |
| **2xl** (16px) | `rounded-2xl` | Hero sections | 12 |
| **full** | `rounded-full` | Avatars, pills, icons | 89 |
| **md** (6px) | `rounded-md` | Small elements | 44 |

### Components

#### Primary Button

```tsx
// Using CSS variables (preferred)
<button className="
  px-4 py-2
  bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]
  text-white font-medium
  rounded-lg
  transition-colors
">
  Button Text
</button>

// Or with Tailwind custom colors
<button className="
  px-4 py-2
  bg-brand hover:bg-brand-hover
  text-white font-medium
  rounded-lg
  transition-colors
">
  Button Text
</button>
```

#### Secondary Button (Outline)

```tsx
<button className="
  px-4 py-2
  border border-[var(--border-color)]
  text-[var(--text-secondary)]
  hover:bg-[var(--bg-card-hover)]
  rounded-lg
  transition-colors
">
  Button Text
</button>
```

#### Card (Dark Theme Default)

```tsx
<div className="
  p-4
  bg-[var(--bg-card)]
  border border-[var(--border-color)]
  rounded-lg
">
  Card content
</div>
```

#### Card (Interactive)

```tsx
<a className="
  block p-4
  bg-[var(--bg-card)]
  hover:bg-[var(--bg-card-hover)]
  border border-[var(--border-color)]
  rounded-lg
  transition-colors
  group
">
  <span className="text-[var(--text-primary)] group-hover:text-[var(--brand-primary)]">
    Content
  </span>
</a>
```

#### Input

```tsx
<input className="
  w-full px-4 py-2
  bg-[var(--bg-card)]
  border border-[var(--border-color)]
  rounded-lg
  text-[var(--text-primary)]
  placeholder:text-[var(--text-muted)]
  focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent
"/>
```

### Dark Mode Pattern

All elements use paired classes:
```
[light] dark:[dark]
```

**Common Pairs:**

| Element | Light | Dark |
|---------|-------|------|
| Background page | `bg-white` | `dark:bg-gray-800` |
| Background surface | `bg-gray-50` | `dark:bg-gray-700` |
| Background accent | `bg-green-50` | `dark:bg-green-900/20` |
| Text primary | `text-gray-900` | `dark:text-white` |
| Text secondary | `text-gray-600` | `dark:text-gray-400` |
| Text muted | `text-gray-500` | `dark:text-gray-500` |
| Border | `border-gray-200` | `dark:border-gray-700` |
| Hover bg | `hover:bg-gray-100` | `dark:hover:bg-gray-700` |

### Mobile Patterns

- Minimum touch target: 44px (`min-height: 44px`)
- Safe area for iPhone notch: `env(safe-area-inset-bottom)`
- "by 360TFT" hidden on mobile: `hidden sm:inline`
- Footer hidden on mobile in app (use bottom nav)

```css
/* Touch targets */
button, a, [role="button"], input[type="submit"], select {
  min-height: 44px;
}

/* Safe area */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
```

---

## 360 Cruising Design System

**Based on CruiseGPT**

### Colors

| Token | Light | Dark | Hex |
|-------|-------|------|-----|
| **Primary** | Cyan/Navy | Cyan | #0077B6 / #00a8e8 |
| **Primary hover** | Darker navy | - | #005f8a |
| **Primary light** | Light cyan | - | #00a8e8 / #48cae4 |
| **Accent** | Coral | Coral | #FF6B6B |
| **Background** | White | Dark navy | #ffffff / #1a1a2e |

```css
:root {
  --primary: #0077B6;
  --primary-dark: #005f8a;
  --primary-light: #00a8e8;
  --accent: #FF6B6B;
  --background: #ffffff;
}

.dark {
  --primary: #00a8e8;
  --primary-dark: #0077B6;
  --primary-light: #48cae4;
  --background: #1a1a2e;
}
```

### Key Differences from 360TFT

| Aspect | 360TFT | 360 Cruising |
|--------|--------|--------------|
| Primary color | Green | Cyan/Navy |
| Accent | Amber | Coral |
| Dark bg | #1a1a1a (gray) | #1a1a2e (navy tint) |
| Focus color | Green | Cyan |

---

## prsnce Design System

**TBD - Not yet implemented**

Proposed:
- Primary: Purple (`purple-600`)
- Accent: Pink (`pink-500`)
- Warm, relationship-focused feel
- Light/airy in light mode

---

## Implementation Checklist

### New 360TFT Product

- [ ] Copy `globals.css` from FootballGPT
- [ ] Use green-600 as primary action color
- [ ] Use `rounded-lg` as default border radius
- [ ] Use `text-sm` as default text size
- [ ] Use `font-medium` for UI elements
- [ ] Implement dark mode with paired classes
- [ ] Add header "by 360TFT"
- [ ] Add cross-promo footer

### New 360 Cruising Product

- [ ] Copy `globals.css` from CruiseGPT
- [ ] Use CSS variables for primary colors
- [ ] Use navy-tinted dark mode
- [ ] Add header "by 360 Cruising"
- [ ] Simple footer (no cross-promo)

---

## Quick Reference

### 360TFT CSS Variables (Copy to globals.css)

```css
:root {
  /* Brand - Gold/Amber (matches Skool) */
  --brand-primary: #E5A11C;
  --brand-primary-hover: #CC8F17;
  --brand-primary-light: rgba(229, 161, 28, 0.1);

  /* Neutrals - Dark theme */
  --bg-dark: #0A0A0A;
  --bg-card: #111111;
  --bg-card-hover: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #B3B3B3;
  --text-muted: #666666;
  --border-color: #222222;

  /* Spacing */
  --space-xs: 0.5rem;
  --space-sm: 1rem;
  --space-md: 1.5rem;
  --space-lg: 2rem;
  --space-xl: 3rem;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
}
```

### Tailwind Config (Optional)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E5A11C',
          hover: '#CC8F17',
          light: 'rgba(229, 161, 28, 0.1)',
        },
        dark: {
          bg: '#0A0A0A',
          card: '#111111',
          'card-hover': '#1A1A1A',
          border: '#222222',
        }
      }
    }
  }
}
```

### Common Patterns

```tsx
// Primary button
"bg-brand hover:bg-brand-hover text-white rounded-lg"

// Card
"bg-dark-card border border-dark-border rounded-lg"

// Text hierarchy
"text-white"           // Primary
"text-[#B3B3B3]"       // Secondary
"text-[#666666]"       // Muted

// Interactive card with brand hover
"bg-dark-card hover:bg-dark-card-hover border-dark-border group"
"group-hover:text-brand"  // Text inside
```

### Migration Notes

**FootballGPT currently uses green.** To align with brand:
1. Add CSS variables to `globals.css`
2. Replace `green-600` → `brand` / `var(--brand-primary)`
3. Replace `green-700` → `brand-hover` / `var(--brand-primary-hover)`
4. Consider dark theme as default (matches website + Skool)

---

## Design Resources

| Resource | Author | Why It Matters |
|----------|--------|----------------|
| **Refactoring UI** | Adam Wathan & Steve Schoger | Practical design rules for developers. Essential when reviewing AI-generated UI - covers spacing, typography, color, hierarchy. |

**Note:** AI can generate functional UI but often misses design nuance. Use these resources to review and refine AI output.

---

*Last Updated: January 2026*
*Brand colors from: 360tft.co.uk*
*Patterns from: FootballGPT audit*
