'use client'

const AI_PLATFORMS = [
  { name: 'ChatGPT', baseUrl: 'https://chatgpt.com/?q=' },
  { name: 'Claude', baseUrl: 'https://claude.ai/new?q=' },
  { name: 'Perplexity', baseUrl: 'https://www.perplexity.ai/?q=' },
]

interface AskAIProps {
  question: string  // e.g., "What is CoachReflect?"
  prompt: string    // The full prompt to send to AI
  className?: string
}

export function AskAI({ question, prompt, className = '' }: AskAIProps) {
  const encodedPrompt = encodeURIComponent(prompt)

  return (
    <p className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      &ldquo;{question}&rdquo; — Ask{' '}
      {AI_PLATFORMS.map((platform, i) => (
        <span key={platform.name}>
          <a
            href={`${platform.baseUrl}${encodedPrompt}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 dark:text-gray-300 hover:text-brand underline underline-offset-2"
          >
            {platform.name}
          </a>
          {i < AI_PLATFORMS.length - 1 && ' · '}
        </span>
      ))}
    </p>
  )
}
