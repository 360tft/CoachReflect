# CoachReflect - Claude Session Context

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

CoachReflect is a reflective journaling app for football coaches. It helps coaches capture post-session thoughts, track patterns over time, and get AI-powered insights to improve their coaching.

**Target User:** Grassroots to semi-pro football coaches who want to systematically improve through reflection.

**Core Value Prop:** Turn post-session chaos into structured growth. Most coaches think about sessions but don't capture insights - CoachReflect makes reflection quick, guided, and actionable.

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
