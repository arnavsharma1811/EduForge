import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassChipProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
}

const GlassChip = React.forwardRef<HTMLDivElement, GlassChipProps>(
  ({ className, active, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          active
            ? "bg-primary/20 border-primary/30 text-primary-foreground shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white",
          className
        )}
        {...props}
      />
    )
  }
)
GlassChip.displayName = "GlassChip"

export { GlassChip }
