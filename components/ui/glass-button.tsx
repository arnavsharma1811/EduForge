import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "glass-button inline-flex items-center justify-center rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-11 px-8 py-2",
          variant === "primary" &&
            "bg-gradient-to-r from-primary to-secondary text-white border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]",
          variant === "secondary" &&
            "bg-white/5 border border-white/10 text-white hover:bg-white/10",
          variant === "ghost" && "hover:bg-white/5 text-slate-300 hover:text-white border border-transparent hover:border-white/5",
          className
        )}
        {...props}
      />
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton }
