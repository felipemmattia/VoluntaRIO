import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full rounded-lg border border-[#E8E9EB] bg-white px-4 py-3 text-base font-normal text-black placeholder:text-[#A3A3A3] transition-all duration-200 outline-none file:inline-flex file:h-9 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-[#39A46B] focus:shadow-[0px_0px_0px_3px_rgba(57,164,107,0.1)]",
        "aria-invalid:border-[#E74C3C] aria-invalid:bg-[rgba(231,76,60,0.02)] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
