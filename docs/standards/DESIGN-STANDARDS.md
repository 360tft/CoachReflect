# Design Standards (All Products)

**Master Reference Document**
All products must follow these standards. No exceptions.

---

## Core Principles

1. **Professional over playful** - Our users are professionals (coaches, referees, cruisers, fitness-focused adults)
2. **Clarity over decoration** - Every element must serve a purpose
3. **Minimalism over clutter** - When in doubt, remove it
4. **Performance is design** - Fast-loading sites signal quality

---

## Absolute Rules

### NO Emojis in UI

**Never use emojis in:**
- Navigation menus
- Buttons and CTAs
- Headers and titles
- Feature lists
- Pricing tables
- Form labels
- Error messages
- Success messages
- Footer content
- Sidebar content
- Card titles
- List items
- Badges and tags

**Exception - AI chat responses only:**
- The AI persona may use occasional emojis in conversational responses
- Maximum 1-2 per response, never in every message
- Never in system messages or UI chrome

**Why:** 94% of user judgments come from design alone in under 0.5 seconds. Emojis signal "casual/playful" which undermines professional credibility.

### NO Decorative Icons in Lists

**Wrong:**
```
✅ Feature one
✅ Feature two
🚀 Fast performance
💪 Strong security
```

**Right:**
```
• Feature one
• Feature two
• Fast performance
• Strong security
```

Or use a consistent, minimal checkmark icon (not emoji) for feature lists.

---

## Typography

### Hierarchy

| Element | Size | Weight | Use |
|---------|------|--------|-----|
| H1 | 2.5-3rem | Bold (700) | Page titles only |
| H2 | 1.75-2rem | Semibold (600) | Section headers |
| H3 | 1.25-1.5rem | Semibold (600) | Subsections |
| Body | 1rem (16px) | Regular (400) | Paragraphs |
| Small | 0.875rem | Regular (400) | Captions, meta |

### Rules

- One font family per product (Inter, system-ui, or similar sans-serif)
- Maximum 3 font weights per page
- Line height: 1.5-1.7 for body text
- Never use decorative/script fonts
- Never use ALL CAPS for more than 2-3 words

---

## Color

### Dark Mode First

All products use dark mode as default. Light mode is optional.

### Brand Colors

| Product | Primary | Background | Card BG | Text |
|---------|---------|------------|---------|------|
| CruiseGPT | #0077B6 | #1a1a2e | #242438 | #ffffff |
| RefereeGPT | #E5A11C | #0A0A0A | #111111 | #ffffff |
| CoachReflect | #E5A11C | #0A0A0A | #111111 | #ffffff |
| FitGPT | #10b981 | #0A0A0A | #111111 | #ffffff |

### Color Rules

