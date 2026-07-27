import { GlassCard } from "@/components/ui/glass-card"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassChip } from "@/components/ui/glass-chip"
import { BookOpen, Clock, Trophy, Flame, Upload, PlayCircle } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Welcome back, Alex</h1>
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
            <p className="text-2xl font-bold text-white">12</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hours Learned</p>
            <p className="text-2xl font-bold text-white">34.5</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Quiz Score</p>
            <p className="text-2xl font-bold text-white">92%</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-white">7 Days</p>
          </div>
        </GlassCard>
      </div>

      <h2 className="text-xl font-bold text-white mb-6">Recent Courses</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((course) => (
          <GlassCard key={course} className="flex flex-col h-full group hover:border-primary/50 transition-colors">
            <div className="h-40 rounded-xl bg-white/5 mb-4 relative overflow-hidden flex items-center justify-center border border-white/5">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
              <BookOpen className="h-12 w-12 text-white/20" />
              <div className="absolute top-3 right-3 flex gap-2">
                <GlassChip active>Active</GlassChip>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                {course === 1 ? "Advanced Machine Learning Concepts" : 
                 course === 2 ? "Introduction to Neuroscience" : 
                 "System Design Interview Preparation"}
              </h3>
              
              <div className="mt-auto pt-4 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-white font-medium">{course === 1 ? "65%" : course === 2 ? "12%" : "100%"}</span>
                  </div>
                  <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" 
                      style={{ width: course === 1 ? "65%" : course === 2 ? "12%" : "100%" }}
                    />
                  </div>
                </div>
                
                <Link href={`/course/${course}`}>
                  <GlassButton variant="secondary" className="w-full flex justify-center items-center gap-2">
                    <PlayCircle className="h-4 w-4" />
                    {course === 3 ? "Review Course" : "Continue"}
                  </GlassButton>
                </Link>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
