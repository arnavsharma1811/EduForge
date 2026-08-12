"use client"

import Link from "next/link"
import { Search, User, Menu, LogOut, Home, Upload, Search as SearchIcon, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassInput } from "./ui/glass-input"
import { GlassButton } from "./ui/glass-button"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export function Header() {
  const [session, setSession] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
 
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    
    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button 
            className="md:hidden p-2 text-muted-foreground hover:text-white"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}`)
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link href="/dashboard">
                <GlassButton variant="ghost" className="hidden sm:inline-flex px-4">
                  Dashboard
                </GlassButton>
              </Link>
              <div 
                onClick={handleLogout}
                className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer group"
                title="Sign out"
              >
                <LogOut className="h-4 w-4 text-white group-hover:text-red-400 transition-colors" />
              </div>
            </>
          ) : (
            <Link href="/login">
              <GlassButton variant="ghost" className="hidden sm:inline-flex px-4">
                Sign In
              </GlassButton>
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 h-full w-72 bg-background/95 backdrop-blur-xl border-r border-white/10 z-50 md:hidden flex flex-col"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <Link href={session ? "/dashboard" : "/"} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <span className="font-bold text-white">EF</span>
                  </div>
                  <span className="font-bold text-xl tracking-tight text-white">EduForge</span>
                </Link>
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 border-b border-white/10">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <GlassInput 
                    placeholder="Search courses..." 
                    className="pl-9 bg-white/5 border-transparent focus:border-primary/50 h-10 w-full"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setMobileMenuOpen(false)
                        router.push(`/search?q=${encodeURIComponent(e.currentTarget.value)}`)
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {[
                  { label: "Dashboard", href: "/dashboard", icon: Home },
                  { label: "Upload", href: "/upload", icon: Upload },
                  { label: "Search", href: "/search", icon: SearchIcon },
                  { label: "Profile", href: "/profile", icon: User }
                ].map((item) => (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              <div className="p-4 border-t border-white/10">
                {session ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {session.user?.email || "User"}
                        </p>
                      </div>
                    </div>
                    <GlassButton 
                      className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10" 
                      variant="ghost"
                      onClick={() => {
                        setMobileMenuOpen(false)
                        handleLogout()
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </GlassButton>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <GlassButton className="w-full">Sign In</GlassButton>
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
