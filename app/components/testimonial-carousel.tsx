'use client'

import { useState, useEffect } from 'react'

interface Testimonial {
  id: string
  name: string
  location: string
  quote: string
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Stephen Kavanagh',
    location: 'FCA Member',
    quote: "I've been reflecting a lot more since joining this community and I've definitely made positive changes to my coaching.",
    avatar: 'SK',
  },
  {
    id: '2',
    name: 'FCA Coach',
    location: 'Football Coaching Academy',
    quote: 'It is probably the best resource I have found in developing my coaching knowledge. The community is my home.',
    avatar: 'FC',
  },
  {
    id: '3',
    name: 'Stephen Kavanagh',
    location: 'FCA Member',
    quote: "I've been focussing on better detail in my coaching which I've improved. Now it is giving specific feedback to players.",
    avatar: 'SK',
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
