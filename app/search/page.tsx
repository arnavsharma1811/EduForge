"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { GlassChip } from "@/components/ui/glass-chip"
import { Search as SearchIcon, BookOpen, ChevronRight, FileText } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const MOCK_RESULTS = [
  { id: "1", type: "course", title: "Advanced Machine Learning Concepts", match: "Machine Learning" },
  { id: "2", type: "lesson", title: "Introduction to Neural Networks", course: "Advanced Machine Learning Concepts", match: "Neural Networks" },
  { id: "3", type: "chapter", title: "Understanding Backpropagation", course: "Advanced Machine Learning Concepts", match: "Backpropagation" }
]

export default function SearchPage() {
  const [query, setQuery] = useState("Machine Learning")

  return (
    <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-6">Search Library</h1>
        <div className="max-w-2xl mx-auto relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <GlassInput 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, chapters, lessons..." 
            className="pl-12 h-14 text-lg rounded-2xl bg-white/5 border-white/10 shadow-lg"
            autoFocus
          />
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-6">
          <span className="text-sm text-muted-foreground mr-2 py-1">Popular:</span>
          <GlassChip>Machine Learning</GlassChip>
          <GlassChip>React Patterns</GlassChip>
          <GlassChip>System Design</GlassChip>
          <GlassChip>Neuroscience</GlassChip>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-white mb-4">Search Results for "{query}"</h2>
        
        {MOCK_RESULTS.map((result) => (
          <Link key={result.id} href={`/course/${result.id}`}>
            <GlassCard className="p-4 flex items-center gap-4 hover:border-primary/50 group transition-all mb-4">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                result.type === 'course' ? 'bg-primary/20 text-primary' : 
                result.type === 'chapter' ? 'bg-secondary/20 text-secondary' : 
                'bg-white/10 text-white/70'
              }`}>
                {result.type === 'course' ? <BookOpen className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${
                    result.type === 'course' ? 'text-primary' : 
                    result.type === 'chapter' ? 'text-secondary' : 
                    'text-muted-foreground'
                  }`}>
                    {result.type}
                  </span>
                  {result.course && (
                    <>
                      <span className="text-muted-foreground text-xs">•</span>
                      <span className="text-xs text-muted-foreground truncate">{result.course}</span>
                    </>
                  )}
                </div>
                <h3 className="text-lg font-medium text-white truncate group-hover:text-primary-light transition-colors">
                  {result.title}
                </h3>
              </div>
              
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </GlassCard>
          </Link>
        ))}

        {MOCK_RESULTS.length === 0 && (
          <div className="text-center py-20">
            <SearchIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  )
}
