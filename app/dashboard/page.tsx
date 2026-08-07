"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassChip } from "@/components/ui/glass-chip"
import { BookOpen, Clock, Trophy, Flame, Upload, PlayCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/apiClient"
import { supabase } from "@/lib/supabase"

export default function DashboardPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Stats
  const [totalCourses, setTotalCourses] = useState(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
        }

        const data = await apiClient.searchCourses("")
        setCourses(data.results || [])
        setTotalCourses(data.count || 0)
      } catch (err) {
        console.error("Failed to load dashboard data", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {user?.email?.split('@')[0] || 'Student'}
          </h1>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </div>
        <Link href="/upload">
          <GlassButton className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload PDF
          </GlassButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Courses</p>
            <p className="text-2xl font-bold text-white">{totalCourses}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5 opacity-50">
          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hours Learned</p>
            <p className="text-2xl font-bold text-white">--</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5 opacity-50">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
            <p className="text-2xl font-bold text-white">--%</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5 opacity-50">
          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-white">- Days</p>
          </div>
        </GlassCard>
      </div>

      <h2 className="text-xl font-bold text-white mb-6">Recent Courses</h2>
      
      {courses.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5">
          <p className="text-muted-foreground mb-4">You haven't generated any courses yet.</p>
          <Link href="/upload">
            <GlassButton>Create Your First Course</GlassButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <GlassCard key={course.id} className="flex flex-col h-full group hover:border-primary/50 transition-colors">
              <div className="h-40 rounded-xl bg-white/5 mb-4 relative overflow-hidden flex items-center justify-center border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
                <BookOpen className="h-12 w-12 text-white/20" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <GlassChip active={course.status === 'ready'}>
                    {course.status === 'ready' ? 'Ready' : course.status}
                  </GlassChip>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                <div className="mt-auto pt-4 space-y-4">
                  <Link href={`/course/${course.id}`}>
                    <GlassButton variant="secondary" className="w-full flex justify-center items-center gap-2">
                      <PlayCircle className="h-4 w-4" />
                      Continue
                    </GlassButton>
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
