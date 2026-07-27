import Link from "next/link"
import { GlassButton } from "@/components/ui/glass-button"

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <div className="w-[800px] h-[800px] bg-primary/30 rounded-full blur-[150px]" />
      </div>
      
      <div className="relative z-10 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Transform PDFs into <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            Interactive Courses
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          EduForge uses advanced AI to instantly convert any document into a structured, engaging e-learning experience with quizzes, chatbot assistance, and more.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <GlassButton className="w-full sm:w-auto text-lg px-10 py-6">
              Get Started Free
            </GlassButton>
          </Link>
          <Link href="/dashboard">
            <GlassButton variant="secondary" className="w-full sm:w-auto text-lg px-10 py-6">
              Go to Dashboard
            </GlassButton>
          </Link>
        </div>
      </div>
    </div>
  )
}
