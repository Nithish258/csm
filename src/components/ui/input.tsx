import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/src/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm transition-all outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:pointer-events-none disabled:opacity-50 dark:bg-slate-900 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-emerald-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
