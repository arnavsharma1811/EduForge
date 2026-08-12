"use client"

import { Suspense } from "react"  // <-- ADD THIS
import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { GlassButton } from "@/components/ui/glass-button"
import { Search as SearchIcon, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/apiClient"

// Move all the existing logic into this inner component
function SearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return
    setLoading(true)
    setHasSearched(true)
    try {
      const data = await apiClient.searchCourses(searchQuery)
      setResults(data.results || [])
    } catch (err) {
      console.error("Search failed", err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Search Courses</h1>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative flex items-center">
          <SearchIcon className="absolute left-4 text-muted-foreground h-5 w-5" />
          <GlassInput 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to learn today?" 
            className="pl-12 pr-32 h-14 text-lg rounded-full"
          />
          <GlassButton 
            type="submit" 
            className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-6"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </GlassButton>
        </form>
      </div>

      {hasSearched && !loading && (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-medium text-white">
            {results.length} results for "{query}"
          </h2>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result) => (
            <Link key={result.id} href={result.url}>
              <GlassCard className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:bg-white/5 hover:border-primary/30 transition-all group">
                <div className="h-24 w-full sm:w-32 shrink-0 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <BookOpen className="h-8 w-8 text-white/40 group-hover:text-primary transition-colors relative z-10" />
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-xl font-bold text-white group-hover:text-primary-light transition-colors line-clamp-2">
                      {result.title}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-auto">
                    <span className="text-sm text-muted-foreground bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      {result.status && typeof result.status === 'string' ? result.status : 'Course'}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      ) : hasSearched && !loading ? (
        <div className="text-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
          <SearchIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No results found</h3>
          <p className="text-muted-foreground">Try adjusting your search terms or browse all categories.</p>
        </div>
      ) : null}
    </div>
  )
}

// The default export now wraps the inner component with Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SearchContent />
    </Suspense>
  )
}