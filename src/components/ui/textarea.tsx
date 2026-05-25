import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[120px] w-full rounded-lg border border-[#E8E9EB] bg-white px-4 py-3 text-base font-normal leading-[24px] text-black placeholder:text-[#A3A3A3] transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus:border-[#39A46B] focus:shadow-[0px_0px_0px_3px_rgba(57,164,107,0.1)]",
        "aria-invalid:border-[#E74C3C] aria-invalid:bg-[rgba(231,76,60,0.02)]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