- Primary color for CTAs and key actions only
- Don't overuse primary color - it loses impact
- Text contrast ratio: minimum 4.5:1 (WCAG AA)
- Use gray scale for secondary elements
- Error: red (#ef4444), Success: green (#22c55e), Warning: amber (#f59e0b)

---

## Spacing

### Consistent Scale

Use a spacing scale based on 4px or 8px:

```
4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px, 96px
```

### Rules

- Generous whitespace signals premium quality
- Sections: 64-96px vertical padding
- Cards: 24-32px internal padding
- Between elements: 16-24px
- Never crowd elements together
- When in doubt, add more space

---

## Components

### Buttons

**Primary (CTA):**
- Background: brand primary color
- Text: white
- Padding: 12px 24px minimum
- Border radius: 8px (consistent)
- No icons unless essential
- No emojis ever

**Secondary:**
- Background: transparent or subtle gray
- Border: 1px solid gray
- Same padding and radius as primary

**Ghost:**
- Background: transparent
- Text: primary or gray
- Hover: subtle background

### Cards

- Background: slightly lighter than page background
- Border: subtle (1px, low opacity) or none
- Border radius: 12px (consistent)
- Shadow: subtle or none (dark mode doesn't need shadows)
- Padding: 24px minimum

### Forms

- Label above input (not inline)
- Input height: 44-48px minimum (touch friendly)
- Border radius: 8px
- Clear focus states
- Error messages below input, not in alert boxes
- No placeholder-only labels

### Navigation

- Clean, minimal
- No icons unless universal (hamburger, search, user)
- No emojis
- Clear active state
- Mobile: hamburger menu or bottom nav

---

## Images & Icons

### Icons

- Use a consistent icon library (Lucide, Heroicons)
- One icon style: outline OR filled, not mixed
- Icon size: 20-24px for inline, 40-48px for features
- Color: match text color or primary (sparingly)

### Images

- Optimize all images (WebP format preferred)
- Lazy load below-fold images
- Always include alt text
- Avoid stock photos that look generic
- Screenshots should be high quality, not compressed

---

## Layout

### Max Width

- Content: 1200px max
- Text blocks: 65-75 characters per line (readable)
- Full-bleed sections allowed for visual impact

### Grid

- 12-column grid for complex layouts
- Simple layouts: single column or two-column
- Mobile: single column, stack everything

### Responsive Breakpoints

```css
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

---

## Animations & Interactions

### Allowed

- Subtle hover states (color change, slight scale)
- Smooth transitions (150-300ms)
- Loading spinners/skeletons
- Form validation feedback

### Not Allowed

- Bouncing elements
- Spinning icons (except loading)
- Parallax scrolling
- Auto-playing videos
- Animations that delay content
- Anything that feels "gimmicky"

### Timing

- Micro-interactions: 150ms
- Page transitions: 200-300ms
- Never more than 500ms for any animation

---

## Copy & Microcopy

### Voice

- Professional but approachable
- Direct and clear
- No jargon unless audience expects it
- No exclamation marks in UI (save for chat)
- No ALL CAPS for emphasis

### Button Labels

**Good:**
- "Sign up"
- "Get started"
- "Continue"
- "Save changes"

**Bad:**
- "Sign up now! 🚀"
- "LET'S GO!"
- "Click here"
- "Submit"

### Error Messages

**Good:**
- "Email address is required"
- "Password must be at least 8 characters"
- "Something went wrong. Please try again."

**Bad:**
- "Oops! 😅 You forgot your email!"
- "ERROR: INVALID INPUT"
- "Uh oh, that didn't work!"

---

## Performance Standards

### Core Web Vitals Targets

| Metric | Target |
|--------|--------|
| LCP (Largest Contentful Paint) | < 2.5s |
| FID (First Input Delay) | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.1 |

### Rules

- No render-blocking resources
- Optimize images before upload
- Lazy load non-critical content
- Minimize JavaScript bundle size
- Use system fonts or subset custom fonts

---

## Accessibility

### Minimum Requirements

- All interactive elements keyboard accessible
- Focus states visible
- Color contrast WCAG AA (4.5:1)
- Alt text on all images
- Form labels associated with inputs
- Error messages announced to screen readers

---

## Code Patterns

### Tailwind Classes (Examples)

**Card:**
```jsx
<div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
```

**Primary Button:**
```jsx
<button className="bg-brand hover:bg-brand-hover text-white font-medium px-6 py-3 rounded-lg transition-colors">
```

**Section Spacing:**
```jsx
<section className="py-16 md:py-24">
```

**Text Hierarchy:**
```jsx
<h1 className="text-3xl md:text-4xl font-bold">
<h2 className="text-2xl font-semibold">
<p className="text-gray-400 leading-relaxed">
```

---

## Checklist for New Features

Before shipping any UI:

- [ ] No emojis in UI elements
- [ ] Typography follows hierarchy
- [ ] Colors from approved palette
- [ ] Spacing uses scale (4px/8px based)
- [ ] Buttons have proper padding and states
- [ ] Forms are accessible
- [ ] Responsive on mobile
- [ ] Animations are subtle (< 300ms)
- [ ] Copy is professional (no exclamation marks, no emojis)
- [ ] Performance: page loads in < 3s

---

## Anti-Patterns (Never Do)

| Anti-Pattern | Why It's Bad |
|--------------|--------------|
| Emojis in navigation | Unprofessional, childish |
| Rainbow gradients | Dated, distracting |
| Bouncing animations | Annoying, gimmicky |
| ALL CAPS BUTTONS | Aggressive, hard to read |
| "Click here" links | Poor accessibility, vague |
| Stock photo heroes | Generic, forgettable |
| Carousel sliders | Users don't engage, slow |
| Pop-ups on load | Interrupts, high bounce rate |
| Tiny click targets | Frustrating on mobile |
| Low contrast text | Inaccessible, hard to read |

---

## Reference Sites (Study These)

**SaaS Excellence:**
- Linear (linear.app) - Clean, minimal, professional
- Stripe (stripe.com) - Typography, whitespace mastery
- Vercel (vercel.com) - Dark mode done right
- Notion (notion.so) - Clarity and simplicity

**What They Have in Common:**
- No emojis in UI
- Generous whitespace
- Strong typography hierarchy
- Subtle animations
- Fast performance
- Professional copy

---

*Last Updated: January 2026*
*Applies to: CruiseGPT, RefereeGPT, CoachReflect, FitGPT, and all future products*
