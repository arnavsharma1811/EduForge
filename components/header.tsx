import Link from "next/link"
import { Search, User, Menu } from "lucide-react"
import { GlassInput } from "./ui/glass-input"
import { GlassButton } from "./ui/glass-button"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button className="md:hidden p-2 text-muted-foreground hover:text-white">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              <span className="font-bold text-white">EF</span>
            </div>
            <span className="hidden md:inline-block font-bold text-xl tracking-tight text-white">EduForge</span>
          </Link>
        </div>

        <div className="flex-1 md:flex-initial mx-4 md:mx-8 max-w-md w-full hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <GlassInput 
              placeholder="Search courses, lessons..." 
              className="pl-9 bg-white/5 border-transparent focus:border-primary/50 h-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <GlassButton variant="ghost" className="hidden sm:inline-flex px-4">
              Sign In
            </GlassButton>
          </Link>
          <Link href="/profile">
            <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
              <User className="h-4 w-4 text-white" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
