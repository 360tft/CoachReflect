# Coach Reflection - Claude Session Context

---

## Code Review Standards (MANDATORY)

Before ANY commit, follow the code review checklist at:
`/home/kevin/360tft_Marketing/_Tools/docs/CODE-REVIEW-STANDARDS.md`

**Critical checks:**
- Security: No secrets, server-side validation, auth checks
- Bloat: No unused code/deps, run `npx depcheck` monthly
- Quality: Build passes, accessibility, responsive
- Monthly: `npm audit`, `npx ts-prune`

**From the audit (2026-01-11):**
- Remove `@stripe/stripe-js` (unused - using server-side stripe only)
- Add `metadataBase` to root layout for SEO
- Migrate `themeColor` to viewport exports (Next.js 16)

---

## MANDATORY: SAAS STANDARDS COMPLIANCE

**Before making ANY changes, check the master standards.**

See `/home/kevin/CLAUDE.md` → "SAAS BEST PRACTICES (THE STANDARD)" for:
- Project structure and folder conventions
- Three Supabase clients pattern (client.ts, server.ts, admin.ts)
- API route pattern (authenticate → rate limit → validate → check permissions → process)
- Stripe integration patterns (checkout, webhook with idempotency)
- Database-driven email sequences
- Gamification implementation
- Rate limiting with Redis + fallback
- Required components checklist
- Anti-patterns to avoid

**Reference Implementation:** `/home/kevin/FootballGPT`

### Compliance Check Command

When asked to "check compliance" or "align with FootballGPT", run this process:

1. **Compare features** - Check `/home/kevin/FootballGPT/src/app/api/` against this repo's API routes
2. **Compare components** - Check `/home/kevin/FootballGPT/src/components/` for missing UI components
3. **Compare lib** - Check `/home/kevin/FootballGPT/src/lib/` for missing utilities
4. **Apply brand adaptations** (see table below)
5. **Report gaps** - List missing features with implementation priority

### Brand Adaptations (FootballGPT → Coach Reflection)

| FootballGPT | Coach Reflection |
|-------------|--------------|
| `#16a34a` (green) | `#E5A11C` (gold - 360TFT brand) |
| `FootballGPT` | `Coach Reflection` |
| `chat` / `messages` | `reflections` / `journal entries` |
| `AI assistant` | `reflection companion` |
| `coach` / `player` | `coach` (same) |
| `Football Coaching Academy` | `Football Coaching Academy` (same ecosystem) |
| `footballgpt.co` | `coachreflection.com` |
| Advisor modes | Reflection prompts / guided questions |

---

## ✅ FOOTBALLGPT PARITY COMPLETE (17/17 Features + Brand Assets)

**Coach Reflection has reached full feature parity with FootballGPT.**

### Reference Implementation
- **Blueprint repo:** `/home/kevin/FootballGPT`
- **Master checklist:** `/home/kevin/PRODUCT-SETUP-CHECKLIST.md`

### All Features Implemented ✅

| Category | Features |
|----------|----------|
| **P0 (Core)** | chat, conversations, cron/emails, admin/metrics |
| **P1 (Engagement)** | gamification, memory, feedback, push/subscribe, share |
| **P2 (Polish)** | account/delete, account/export, pro-trial, track, sponsors, unsubscribe |
| **Product-Specific** | reflections, sessions, analyze-plan (vision), auth, stripe |

### Brand Assets ✅

| Asset | Status | Location |
|-------|--------|----------|
| Browser icon | ✅ | `app/icon.tsx` (dynamic, gold CR) |
| Apple touch icon | ✅ | `app/apple-icon.tsx` (dynamic, gold CR) |
| OG image | ✅ | `app/opengraph-image.tsx` |
| Twitter image | ✅ | `app/twitter-image.tsx` |
| PWA manifest | ✅ | `public/manifest.json` |
| Metadata | ✅ | `app/layout.tsx` (OG + Twitter meta) |

**Brand Colors:** Gold `#E5A11C`, Dark `#0A0A0A` (360TFT brand)

### Key Libraries

| Library | Location | Purpose |
|---------|----------|---------|
| Chat Config | `lib/chat-config.ts` | System prompts, user context |
| Email Sequences | `lib/email-sequences.ts` | Onboarding/winback |
| Email Templates | `lib/email-templates.ts` | React Email templates |
| Supabase | `lib/supabase/` | Database client |

