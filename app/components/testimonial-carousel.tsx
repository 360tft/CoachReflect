'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  name: string
  location: string
  quote: string
  avatar: string
}

// Placeholder testimonials (to be replaced with real ones)
const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'James Wilson',
    location: 'Manchester United Academy',
    quote: 'Coach Reflection has transformed how I think about my sessions. I can see patterns in my coaching I never noticed before.',
    avatar: 'JW',
  },
  {
    id: '2',
    name: 'Sophie Martinez',
    location: 'Grassroots Coach, London',
    quote: 'Finally, a tool that helps me process what happens on the pitch. The AI asks better questions than my coaching mentor!',
    avatar: 'SM',
  },
  {
    id: '3',
    name: 'David Thompson',
    location: 'Academy Coach, Birmingham',
    quote: 'The reflection prompts help me improve every week. I feel more confident in my coaching decisions now.',
    avatar: 'DT',
  },
  {
    id: '4',
    name: 'Maria Rodriguez',
    location: 'Youth Coach, Madrid',
    quote: 'This is what I needed. A place to think through sessions without judgment. My coaching has leveled up.',
    avatar: 'MR',
  },
]

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const currentTestimonial = testimonials[currentIndex]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-card border-border rounded-xl p-8 border">
        {/* Quote */}
        <div className="mb-6">
          <svg className="w-8 h-8 text-primary mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-lg text-foreground leading-relaxed">
            {currentTestimonial.quote}
          </p>
        </div>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
            {currentTestimonial.avatar}
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {currentTestimonial.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentTestimonial.location}
            </p>
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-primary w-8'
                : 'bg-muted w-2 hover:bg-muted-foreground'
            }`}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
