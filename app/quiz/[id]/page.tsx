"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { ArrowLeft, CheckCircle2, XCircle, Trophy, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/apiClient"

type Question = {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

export default function QuizPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = params.id as string
  const chapterIndexStr = searchParams.get("chapter") || "0"
  const chapterIndex = parseInt(chapterIndexStr, 10)

  const [quizData, setQuizData] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const data = await apiClient.generateQuiz(courseId, chapterIndex)
        if (data.questions && data.questions.length > 0) {
          setQuizData(data.questions)
        } else {
          setError("AI returned an empty quiz.")
        }
      } catch (err: any) {
        setError(err.message || "Failed to generate quiz.")
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [courseId, chapterIndex])

  const handleSelect = (optionIndex: number) => {
    if (isSubmitted) return
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: optionIndex
    }))
  }

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      setIsSubmitted(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const score = Object.entries(selectedAnswers).reduce((acc, [qIndex, answerIndex]) => {
    const q = quizData[parseInt(qIndex)]
    const isCorrect = q.options[answerIndex] === q.correct_answer
    return acc + (isCorrect ? 1 : 0)
  }, 0)

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl text-white font-medium">Generating Quiz...</h2>
        <p className="text-muted-foreground mt-2">Our AI is crafting questions based on this chapter.</p>
      </div>
    )
  }

  if (error || quizData.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-400 max-w-md">{error || "Failed to load quiz."}</p>
        <Link href={`/course/${courseId}`}>
          <GlassButton>Return to Course</GlassButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/course/${courseId}`}>
          <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Chapter {chapterIndex + 1} Knowledge Check</h1>
          <p className="text-sm text-muted-foreground">Test your understanding of the core concepts</p>
        </div>
      </div>

      {!isSubmitted ? (
        <GlassCard className="p-6 md:p-10 flex-1 flex flex-col relative overflow-hidden">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
            <div 
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
            />
          </div>

          <div className="mb-8">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-2 block">
              Question {currentQuestion + 1} of {quizData.length}
            </span>
            <h2 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
              {quizData[currentQuestion].question}
            </h2>
          </div>

          <div className="space-y-3 mb-10 flex-1">
            {quizData[currentQuestion].options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === index
              
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${
                    isSelected 
                      ? "bg-primary/20 border-primary/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isSelected ? "border-primary shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "border-white/30"
                  }`}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                  </div>
                  <span className={`text-sm md:text-base ${isSelected ? "text-white font-medium" : "text-white/80"}`}>
                    {option}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-white/10 mt-auto">
            <GlassButton 
              variant="ghost" 
              onClick={handlePrevious} 
              disabled={currentQuestion === 0}
            >
              Previous
            </GlassButton>
            <GlassButton 
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
            >
              {currentQuestion === quizData.length - 1 ? "Submit Quiz" : "Next Question"}
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        <div className="flex flex-col items-center">
          <GlassCard className="w-full max-w-2xl p-8 text-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 pointer-events-none" />
            
            <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 text-primary shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              <Trophy className="h-12 w-12" />
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h2>
            <p className="text-muted-foreground mb-8">Here is how you performed on this knowledge check.</p>
            
            <div className="inline-flex items-end gap-2 mb-8">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {Math.round((score / quizData.length) * 100)}%
              </span>
              <span className="text-xl text-muted-foreground mb-1.5 font-medium">Score</span>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Link href={`/course/${params.id}`}>
                <GlassButton variant="secondary">Return to Course</GlassButton>
              </Link>
            </div>
          </GlassCard>

          <div className="w-full max-w-2xl space-y-6">
            <h3 className="text-xl font-bold text-white px-2">Review Answers</h3>
            {quizData.map((q, i) => {
              const userAnswerIndex = selectedAnswers[i]
              const userAnswer = q.options[userAnswerIndex]
              const isCorrect = userAnswer === q.correct_answer
              
              return (
                <GlassCard key={i} className={`p-4 sm:p-6 border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex items-start gap-3 mb-4">
                    {isCorrect ? (
                      <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="text-lg font-medium text-white">{q.question}</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pl-9 mb-4">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-100 text-sm">
                      <span className="font-semibold text-green-400 block mb-1">Correct Answer:</span>
                      {q.correct_answer}
                    </div>
                    
                    {!isCorrect && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-100 text-sm">
                        <span className="font-semibold text-red-400 block mb-1">Your Answer:</span>
                        {userAnswer}
                      </div>
                    )}
                  </div>
                  
                  <div className="pl-9 text-sm text-white/70">
                    <span className="font-semibold text-white/90">Explanation:</span> {q.explanation}
                  </div>
                </GlassCard>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