### What's Left (For Kevin)

| Task | Time |
|------|------|
| Run migrations in Supabase | 10 min |
| Set env vars in Vercel | 10 min |
| Configure Stripe webhook URL | 5 min |
| Create Stripe sponsor price ($99/mo) | 5 min |
| Deploy to Vercel | 2 min |
| Create CREDENTIALS.md (gitignored) | 5 min |
| **Total** | **~40 min** |

---

## Business Goals

**Primary Objective**: Build MVP, validate with FCA community, grow to $5K MRR.

**Brand**: 360 TFT product (subtle branding)
**Price**: $7.99/mo (TBD)
**Target**: Grassroots to semi-pro football coaches

---

## EXIT-READY DOCUMENTATION

This repo MUST maintain 3 documents for potential acquisition. Update them whenever changes are made.

### Required Documents

| Document | Location | Contents |
|----------|----------|----------|
| **TECHNICAL.md** | `/docs/TECHNICAL.md` | Architecture, stack, schema, APIs, flows |
| **CREDENTIALS.md** | `/docs/CREDENTIALS.md` (gitignored) | All service logins and access |
| **SOP.md** | `/docs/SOP.md` | Daily/weekly operations, support, deployment |

### Implementation Rules

1. **Check if docs exist** - Before any work, verify these docs exist. Create if missing.
2. **Update on changes** - Any technical change triggers a doc update.
3. **CREDENTIALS.md is gitignored** - NEVER commit secrets.
4. **Keep current** - Outdated docs are worse than no docs.

### What Goes Where

**TECHNICAL.md:**
- Tech stack (Next.js, Supabase, Claude Vision)
- Database schema (profiles, sessions, reflections, insights, session_plans)
- API routes (reflection CRUD, session plan analysis)
- AI integration (Claude Vision for session plan extraction)
- Auth flow (Supabase Auth)
- Environment variables list
- Local dev & deployment instructions

**CREDENTIALS.md (gitignored):**
- Vercel login
- Supabase project access
- Anthropic API key location
- Domain registrar access
- GitHub repo access
- All 2FA recovery codes

**SOP.md:**
- Daily: Check logs, review new signups
- Weekly: Review analytics, user feedback
- Support: Common issues and solutions
- Deployment: How to deploy, rollback procedure
- Handoff checklist for sale/transfer

### Current Status

| Document | Status | Action Needed |
|----------|--------|---------------|
| TECHNICAL.md | ❓ Check | Create or update |
| CREDENTIALS.md | ❓ Check | Create (gitignored) |
| SOP.md | ❓ Check | Create or update |

**First task when working on this repo: Verify these docs exist and are current.**

---

## Product Overview

Coach Reflection is a reflective journaling app for football coaches. It helps coaches capture post-session thoughts, track patterns over time, and get AI-powered insights to improve their coaching.

**Target User:** Grassroots to semi-pro football coaches who want to systematically improve through reflection.

**Core Value Prop:** Turn post-session chaos into structured growth. Most coaches think about sessions but don't capture insights - Coach Reflection makes reflection quick, guided, and actionable.

---

## Roadmap

### V1 - MVP (Current)
- [x] Landing page with waitlist
- [x] Coming Soon login/signup
- [ ] Enable Supabase for auth
- [ ] Basic reflection form (guided prompts)
- [ ] Session logging
- [ ] Reflection history

### V2 - Session Plan Upload
- [ ] **Session Plan Upload** - Coaches upload photos of handwritten or digital session plans
- [ ] **AI Vision Extraction** - Claude/GPT-4V reads and interprets the plan
- [ ] **Structured Data** - Extract objectives, drills, timing, coaching points
- [ ] **Pre-populated Reflections** - Use session plan context to guide reflection questions
- [ ] **Plan vs Reality** - Compare planned objectives with actual outcomes

**Technical Requirements:**
- Image upload component (drag & drop, camera capture on mobile)
- Supabase Storage for image storage
- `/api/analyze-session-plan` endpoint using Claude Vision
- SessionPlan type with extracted fields
- Link session plans to reflections

**Cost Estimate:** ~$0.01-0.02 per image analysis

### V3 - AI Insights
- [ ] Pattern detection across reflections
- [ ] Player tracking and development insights
- [ ] Trend analysis (mood, energy, performance)
- [ ] AI-generated coaching suggestions
- [ ] Weekly/monthly summary reports

