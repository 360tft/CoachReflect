import fs from "fs"
import path from "path"

function getTestimonialImages(): string[] {
  const dir = path.join(process.cwd(), "public", "testimonials")
  try {
    const files = fs.readdirSync(dir)
    return files
      .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => {
        // Sort by modification time, newest first
        const aStat = fs.statSync(path.join(dir, a))
        const bStat = fs.statSync(path.join(dir, b))
        return bStat.mtimeMs - aStat.mtimeMs
      })
      .map((f) => `/testimonials/${f}`)
  } catch {
    return []
  }
}

export function WallOfWins() {
  const images = getTestimonialImages()

  if (images.length === 0) return null

  return (
    <section className="container mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-center mb-4">
        Coaches Are Talking
      </h2>
      <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
        Real feedback from real coaches, straight after their sessions.
      </p>
      <div
        className={`max-w-5xl mx-auto ${
          images.length === 1
            ? "flex justify-center"
            : images.length === 2
              ? "grid grid-cols-1 md:grid-cols-2 gap-6"
              : "columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6"
        }`}
      >
        {images.map((src) => (
          <div
            key={src}
            className={`break-inside-avoid ${images.length === 1 ? "max-w-lg" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Coach testimonial"
              className="w-full rounded-xl shadow-md hover:shadow-lg transition-shadow"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
