import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-normal transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "rounded-[66px] border-none bg-primary text-primary-foreground min-h-[42px] px-6 text-xs hover:bg-primary/90 hover:shadow-[0px_4px_12px_rgba(0,0,0,0.15)] active:bg-primary/80 active:shadow-none",
        destructive:
          "rounded-[66px] border-none bg-destructive text-white min-h-[42px] px-6 text-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "rounded-[66px] border-2 border-foreground bg-transparent shadow-none min-h-[42px] px-6 text-xs text-foreground hover:bg-muted hover:border-muted-foreground",
        secondary:
          "rounded-[66px] border-none bg-secondary text-secondary-foreground min-h-[42px] px-6 text-xs hover:bg-secondary/80",
        ghost:
          "rounded-none border-none bg-transparent px-0 py-0.5 text-xs text-[#0000EE] underline hover:text-[#0000CC] hover:opacity-80",
        link: "rounded-none border-none bg-transparent px-0 py-0.5 text-xs text-[#0000EE] underline hover:text-[#0000CC] hover:opacity-80",
      },
      size: {
        default: "h-[42px] has-[>svg]:px-5",
        sm: "h-[38px] rounded-[66px] gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-[48px] rounded-[66px] px-8 has-[>svg]:px-6 text-xs",
        icon: "h-11 w-11 rounded-lg",
        "icon-sm": "h-10 w-10 rounded-lg",
        "icon-lg": "size-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