### V4 - Team Features
- [ ] Multi-coach collaboration
- [ ] Shared team reflections
- [ ] Coach-to-coach feedback
- [ ] Academy/club admin dashboard

---

## Technical Stack

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API routes
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Claude Vision / GPT-4V for session plan analysis
- **Hosting:** Vercel

---

## Database Schema

See `supabase/migrations/` for full schema. Key tables:
- `profiles` - User settings and subscription
- `sessions` - Training/match session logs
- `reflections` - Guided reflection entries
- `insights` - AI-generated patterns and suggestions
- `session_plans` - Uploaded session plan images and extracted data (V2)

---

## Current Status

- Landing page deployed
- Login/signup showing "Coming Soon" (no Supabase yet)
- Waiting to enable Supabase when ready to validate demand

---

## INFRASTRUCTURE SETUP (2026-01-24) ✅ COMPLETE

### Domain & DNS ✅ COMPLETE

**Domain:** coachreflection.com (Namecheap)
**Live URL:** https://coachreflection.com

| Record | Host | Value | Status |
|--------|------|-------|--------|
| A | @ | 76.76.21.21 | ✅ Vercel |
| CNAME | www | cname.vercel-dns.com | ✅ Vercel |
| TXT | @ | v=spf1 include:amazonses.com include:resend.com ~all | ✅ SPF |
| TXT | resend._domainkey | DKIM key | ✅ Resend |
| MX | send | feedback-smtp.eu-west-1.amazonses.com (pri 10) | ✅ Resend |
| TXT | send | v=spf1 include:amazonses.com ~all | ✅ Resend |

**Resend Domain:** ✅ Verified
**Vercel Domain:** ✅ Added (coachreflection.com + www.coachreflection.com)
**SSL Certificate:** ✅ Active

### Vercel Environment Variables ✅ COMPLETE (22 vars)

**Core (10 vars):**
| Variable | Status | Source |
|----------|--------|--------|
| NEXT_PUBLIC_APP_URL | ✅ | https://coachreflection.com |
| RESEND_API_KEY | ✅ | Resend |
| GOOGLE_CLIENT_ID | ✅ | Google Cloud (reused) |
| GOOGLE_CLIENT_SECRET | ✅ | Google Cloud (reused) |
| UPSTASH_REDIS_REST_URL | ✅ | Upstash (reused) |
| UPSTASH_REDIS_REST_TOKEN | ✅ | Upstash (reused) |
| OPENAI_API_KEY | ✅ | OpenAI (reused) |
| GOOGLE_AI_API_KEY | ✅ | Google AI (reused) |
| CRON_SECRET | ✅ | Auto-generated |
| ADMIN_EMAILS | ✅ | kevin@360tft.com |

**Stripe Price IDs (12 vars - placeholders, fill when creating products):**
| Variable | Product | Price |
|----------|---------|-------|
| NEXT_PUBLIC_STRIPE_PRO_PRICE_ID | Pro Monthly | $7.99 |
| NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID | Pro Annual | $79 |
| STRIPE_PRO_PLUS_PRICE_ID | Pro+ Monthly | $29 |
| STRIPE_PRO_PLUS_ANNUAL_PRICE_ID | Pro+ Annual | $290 |
| STRIPE_SPONSOR_PRICE_ID | Sponsor Monthly | $99 |
| STRIPE_SPONSOR_ANNUAL_PRICE_ID | Sponsor Annual | $899 |
| STRIPE_PRICE_CLUB_SMALL_MONTHLY | Small Club Monthly | $29 |
| STRIPE_PRICE_CLUB_SMALL_ANNUAL | Small Club Annual | $259 |
| STRIPE_PRICE_CLUB_MONTHLY | Club Monthly | $59 |
| STRIPE_PRICE_CLUB_ANNUAL | Club Annual | $529 |
| STRIPE_PRICE_CLUB_ACADEMY_MONTHLY | Academy Monthly | $99 |
| STRIPE_PRICE_CLUB_ACADEMY_ANNUAL | Academy Annual | $899 |

### Automation Scripts

Located in `/scripts/`:
- `setup-vercel-env.sh` - Push env vars to Vercel
- `setup-stripe-products.sh` - Create Stripe products/prices
- `setup-stripe-webhook.sh` - Create Stripe webhook
- `setup-namecheap-dns.sh` - Configure DNS via Namecheap API
- `add-dkim-record.sh` - Add DKIM for Resend
- `verify-setup.sh` - Verify all services configured

