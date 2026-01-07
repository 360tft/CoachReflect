# CoachReflect Technical Documentation

## Overview

CoachReflect is a reflective journaling app for football coaches. Coaches log sessions, upload session plans (analyzed by AI), and capture guided reflections with AI-powered insights.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| UI Components | Custom shadcn-style components |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI | Anthropic Claude API (Vision + Text) |
| Payments | Stripe |
| Hosting | Vercel |

## Project Structure

```
CoachReflect/
├── app/
│   ├── (auth)/                    # Auth pages (login, signup)
│   ├── api/                       # API routes
│   │   ├── analyze-plan/          # Claude Vision for session plans
│   │   ├── auth/callback/         # OAuth callback
│   │   ├── reflections/           # Reflection CRUD + AI analysis
│   │   ├── sessions/              # Session CRUD
│   │   └── stripe/                # Checkout, webhook, portal
│   ├── components/ui/             # Reusable UI components
│   ├── dashboard/                 # Protected dashboard routes
│   │   ├── history/               # Reflection history
│   │   ├── reflect/               # New reflection, view/edit
│   │   └── settings/              # User settings, subscription
│   ├── types/                     # TypeScript types and constants
│   ├── globals.css                # Global styles, theme colors
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
├── lib/
│   ├── supabase/                  # Supabase clients (browser, server, middleware)
│   └── utils.ts                   # Utility functions (cn)
├── supabase/
│   └── migrations/                # Database migrations
├── docs/                          # Exit-ready documentation
├── middleware.ts                  # Auth middleware
└── package.json
```

## Database Schema

### Tables

**profiles**
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `display_name` (TEXT)
- `club_name` (TEXT)
- `age_group` (TEXT)
- `coaching_level` (ENUM: grassroots, academy, semi-pro, professional)
- `subscription_tier` (ENUM: free, pro, pro_plus)
- `stripe_customer_id` (TEXT)
- `reflections_this_month` (INT)
- `reflection_count_period` (TEXT, format: YYYY-MM) - auto-resets counter when month changes
- `subscription_period_end` (TIMESTAMPTZ)
- `subscription_status` (ENUM: active, inactive, past_due, canceled)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**sessions**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `title` (TEXT)
- `session_type` (ENUM: training, match, friendly, tournament, trial, individual)
- `date` (DATE)
- `duration_minutes` (INT)
- `players_present` (INT)
- `weather` (TEXT)
- `notes` (TEXT)
- `created_at` (TIMESTAMPTZ)

**reflections**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `session_id` (UUID, FK to sessions)
- `date` (DATE)
- `what_worked`, `what_didnt_work`, `player_standouts`, `areas_to_improve`, `next_focus` (TEXT)
- `mood_rating`, `energy_rating` (INT, 1-5)
- `ai_summary` (TEXT)
- `ai_insights` (TEXT)
- `ai_action_items` (JSONB)
- `tags` (TEXT[])
- `is_private` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**session_plans**
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `reflection_id` (UUID, FK)
- `image_url` (TEXT)
- `image_type` (ENUM: handwritten, digital, mixed)
- `title`, `objectives`, `drills`, `coaching_points`, `equipment_needed` (various)
- `total_duration_minutes` (INT)
- `confidence_score` (DECIMAL)
- `raw_extraction` (TEXT)
- `created_at` (TIMESTAMPTZ)

**insights** (AI-generated patterns)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `insight_type` (ENUM: recurring_challenge, player_pattern, improvement_trend, decline_trend, suggestion, milestone)
- `title`, `description` (TEXT)
- `related_reflections` (UUID[])
- `confidence_score` (DECIMAL)
- `is_dismissed` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

### Database Functions

- `handle_new_user()` - Auto-creates profile on signup
- `increment_reflection_count()` - Tracks monthly reflection count
- `get_reflection_stats()` - Returns aggregated stats for a user

### Row Level Security

All tables have RLS enabled. Users can only access their own data.

## API Routes

### Authentication
- `GET /api/auth/callback` - OAuth callback, exchanges code for session

### Reflections
- `GET /api/reflections` - List user's reflections
- `POST /api/reflections` - Create reflection
- `GET /api/reflections/[id]` - Get single reflection
- `PUT /api/reflections/[id]` - Update reflection
- `DELETE /api/reflections/[id]` - Delete reflection
- `POST /api/reflections/[id]/analyze` - Generate AI insights (Pro only)

### Sessions
- `GET /api/sessions` - List user's sessions
- `POST /api/sessions` - Create session

### Profile
- `PUT /api/profile` - Update user profile (name, club, age group, coaching level)

### AI Analysis
- `POST /api/analyze-plan` - Analyze session plan image with Claude Vision (Pro only)

### Stripe
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/webhook` - Handle Stripe events
- `POST /api/stripe/portal` - Redirect to customer portal

## Authentication Flow

1. User signs up with email/password
2. Supabase sends confirmation email
3. User clicks confirmation link → `/api/auth/callback`
4. Callback exchanges code for session
5. User redirected to `/dashboard`
6. Middleware checks auth on `/dashboard/*` routes

## Subscription Tiers

| Feature | Free | Pro ($7.99/mo) |
|---------|------|----------------|
| Reflections | 5/month | Unlimited |
| AI Summary | No | Yes |
| AI Insights | No | Yes |
| Session Plan Upload | No | Yes |

## AI Integration

### Session Plan Analysis (Claude Vision)
- Accepts image upload (JPG, PNG, WebP up to 10MB)
- Sends to Claude Vision API
- Extracts: title, objectives, drills, coaching points, equipment, duration
- Returns structured JSON with confidence score

### Reflection Analysis (Claude Text)
- Sends reflection content to Claude API
- Generates: summary, insights, action items
- Saves to reflection record

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Stripe Webhook Setup
1. Create webhook endpoint in Stripe Dashboard
2. Point to: `https://your-domain.com/api/stripe/webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

## Key Files

| File | Purpose |
|------|---------|
| `middleware.ts` | Auth protection for routes |
| `app/types/index.ts` | All TypeScript types and constants |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `app/dashboard/layout.tsx` | Dashboard layout with navigation |
| `app/dashboard/reflect/new/page.tsx` | Multi-step reflection form |
| `app/api/analyze-plan/route.ts` | Claude Vision integration |
