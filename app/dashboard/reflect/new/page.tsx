"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { ImageUpload } from "@/app/components/ui/image-upload"
import {
  SESSION_TYPES,
  GUIDED_PROMPTS,
  MOOD_OPTIONS,
  ENERGY_OPTIONS,
  type SessionPlanAnalysis,
  type SessionType,
} from "@/app/types"

type Step = "upload" | "session" | "reflection" | "ratings"

export default function NewReflectionPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Session plan state
  const [sessionPlanImage, setSessionPlanImage] = useState<File | null>(null)
  const [sessionPlanAnalysis, setSessionPlanAnalysis] = useState<SessionPlanAnalysis | null>(null)

  // Session details state
  const [sessionTitle, setSessionTitle] = useState("")
  const [sessionType, setSessionType] = useState<SessionType>("training")
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0])
  const [duration, setDuration] = useState<number | "">("")
  const [playersPresent, setPlayersPresent] = useState<number | "">("")

  // Reflection state
  const [whatWorked, setWhatWorked] = useState("")
  const [whatDidntWork, setWhatDidntWork] = useState("")
  const [playerStandouts, setPlayerStandouts] = useState("")
  const [areasToImprove, setAreasToImprove] = useState("")
  const [nextFocus, setNextFocus] = useState("")

  // Ratings state
  const [moodRating, setMoodRating] = useState<number | null>(null)
  const [energyRating, setEnergyRating] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const handleImageSelect = async (file: File) => {
    setSessionPlanImage(file)
    setError(null)
    setAnalyzing(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Analyze with Claude Vision
      const response = await fetch("/api/analyze-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 403) {
          setError("Session plan analysis requires a Pro subscription")
        } else {
          setError(data.error || "Failed to analyze session plan")
        }
        setAnalyzing(false)
        return
      }

      const analysis: SessionPlanAnalysis = await response.json()
      setSessionPlanAnalysis(analysis)

      // Pre-fill form with extracted data
      if (analysis.title) setSessionTitle(analysis.title)
      if (analysis.total_duration_minutes) setDuration(analysis.total_duration_minutes)
      if (analysis.objectives.length > 0) {
        setNextFocus(analysis.objectives.join(". "))
      }
    } catch {
      setError("Failed to analyze session plan")
    } finally {
      setAnalyzing(false)
    }
  }

  const handleImageRemove = () => {
    setSessionPlanImage(null)
    setSessionPlanAnalysis(null)
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // First create the session
      const sessionResponse = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionTitle || "Untitled Session",
          session_type: sessionType,
          date: sessionDate,
          duration_minutes: duration || null,
          players_present: playersPresent || null,
        }),
      })

      if (!sessionResponse.ok) {
        const data = await sessionResponse.json()
        throw new Error(data.error || "Failed to create session")
      }

      const session = await sessionResponse.json()

      // Then create the reflection
      const reflectionResponse = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          date: sessionDate,
          what_worked: whatWorked,
          what_didnt_work: whatDidntWork,
          player_standouts: playerStandouts,
          areas_to_improve: areasToImprove,
          next_focus: nextFocus,
          mood_rating: moodRating,
          energy_rating: energyRating,
          tags,
        }),
      })

      if (!reflectionResponse.ok) {
        const data = await reflectionResponse.json()
        throw new Error(data.error || "Failed to create reflection")
      }

      const reflection = await reflectionResponse.json()

      // Redirect to the reflection view
      router.push(`/dashboard/reflect/${reflection.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case "upload":
        return (
          <Card className="border dark:border">
            <CardHeader className="text-center">
              
              <CardTitle>Upload Your Session Plan</CardTitle>
              <CardDescription className="text-base">
                Snap a photo of your handwritten or digital session plan.
                Our AI will read it and pre-fill your reflection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Value proposition */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                <div>
                  
                  Reads handwriting
                </div>
                <div>
                  
                  Saves time
                </div>
                <div>
                  
                  Better reflections
                </div>
              </div>

              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                selectedImage={sessionPlanImage}
                disabled={analyzing}
              />

              {analyzing && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Reading your session plan...</p>
                </div>
              )}

              {sessionPlanAnalysis && (
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Plan Extracted Successfully
                  </p>
                  <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {sessionPlanAnalysis.title && <p><strong>Title:</strong> {sessionPlanAnalysis.title}</p>}
                    {sessionPlanAnalysis.objectives.length > 0 && (
                      <p><strong>Objectives:</strong> {sessionPlanAnalysis.objectives.join(", ")}</p>
                    )}
                    {sessionPlanAnalysis.drills.length > 0 && (
                      <p><strong>Drills:</strong> {sessionPlanAnalysis.drills.length} detected</p>
                    )}
                    {sessionPlanAnalysis.total_duration_minutes && (
                      <p><strong>Duration:</strong> {sessionPlanAnalysis.total_duration_minutes} minutes</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setStep("session")}
                  disabled={analyzing}
                  className="flex-1"
                >
                  {sessionPlanAnalysis ? "Continue with Plan" : "Continue"}
                </Button>
              </div>
              <button
                onClick={() => setStep("session")}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now →
              </button>
            </CardContent>
          </Card>
        )

      case "session":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Tell us about your coaching session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Session Title</label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g., U14 Tuesday Training"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Session Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SESSION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSessionType(type.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        sessionType === type.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : "")}
                    className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="90"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Players Present</label>
                <input
                  type="number"
                  value={playersPresent}
                  onChange={(e) => setPlayersPresent(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="16"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("upload")} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep("reflection")} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "reflection":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Reflection</CardTitle>
              <CardDescription>Capture your thoughts about the session</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {GUIDED_PROMPTS.map((prompt) => {
                const value =
                  prompt.id === "what_worked" ? whatWorked :
                  prompt.id === "what_didnt_work" ? whatDidntWork :
                  prompt.id === "player_standouts" ? playerStandouts :
                  prompt.id === "areas_to_improve" ? areasToImprove :
                  nextFocus

                const setValue =
                  prompt.id === "what_worked" ? setWhatWorked :
                  prompt.id === "what_didnt_work" ? setWhatDidntWork :
                  prompt.id === "player_standouts" ? setPlayerStandouts :
                  prompt.id === "areas_to_improve" ? setAreasToImprove :
                  setNextFocus

                return (
                  <div key={prompt.id}>
                    <label className="block text-sm font-medium mb-2">
                      {prompt.question}
                    </label>
                    <textarea
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                      placeholder={prompt.placeholder}
                    />
                    {prompt.tip && (
                      <p className="text-xs text-muted-foreground mt-1">{prompt.tip}</p>
                    )}
                  </div>
                )
              })}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("session")} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep("ratings")} className="flex-1">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case "ratings":
        return (
          <Card>
            <CardHeader>
              <CardTitle>How Did It Feel?</CardTitle>
              <CardDescription>Rate your session and add tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Your Mood</label>
                <div className="flex justify-between gap-2">
                  {MOOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMoodRating(option.value)}
                      className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                        moodRating === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      
                      <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Your Energy</label>
                <div className="flex justify-between gap-2">
                  {ENERGY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setEnergyRating(option.value)}
                      className={`flex-1 p-3 rounded-lg border text-center transition-colors ${
                        energyRating === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      
                      <span className="text-xs text-muted-foreground">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Add a tag..."
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-primary"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("reflection")} className="flex-1">
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={loading} className="flex-1">
                  {loading ? "Saving..." : "Save Reflection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Step {["upload", "session", "reflection", "ratings"].indexOf(step) + 1} of 4</span>
          <Link href="/dashboard" className="hover:text-foreground">Cancel</Link>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{
              width: `${(["upload", "session", "reflection", "ratings"].indexOf(step) + 1) * 25}%`,
            }}
          />
        </div>
      </div>

      {error && step === "upload" && (
        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {renderStep()}
    </div>
  )
}