### Still Needed (When Ready to Launch)

| Item | Triggers Cost? | Status |
|------|---------------|--------|
| Supabase project | **Yes** | ⏳ Pending (create last) |
| Supabase env vars | - | ⏳ After project created |
| Stripe products (create in dashboard) | No | ⏳ Pending |
| Update Stripe price ID env vars | - | ⏳ After products created |
| Stripe webhook | - | ⏳ After products created |
| Google OAuth redirect URI | No | ⏳ After Supabase created |

### Google OAuth Note

When Supabase project is created, add this redirect URI to Google Cloud Console:
- `https://[SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback`

---

## Session Plan Upload Feature (V2 Spec)

### User Flow
1. Coach creates new reflection
2. Optional: "Add session plan" button
3. Upload image (drag & drop, file picker, or camera)
4. AI analyzes image in real-time (~2-3 seconds)
5. Extracted content displayed:
   - Session objectives
   - Drills/activities with descriptions
   - Timing breakdown
   - Key coaching points
   - Setup diagrams (if present)
6. Coach confirms/edits extracted data
7. Reflection form pre-populated with context
8. AI asks targeted questions: "You planned X, how did it go?"

### Extracted Data Structure
```typescript
interface SessionPlan {
  id: string
  user_id: string
  reflection_id: string | null

  // Image
  image_url: string
  image_type: 'handwritten' | 'digital' | 'mixed'

  // Extracted content
  title: string | null
  objectives: string[]
  drills: SessionDrill[]
  total_duration_minutes: number | null
  coaching_points: string[]
  equipment_needed: string[]

  // Metadata
  confidence_score: number // 0-1, how confident AI is in extraction
  raw_extraction: string // Full text extracted
  created_at: string
}

interface SessionDrill {
  name: string
  description: string | null
  duration_minutes: number | null
  setup: string | null
  coaching_focus: string | null
}
```

### API Endpoint
```
POST /api/analyze-session-plan
Body: { image: base64 }
Response: SessionPlan (without id, user_id)
```

### AI Prompt Strategy
Use Claude Vision with structured extraction prompt:
- Identify if handwritten or digital
- Extract all text content
- Parse into structured format
- Handle poor handwriting gracefully
- Return confidence score

---

## DEPLOYMENT TODO (Updated 2026-01-16)

Before Coach Reflection goes fully live with clubs and analytics:

### Stripe Setup (12 prices to create)
- [ ] Pro Monthly ($7.99) → `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID`
- [ ] Pro Annual ($79) → `NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID`
- [ ] Pro+ Monthly ($29) → `STRIPE_PRO_PLUS_PRICE_ID`
- [ ] Pro+ Annual ($290) → `STRIPE_PRO_PLUS_ANNUAL_PRICE_ID`
- [ ] Sponsor Monthly ($99) → `STRIPE_SPONSOR_PRICE_ID`
- [ ] Sponsor Annual ($899) → `STRIPE_SPONSOR_ANNUAL_PRICE_ID`
- [ ] Small Club Monthly ($29) → `STRIPE_PRICE_CLUB_SMALL_MONTHLY`
- [ ] Small Club Annual ($259) → `STRIPE_PRICE_CLUB_SMALL_ANNUAL`
- [ ] Club Monthly ($59) → `STRIPE_PRICE_CLUB_MONTHLY`
- [ ] Club Annual ($529) → `STRIPE_PRICE_CLUB_ANNUAL`
- [ ] Academy Monthly ($99) → `STRIPE_PRICE_CLUB_ACADEMY_MONTHLY`
- [ ] Academy Annual ($899) → `STRIPE_PRICE_CLUB_ACADEMY_ANNUAL`

### Vercel Setup
- [ ] Add all 12 Stripe price IDs as environment variables
- [ ] Verify `STRIPE_WEBHOOK_SECRET` is set

### Supabase Setup
- [ ] Run migration: `supabase/migrations/20260116_clubs_and_analytics.sql`
- [ ] Run migration: `supabase/migrations/20260117_multi_sport.sql`

### Stripe Webhook
- [ ] Add webhook endpoint: `https://[your-domain]/api/stripe/webhook`
- [ ] Enable events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

