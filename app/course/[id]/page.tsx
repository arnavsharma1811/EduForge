"use client"

import { useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { Menu, ChevronLeft, ChevronRight, CheckCircle, MessageSquare, PlayCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

export default function CourseViewerPage() {
  const params = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
            <h2 className="font-bold text-white">Course Outline</h2>
            <button 
              className="md:hidden text-muted-foreground hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module 1</span>
              </div>
              <div className="space-y-1">
                {[1, 2, 3].map((lesson) => (
                  <button 
                    key={lesson}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                      lesson === 1 
                        ? "bg-primary/20 border border-primary/30 text-primary-foreground shadow-[0_0_10px_rgba(99,102,241,0.1)]" 
                        : "hover:bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <div className="mt-0.5">
                      {lesson === 1 ? (
                        <PlayCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${lesson === 1 ? "text-white" : ""}`}>
                        {lesson === 1 ? "Introduction to the Topic" : lesson === 2 ? "Core Concepts Explained" : "Real-world Applications"}
                      </p>
                      <p className="text-xs text-white/50 mt-1">10 min read</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module 2</span>
              </div>
              <div className="space-y-1">
                {[4, 5].map((lesson) => (
                  <button 
                    key={lesson}
                    className="w-full flex items-start gap-3 p-3 rounded-xl text-left hover:bg-white/5 text-muted-foreground transition-colors"
                  >
                    <div className="mt-0.5">
                      <div className="h-4 w-4 rounded-full border border-white/20" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Advanced Topic {lesson - 3}</p>
                      <p className="text-xs text-white/50 mt-1">15 min read</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
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
            <h2 className="text-sm font-medium text-white/80 truncate">Introduction to the Topic</h2>
            
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Course Progress:</span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-1/4 rounded-full" />
              </div>
              <span>25%</span>
            </div>
          </div>
        </div>

        {/* Lesson Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 relative">
          <div className="max-w-3xl mx-auto pb-24">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">Introduction to the Topic</h1>
            
            <GlassCard className="p-6 md:p-8 mb-8 prose prose-invert max-w-none">
              <p className="text-lg text-white/90 leading-relaxed mb-6">
                Welcome to the first lesson! In this section, we'll cover the fundamental principles that form the foundation of our course material. Understanding these basics is crucial for mastering the advanced topics later on.
              </p>
              
              <h3 className="text-xl font-semibold text-white mt-8 mb-4">Core Principles</h3>
              <ul className="space-y-2 text-white/80 mb-6 list-disc pl-5">
                <li>Principle 1: The foundation of modern architecture</li>
                <li>Principle 2: Designing for scalability and performance</li>
                <li>Principle 3: Maintainability in large codebases</li>
              </ul>

              <div className="my-8 p-6 rounded-xl bg-white/5 border-l-4 border-primary">
                <p className="text-white/90 italic m-0">
                  "The most important part of any system is the foundation. Without a solid understanding of the basics, advanced techniques will inevitably fail under pressure."
                </p>
              </div>

              <h3 className="text-xl font-semibold text-white mt-8 mb-4">Key Takeaways</h3>
              <p className="text-white/80 mb-4">
                Before moving on to the next section, make sure you understand the relationship between these three principles. They are not isolated concepts, but rather an interconnected framework.
              </p>
            </GlassCard>

            {/* Navigation / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <GlassButton variant="ghost" className="w-full sm:w-auto invisible">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </GlassButton>
              
              <div className="flex gap-4 w-full sm:w-auto">
                <Link href={`/quiz/${params.id}`} className="w-full sm:w-auto">
                  <GlassButton variant="secondary" className="w-full sm:w-auto">
                    Take Quiz
                  </GlassButton>
                </Link>
                <GlassButton className="w-full sm:w-auto flex-1">
                  Complete & Continue <ChevronRight className="ml-2 h-4 w-4" />
                </GlassButton>
              </div>
            </div>
          </div>
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
