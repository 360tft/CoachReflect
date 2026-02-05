export interface CoachingTopic {
  slug: string
  title: string
  description: string
  category: 'reflection' | 'development' | 'communication' | 'planning' | 'wellbeing'
  questions: string[]
  relatedTopics: string[]
}

export const COACHING_TOPICS: CoachingTopic[] = [
  // Reflection
  {
    slug: 'post-session-reflection',
    title: 'Post-Session Reflection',
    description: 'How to effectively reflect after training sessions. Capture what worked, what to improve, and what to try next time.',
    category: 'reflection',
    questions: [
      'What went well in today\'s session?',
      'What would I change if I ran this session again?',
      'Did every player get enough involvement?',
      'Was my session plan realistic for the time available?',
    ],
    relatedTopics: ['session-planning', 'player-feedback', 'coaching-philosophy'],
  },
  {
    slug: 'match-day-reflection',
    title: 'Match Day Reflection',
    description: 'Reflecting on match performance beyond just the result. Evaluate tactics, player development, and coaching decisions.',
    category: 'reflection',
    questions: [
      'Did the game plan work as expected?',
      'Which players showed development today?',
      'What tactical adjustments did I make and why?',
      'How did I manage the pressure of the match?',
    ],
    relatedTopics: ['tactical-review', 'player-development', 'managing-pressure'],
  },
  {
    slug: 'weekly-coaching-review',
    title: 'Weekly Coaching Review',
    description: 'A structured approach to reviewing your coaching week. Track patterns, energy levels, and progress toward goals.',
    category: 'reflection',
    questions: [
      'What was the highlight of my coaching week?',
      'What pattern am I noticing across sessions?',
      'Am I making progress on my development goals?',
      'What do I need to prioritise next week?',
    ],
    relatedTopics: ['goal-setting', 'coaching-habits', 'self-awareness'],
  },
  // Development
  {
    slug: 'player-development',
    title: 'Player Development Tracking',
    description: 'Track individual player progress over time. Identify strengths, areas for growth, and tailor your coaching approach.',
    category: 'development',
    questions: [
      'Which players have improved most this month?',
      'Are there players I\'m not giving enough attention to?',
      'What individual targets have I set for each player?',
      'How am I adapting my coaching for different ability levels?',
    ],
    relatedTopics: ['player-feedback', 'session-planning', 'differentiation'],
  },
  {
    slug: 'coaching-philosophy',
    title: 'Coaching Philosophy',
    description: 'Define and refine what you believe in as a coach. Your philosophy guides every decision you make on the training ground.',
    category: 'development',
    questions: [
      'What do I believe is most important in youth development?',
      'Does my coaching style match my stated philosophy?',
      'How has my philosophy evolved over time?',
      'What coaches or thinkers have influenced my approach?',
    ],
    relatedTopics: ['self-awareness', 'coaching-habits', 'post-session-reflection'],
  },
  {
    slug: 'session-planning',
    title: 'Session Planning and Review',
    description: 'Plan with intention, reflect with honesty. Compare what you planned against what actually happened.',
    category: 'planning',
    questions: [
      'Did my session achieve its objectives?',
      'Was the timing realistic?',
      'Did I adapt when something was not working?',
      'What would I keep, change, or remove next time?',
    ],
    relatedTopics: ['post-session-reflection', 'player-development', 'tactical-review'],
  },
  {
    slug: 'player-feedback',
    title: 'Giving and Receiving Feedback',
    description: 'Reflect on how you communicate with players. Effective feedback drives development and builds trust.',
    category: 'communication',
    questions: [
      'Am I giving specific enough feedback to players?',
      'Do I balance positive and constructive feedback?',
      'How do players respond to my communication style?',
      'Am I creating space for players to give me feedback?',
    ],
    relatedTopics: ['player-development', 'coaching-philosophy', 'managing-parents'],
  },
  {
    slug: 'managing-parents',
    title: 'Managing Parent Relationships',
    description: 'Navigate the complexities of parent communication in youth sport. Set boundaries while staying approachable.',
    category: 'communication',
    questions: [
      'How did I handle a difficult parent conversation this week?',
      'Am I communicating my coaching philosophy clearly to parents?',
      'Are parent expectations affecting my coaching decisions?',
      'What boundaries do I need to set or reinforce?',
    ],
    relatedTopics: ['player-feedback', 'coaching-philosophy', 'managing-pressure'],
  },
  {
    slug: 'tactical-review',
    title: 'Tactical Review and Analysis',
    description: 'Reflect on tactical decisions and formations. Did your approach suit the players and the opposition?',
    category: 'planning',
    questions: [
      'Was my formation effective for the players I had available?',
      'What tactical adjustments worked and which did not?',
      'Are players understanding their roles in the system?',
      'What tactical area should I focus on in training?',
    ],
    relatedTopics: ['match-day-reflection', 'session-planning', 'player-development'],
  },
  {
    slug: 'managing-pressure',
    title: 'Managing Coaching Pressure',
    description: 'Reflect on how you handle the emotional demands of coaching. Results pressure, time constraints, and expectations.',
    category: 'wellbeing',
    questions: [
      'How am I coping with the demands of coaching this season?',
      'Am I putting too much pressure on myself or my players?',
      'What do I do to decompress after a difficult session or match?',
      'Is coaching still bringing me enjoyment?',
    ],
    relatedTopics: ['coaching-burnout', 'self-awareness', 'coaching-philosophy'],
  },
  {
    slug: 'coaching-burnout',
    title: 'Preventing Coaching Burnout',
    description: 'Recognise the signs of burnout early. Sustainable coaching means looking after yourself as well as your players.',
    category: 'wellbeing',
    questions: [
      'Am I dreading sessions or looking forward to them?',
      'When did I last take a proper break from coaching?',
      'Am I trying to do too much on my own?',
      'What would make coaching feel more manageable right now?',
    ],
    relatedTopics: ['managing-pressure', 'coaching-habits', 'self-awareness'],
  },
  {
    slug: 'self-awareness',
    title: 'Self-Awareness in Coaching',
    description: 'Understanding your own strengths, weaknesses, and triggers. The most effective coaches know themselves first.',
    category: 'development',
    questions: [
      'What are my strongest coaching qualities?',
      'What situations trigger frustration or impatience?',
      'How do I respond when things go wrong in a session?',
      'What feedback have I received about my coaching style?',
    ],
    relatedTopics: ['coaching-philosophy', 'managing-pressure', 'coaching-burnout'],
  },
  {
    slug: 'goal-setting',
    title: 'Setting Coaching Goals',
    description: 'Set meaningful goals for your own development as a coach. Track progress and celebrate improvements.',
    category: 'development',
    questions: [
      'What is one thing I want to improve as a coach this season?',
      'How will I measure my progress?',
      'What CPD or learning am I planning?',
      'Am I setting goals for myself, not just my team?',
    ],
    relatedTopics: ['weekly-coaching-review', 'self-awareness', 'coaching-philosophy'],
  },
  {
    slug: 'coaching-habits',
    title: 'Building Coaching Habits',
    description: 'Small daily and weekly habits that compound into significant growth. Consistency beats intensity.',
    category: 'development',
    questions: [
      'Am I reflecting after every session, or only when things go wrong?',
      'What is my pre-session routine?',
      'Do I review my reflections regularly to spot patterns?',
      'What one habit would have the biggest impact on my coaching?',
    ],
    relatedTopics: ['weekly-coaching-review', 'goal-setting', 'post-session-reflection'],
  },
  {
    slug: 'differentiation',
    title: 'Differentiating Your Coaching',
    description: 'Adapting sessions for mixed ability groups. Every player deserves appropriate challenge and support.',
    category: 'planning',
    questions: [
      'Are my sessions challenging enough for the stronger players?',
      'Are weaker players getting enough support to succeed?',
      'How do I adapt exercises without splitting the group?',
      'Am I aware of each player\'s current level and needs?',
    ],
    relatedTopics: ['player-development', 'session-planning', 'player-feedback'],
  },
]

export function getTopicBySlug(slug: string): CoachingTopic | undefined {
  return COACHING_TOPICS.find(t => t.slug === slug)
}

export function getTopicsByCategory(category: CoachingTopic['category']): CoachingTopic[] {
  return COACHING_TOPICS.filter(t => t.category === category)
}

export function getAllTopicSlugs(): string[] {
  return COACHING_TOPICS.map(t => t.slug)
}
