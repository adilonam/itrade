"use client"

import { useState, type HTMLAttributes } from "react"
import { Eye, EyeOff, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/polymarket/ui/input"

type AuthInputFieldProps = {
  id: string
  name: string
  type?: "text" | "email" | "password"
  label?: string
  placeholder?: string
  icon: LucideIcon
  value: string
  onChange: (value: string) => void
  required?: boolean
  autoComplete?: string
  minLength?: number
  maxLength?: number
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"]
  pattern?: string
  disabled?: boolean
  hint?: string
  inputClassName?: string
}

export function AuthInputField({
  id,
  name,
  type = "text",
  label,
  placeholder,
  icon: Icon,
  value,
  onChange,
  required,
  autoComplete,
  minLength,
  maxLength,
  inputMode,
  pattern,
  disabled,
  hint,
  inputClassName,
}: AuthInputFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"
  const inputType = isPassword && showPassword ? "text" : type

  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <Icon className="text-on-surface-variant dark:text-secondary-fixed-dim pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          id={id}
          name={name}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          inputMode={inputMode}
          pattern={pattern}
          disabled={disabled}
          spellCheck={type === "text" && inputMode === "numeric" ? false : undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? label}
          className={cn(
            "border-outline-variant/60 dark:border-on-secondary-container bg-surface-container-lowest dark:bg-surface-container-high/40 h-11 rounded-xl ps-10 text-sm",
            isPassword && "pe-10",
            inputClassName
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-on-surface-variant dark:text-secondary-fixed-dim hover:text-on-surface dark:hover:text-surface-white absolute end-3 top-1/2 -translate-y-1/2"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p className="text-on-surface-variant dark:text-secondary-fixed-dim text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
