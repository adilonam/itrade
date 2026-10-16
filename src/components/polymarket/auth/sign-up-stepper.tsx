import { cn } from "@/lib/utils"

type SignUpStep = 1 | 2 | 3

type SignUpStepperProps = {
  currentStep: SignUpStep
  labels: {
    account: string
    verify: string
    confirm: string
  }
}

const STEPS: { step: SignUpStep; key: keyof SignUpStepperProps["labels"] }[] = [
  { step: 1, key: "account" },
  { step: 2, key: "verify" },
  { step: 3, key: "confirm" },
]

export function SignUpStepper({ currentStep, labels }: SignUpStepperProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-2">
      {STEPS.map(({ step, key }, index) => {
        const isActive = step === currentStep
        const isComplete = step < currentStep

        return (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary-container text-white"
                    : isComplete
                      ? "bg-primary-container/20 text-primary-container dark:bg-primary-fixed-dim/20 dark:text-primary-fixed-dim"
                      : "bg-surface-container-high dark:bg-surface-container-high/60 text-on-surface-variant dark:text-secondary-fixed-dim"
                )}
              >
                {step}
              </div>
              <span
                className={cn(
                  "truncate text-[10px] font-medium tracking-wide uppercase",
                  isActive
                    ? "text-primary-container dark:text-primary-fixed-dim"
                    : "text-on-surface-variant dark:text-secondary-fixed-dim"
                )}
              >
                {labels[key]}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  "mb-5 h-px flex-1",
                  step < currentStep
                    ? "bg-primary-container/40 dark:bg-primary-fixed-dim/40"
                    : "bg-outline-variant/60 dark:bg-on-secondary-container"
                )}
              />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
