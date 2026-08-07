"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { Menu, ChevronLeft, ChevronRight, CheckCircle, MessageSquare, PlayCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/apiClient"

export default function CourseViewerPage() {
  const params = useParams()
  const courseId = params.id as string
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const [course, setCourse] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Navigation state
  const [activeChapterIdx, setActiveChapterIdx] = useState(0)
  const [activeTopicIdx, setActiveTopicIdx] = useState(0)
  const [activeLessonIdx, setActiveLessonIdx] = useState(0)
  
  // Extract the active lesson object safely
  const activeChapter = course?.course_structure?.chapters?.[activeChapterIdx]
  const activeTopic = activeChapter?.topics?.[activeTopicIdx]
  const activeLesson = activeTopic?.lessons?.[activeLessonIdx]
  const totalChapters = course?.course_structure?.chapters?.length || 0

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseData, progressData] = await Promise.all([
          apiClient.getCourse(courseId),
          apiClient.getProgress(courseId)
        ])
        setCourse(courseData)
        setProgress(progressData)
      } catch (err: any) {
        setError(err.message || "Failed to load course data.")
      } finally {
        setLoading(false)
      }
    }
    if (courseId) {
      fetchData()
    }
  }, [courseId])

  const handleMarkComplete = async () => {
    if (!activeLesson) return
    const lessonId = `lesson_${activeChapterIdx}_${activeTopicIdx}_${activeLessonIdx}`
    try {
      await apiClient.markLessonComplete(courseId, lessonId)
      // Refresh progress
      const p = await apiClient.getProgress(courseId)
      setProgress(p)
      
      // Auto-advance to next lesson if possible
      handleNext()
    } catch (err: any) {
      console.error("Failed to mark complete", err)
    }
  }

  const handleNext = () => {
    if (!activeTopic) return
    if (activeLessonIdx < (activeTopic.lessons?.length || 0) - 1) {
      setActiveLessonIdx(prev => prev + 1)
    } else if (activeTopicIdx < (activeChapter?.topics?.length || 0) - 1) {
      setActiveTopicIdx(prev => prev + 1)
      setActiveLessonIdx(0)
    } else if (activeChapterIdx < totalChapters - 1) {
      setActiveChapterIdx(prev => prev + 1)
      setActiveTopicIdx(0)
      setActiveLessonIdx(0)
    }
  }

  const handlePrev = () => {
    if (activeLessonIdx > 0) {
      setActiveLessonIdx(prev => prev - 1)
    } else if (activeTopicIdx > 0) {
      const prevTopic = activeChapter?.topics?.[activeTopicIdx - 1]
      setActiveTopicIdx(prev => prev - 1)
      setActiveLessonIdx((prevTopic?.lessons?.length || 1) - 1)
    } else if (activeChapterIdx > 0) {
      const prevChapter = course?.course_structure?.chapters?.[activeChapterIdx - 1]
      const lastTopicIdx = (prevChapter?.topics?.length || 1) - 1
      const prevTopic = prevChapter?.topics?.[lastTopicIdx]
      setActiveChapterIdx(prev => prev - 1)
      setActiveTopicIdx(lastTopicIdx)
      setActiveLessonIdx((prevTopic?.lessons?.length || 1) - 1)
    }
  }

  const isLessonCompleted = (cIdx: number, tIdx: number, lIdx: number) => {
    if (!progress?.progress) return false
    const lId = `lesson_${cIdx}_${tIdx}_${lIdx}`
    return progress.progress.some((p: any) => p.lesson_id === lId && p.completed)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-red-400">{error || "Course not found"}</p>
        <Link href="/dashboard"><GlassButton>Back to Dashboard</GlassButton></Link>
      </div>
    )
  }

  const chapters = course.course_structure?.chapters || []

  return (
    <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] relative">
      {/* Sidebar / TOC */}
      <div 
        className={`absolute md:relative z-20 h-full transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full md:w-0 md:-translate-x-0 overflow-hidden"
        }`}
      >
        <div className="h-full w-80 bg-background/80 backdrop-blur-xl border-r border-white/10 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white truncate max-w-[200px]" title={course.title}>{course.title}</h2>
            <button 
              className="md:hidden text-muted-foreground hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {chapters.map((chapter: any, cIdx: number) => (
              <div key={cIdx}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chapter {cIdx + 1}: {chapter.title}</span>
                </div>
                
                {chapter.topics?.map((topic: any, tIdx: number) => (
                  <div key={tIdx} className="mb-4">
                    <div className="text-xs text-white/70 mb-1 pl-2">{topic.title}</div>
                    <div className="space-y-1">
                      {topic.lessons?.map((lesson: any, lIdx: number) => {
                        const isActive = cIdx === activeChapterIdx && tIdx === activeTopicIdx && lIdx === activeLessonIdx
                        const isCompleted = isLessonCompleted(cIdx, tIdx, lIdx)
                        return (
                          <button 
                            key={lIdx}
                            onClick={() => {
                              setActiveChapterIdx(cIdx)
                              setActiveTopicIdx(tIdx)
                              setActiveLessonIdx(lIdx)
                              if (window.innerWidth < 768) setSidebarOpen(false)
                            }}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                              isActive 
                                ? "bg-primary/20 border border-primary/30 text-primary-foreground shadow-[0_0_10px_rgba(99,102,241,0.1)]" 
                                : "hover:bg-white/5 text-muted-foreground"
                            }`}
                          >
                            <div className="mt-0.5">
                              {isActive ? (
                                <PlayCircle className="h-4 w-4 text-primary" />
                              ) : isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border border-white/20" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>
                                {lesson.title}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Course Header */}
        <div className="h-14 border-b border-white/10 flex items-center px-4 bg-background/50 backdrop-blur-md z-10 gap-4 shrink-0">
          <button 
            className="p-2 -ml-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1 flex items-center justify-between">
            <h2 className="text-sm font-medium text-white/80 truncate">
              {activeLesson?.title || "Course Viewer"}
            </h2>
            
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Course Progress:</span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${progress?.completion_percentage || 0}%` }}
                />
              </div>
              <span>{progress?.completion_percentage || 0}%</span>
            </div>
          </div>
        </div>

        {/* Lesson Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative">
          {activeLesson ? (
            <div className="max-w-3xl mx-auto pb-24">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{activeLesson.title}</h1>
              <p className="text-muted-foreground mb-6">Chapter {activeChapterIdx + 1}: {activeChapter?.title}</p>
              
              <GlassCard className="p-6 md:p-8 mb-8 prose prose-invert max-w-none">
                <div className="text-lg text-white/90 leading-relaxed mb-6 whitespace-pre-wrap">
                  {activeLesson.explanation}
                </div>
                
                {activeLesson.examples && activeLesson.examples.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">Examples</h3>
                    <ul className="space-y-2 text-white/80 mb-6 list-disc pl-5">
                      {activeLesson.examples.map((ex: string, i: number) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </>
                )}

                {activeLesson.key_takeaways && activeLesson.key_takeaways.length > 0 && (
                  <>
                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">Key Takeaways</h3>
                    <div className="my-8 p-6 rounded-xl bg-white/5 border-l-4 border-primary">
                      <ul className="space-y-2 text-white/90 list-disc pl-4 m-0">
                        {activeLesson.key_takeaways.map((kt: string, i: number) => (
                          <li key={i}>{kt}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                
                {activeLesson.summary && (
                  <>
                    <h3 className="text-xl font-semibold text-white mt-8 mb-4">Summary</h3>
                    <p className="text-white/80 mb-4 whitespace-pre-wrap">{activeLesson.summary}</p>
                  </>
                )}
              </GlassCard>

              {/* Navigation / Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                <GlassButton 
                  variant="ghost" 
                  className="w-full sm:w-auto"
                  onClick={handlePrev}
                  disabled={activeChapterIdx === 0 && activeTopicIdx === 0 && activeLessonIdx === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </GlassButton>
                
                <div className="flex gap-4 w-full sm:w-auto">
                  <Link href={`/quiz/${params.id}?chapter=${activeChapterIdx}`} className="w-full sm:w-auto">
                    <GlassButton variant="secondary" className="w-full sm:w-auto">
                      Chapter Quiz
                    </GlassButton>
                  </Link>
                  <GlassButton className="w-full sm:w-auto flex-1" onClick={handleMarkComplete}>
                    Complete & Continue <ChevronRight className="ml-2 h-4 w-4" />
                  </GlassButton>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No lesson selected or course structure is empty.
            </div>
          )}
        </div>

        {/* Floating Chat Button */}
        <div className="absolute bottom-6 right-6 z-30">
          <Link href={`/course/${params.id}/chat`}>
            <button className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-all">
              <MessageSquare className="h-6 w-6" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
