# CURRENT TASK: Bring CoachReflect to FootballGPT Standard

**Priority:** HIGH
**Assigned:** Claude Code
**Reference:** FootballGPT at `/home/kevin/FootballGPT`

---

## Overview

CoachReflect is 18% complete. You need to add 14 missing features to match FootballGPT.

**DO NOT LAUNCH until Phase 1 (P0) features are complete.**

---

## Phase 1: P0 Features (Do First)

### 1. AI Chat Interface

**What's missing:** No conversational AI - only session plan analysis exists

**Copy from FootballGPT:**
```
/home/kevin/FootballGPT/src/app/api/chat/route.ts
/home/kevin/FootballGPT/src/lib/gemini.ts
/home/kevin/FootballGPT/src/components/chat/
```

**CoachReflect adaptation:**
- Chat should help coaches reflect on sessions
- Prompts like: "Tell me about your session today" → AI asks follow-up questions
- AI helps identify patterns: "You've mentioned player focus issues 3 times this month"
- Integrate with existing reflections data

**System prompt focus:**
- Reflective coaching questions
- Pattern recognition from past reflections
- Actionable suggestions for next session

**Steps:**
1. Copy chat API route structure
2. Create CoachReflect-specific system prompts
3. Create chat UI components
4. Integrate with existing session/reflection data

---

### 2. Conversations (Chat History)

**Copy from FootballGPT:**
```
/home/kevin/FootballGPT/src/app/api/conversations/
/home/kevin/FootballGPT/src/lib/conversations.ts
```

**Database migration:**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 3. Cron Jobs & Email Sequences

**Copy from FootballGPT:**
```
/home/kevin/FootballGPT/src/app/api/cron/
/home/kevin/FootballGPT/src/emails/templates/
/home/kevin/FootballGPT/src/lib/email.ts
```

**CoachReflect email sequence:**
1. Welcome - "Start your coaching journal"
2. First value - "3 reflection questions elite coaches ask"
3. Streak intro - "Build a reflection habit"
4. Feature highlight - "AI-powered pattern recognition"
5. Social proof - "How coaches use CoachReflect"
6. Upgrade pitch - "Unlock unlimited reflections"

**Database migrations:**
```sql
CREATE TABLE email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  paused BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, sequence_name)
);

CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  error TEXT
);
```

---

### 4. Admin Dashboard

**Copy from FootballGPT:**
```
/home/kevin/FootballGPT/src/app/api/admin/
/home/kevin/FootballGPT/src/app/admin/
```

**CoachReflect metrics to show:**
- Total users, active users
- Reflections per user
- Session plans analyzed
- Subscription stats
- Reflection streaks

---

## Phase 2: P1 Features (Engagement)

### 5. Gamification (Reflection Streaks)

**Copy from FootballGPT:**
```
/home/kevin/FootballGPT/src/lib/gamification.ts
/home/kevin/FootballGPT/src/app/api/gamification/
```

**CoachReflect adaptation:**

| FootballGPT | CoachReflect |
|-------------|--------------|
| Message streaks | Reflection streaks |
| Topic badges | Reflection category badges |
| Question milestones | Reflection milestones |

**Badges for CoachReflect:**
- 🔥 3-day reflection streak
- 📝 10 reflections
- 🎯 First session plan uploaded
- 🧠 Used AI chat 10 times
- 📊 Identified first pattern

**Database:**
```sql
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  total_active_days INTEGER DEFAULT 0
);

CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  category TEXT,
  requirement_count INTEGER
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT REFERENCES badges(id),
  progress INTEGER DEFAULT 0,
  earned_at TIMESTAMPTZ,
  UNIQUE(user_id, badge_id)
);
```

---

### 6. Memory System

**Copy from:** `/home/kevin/FootballGPT/src/app/api/memory/`

**CoachReflect memory stores:**
- Team info (age group, level, format)
- Common themes from reflections
- Areas of focus
- What's worked well

---

### 7. Feedback System

**Copy from:** `/home/kevin/FootballGPT/src/app/api/feedback/`

---

### 8. Push Notifications

**Copy from:** `/home/kevin/FootballGPT/src/app/api/push/`

**For:** Reflection reminders, streak alerts

---

### 9. Share System

**Copy from:** `/home/kevin/FootballGPT/src/app/api/share/`

**For:** Share reflection insights, streaks, badges

---

## Phase 3: P2 Features (Polish)

### 10-14. Remaining Features

| Feature | Copy From | Purpose |
|---------|-----------|---------|
| `account` | FootballGPT | Delete/export data |
| `pro-trial` | FootballGPT | Server-side trial |
| `track-visit` | FootballGPT | Analytics |
| `sponsors` | FootballGPT | Future revenue |
| `unsubscribe` | FootballGPT | Email compliance |

---

## Environment Variables Needed

```env
# AI
GOOGLE_AI_API_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@coachreflect.com

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Admin
ADMIN_EMAILS=kevin@360tft.com

# Cron
CRON_SECRET=
```

---

## Implementation Order

1. **chat** - Core value prop (AI-assisted reflection)
2. **conversations** - Chat history
3. **admin** - Visibility for Kevin
4. **cron + emails** - Retention
5. **gamification** - Reflection streaks (stickiness)
6. **memory** - Personalization
7. **Everything else** - Polish

---

## Key Insight

CoachReflect is different from FootballGPT:
- FootballGPT = Q&A (user asks, AI answers)
- CoachReflect = Guided reflection (AI asks, user reflects)

The chat should feel like a coaching conversation, not a knowledge lookup.

**Example flow:**
```
AI: "How did training go today?"
User: "Good but players seemed distracted"
AI: "What do you think was causing the distraction?"
User: "Maybe the drill was too complex"
AI: "That's a great insight. You mentioned complexity issues last week too.
     Would you like me to suggest some simpler progressions?"
```

---

## Testing Checklist

- [ ] AI chat works and feels like guided reflection
- [ ] Conversations persist
- [ ] Admin dashboard shows reflection stats
- [ ] Welcome email sends on signup
- [ ] Reflection streaks track correctly
- [ ] `npm run build` passes

---

## Commands

```bash
npm run build    # Must pass before committing
npm run dev      # Test locally
```

## When Done

1. Commit each phase separately
2. Update CLAUDE.md to mark features as complete
3. Delete this CURRENT-TASK.md file

---

**Questions?** Check FootballGPT implementation. Every pattern you need is there.
