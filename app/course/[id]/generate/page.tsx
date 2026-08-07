"use client"

import { useEffect, useState, useRef } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Loader2, CheckCircle2, FileText, Brain, Layout, Sparkles, AlertCircle } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/apiClient"

const steps = [
  { id: "extract", label: "Extracting text and structure", icon: FileText },
  { id: "analyze", label: "Analyzing content with AI", icon: Brain },
  { id: "build", label: "Building course syllabus", icon: Layout },
  { id: "finalize", label: "Finalizing lessons and quizzes", icon: Sparkles },
]

export default function GenerateCoursePage() {
  const params = useParams()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const hasStarted = useRef(false)

  useEffect(() => {
    // Prevent double-firing in strict mode
    if (hasStarted.current) return
    hasStarted.current = true

    const generate = async () => {
      try {
        // Start animation timer to simulate steps while waiting for the long API call
        const interval = setInterval(() => {
          setCurrentStep((prev) => {
            // Stop at the last step until the API actually returns
            if (prev >= steps.length - 1) return prev
            return prev + 1
          })
        }, 15000) // 15 seconds per visual step to account for ~1-2min generation time

        const result = await apiClient.generateCourse(params.id as string)
        
        clearInterval(interval)
        setCurrentStep(steps.length) // All complete
        
        // Brief pause so user sees completion before redirect
        setTimeout(() => {
          router.push(`/course/${result.course_id}`)
        }, 1000)
        
      } catch (err: any) {
        setError(err.message || "Failed to generate course. The AI may have timed out or failed to parse the document.")
      }
    }

    if (params.id) {
      generate()
    }
  }, [params.id, router])

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-[-1]">
        <div className="w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="text-center mb-12">
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full" />
          <div className="h-24 w-24 relative bg-background/50 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center">
            {error ? (
              <AlertCircle className="h-10 w-10 text-red-500" />
            ) : (
              <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            )}
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {error ? "Generation Failed" : "Crafting Your Course"}
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {error ? error : "Our AI is analyzing your document and building a comprehensive learning experience."}
        </p>
      </div>

      {!error && (
        <div className="w-full max-w-md">
          <GlassCard className="p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <div 
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: `${(Math.min(currentStep, steps.length) / steps.length) * 100}%` }}
              />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-4 transition-all duration-300 ${
                    isActive ? "opacity-100 scale-105" : isCompleted ? "opacity-50" : "opacity-30"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isCompleted 
                      ? "bg-green-500/20 text-green-400" 
                      : isActive 
                        ? "bg-primary/20 text-primary border border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                        : "bg-white/5 text-muted-foreground border border-white/10"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : isActive ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-medium ${isActive ? "text-white" : "text-white/70"}`}>
                      {step.label}
                    </h3>
                    {isActive && <p className="text-xs text-primary animate-pulse mt-1">Processing (this can take a few minutes)...</p>}
                  </div>
                </div>
              )
            })}
          </GlassCard>
        </div>
      )}
    </div>
  )
}
