import * as React from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  label?: string
}

function Input({
  className,
  type,
  label,
  id,
  onFocus,
  onBlur,
  onChange,
  ...props
}: InputProps) {
  const [focused, setFocused] = React.useState(false)
  const [internalHasValue, setInternalHasValue] = React.useState(
    !!props.defaultValue
  )

  const isControlled = props.value !== undefined
  const hasValue = isControlled ? !!props.value : internalHasValue
  const isActive = focused || hasValue

  const baseClasses = cn(
    "flex w-full min-w-0 rounded-2xl border border-border bg-card transition-[border-color,box-shadow] outline-none",
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
  )

  if (!label) {
    return (
      <input
        type={type}
        id={id}
        data-slot="input"
        className={cn(
          baseClasses,
          "h-auto p-4 text-base md:text-sm",
          "placeholder:text-muted-foreground",
          "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "selection:bg-primary selection:text-foreground [&:-webkit-autofill]:![box-shadow:0_0_0px_1000px_hsl(var(--card))_inset]",
          className
        )}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        {...props}
      />
    )
  }

  return (
    <div
      className={cn(
        baseClasses,
        focused && "border-ring ring-ring/50 ring-[3px]",
        "relative h-14 cursor-text",
        className
      )}
      onClick={() => document.getElementById(id ?? "")?.focus()}
    >
      <label
        htmlFor={id}
        className={cn(
          "absolute left-4 pointer-events-none select-none",
          "text-muted-foreground transition-all duration-150 ease-out",
          isActive
            ? "top-3.5 text-[10px] leading-none"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        {label}
      </label>
      <input
        type={type}
        id={id}
        data-slot="input"
        placeholder=""
        className={cn(
          "w-full bg-transparent outline-none pt-5 pb-2 px-4 text-sm text-foreground",
          "selection:bg-primary selection:text-foreground",
          "file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "disabled:pointer-events-none disabled:cursor-not-allowed"
        )}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        onChange={(e) => {
          if (!isControlled) setInternalHasValue(!!e.target.value)
          onChange?.(e)
        }}
        {...props}
      />
    </div>
  )
}

export { Input }