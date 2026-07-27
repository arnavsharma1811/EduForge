"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { GlassButton } from "@/components/ui/glass-button"
import { User, Mail, Shield, BookOpen, Clock, Settings, LogOut } from "lucide-react"

export default function ProfilePage() {
  return (
    <div className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard className="p-6 text-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]">
              AS
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Alex Smith</h2>
            <p className="text-muted-foreground text-sm mb-6">alex.smith@example.com</p>
            
            <GlassButton variant="secondary" className="w-full mb-2">
              Edit Profile
            </GlassButton>
          </GlassCard>

          <GlassCard className="p-4 space-y-2">
            <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/20 text-primary font-medium">
              <User className="h-5 w-5" /> Account Details
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors">
              <Settings className="h-5 w-5" /> Preferences
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors mt-4">
              <LogOut className="h-5 w-5" /> Sign Out
            </button>
          </GlassCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Personal Information
            </h3>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">First Name</label>
                  <GlassInput defaultValue="Alex" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Last Name</label>
                  <GlassInput defaultValue="Smith" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email Address
                </label>
                <GlassInput type="email" defaultValue="alex.smith@example.com" disabled className="opacity-70" />
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <GlassButton>Save Changes</GlassButton>
              </div>
            </form>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Security
            </h3>
            
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Current Password</label>
                <GlassInput type="password" placeholder="••••••••" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">New Password</label>
                  <GlassInput type="password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Confirm Password</label>
                  <GlassInput type="password" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <GlassButton variant="secondary">Update Password</GlassButton>
              </div>
            </form>
          </GlassCard>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <GlassCard className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Learning Stats</h4>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">12 <span className="text-base font-normal text-muted-foreground">Courses</span></p>
            </GlassCard>
            
            <GlassCard className="p-6 bg-gradient-to-br from-secondary/10 to-transparent border-secondary/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Time Spent</h4>
                </div>
              </div>
              <p className="text-3xl font-bold text-white mb-1">34 <span className="text-base font-normal text-muted-foreground">Hours</span></p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  )
}
