import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
              className={cn(
          "border-slate-700 placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/50 aria-invalid:ring-red-500/20 aria-invalid:border-red-500 bg-slate-800/50 flex field-sizing-content min-h-16 w-full rounded-lg border px-3 py-2 text-base text-slate-200 shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
      {...props}
    />
  )
}

export { Textarea }
