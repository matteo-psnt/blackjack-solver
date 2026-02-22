import type { ReactNode } from 'react'

interface RuleRowProps {
  label: string
  description?: string
  children: ReactNode
}

export function RuleRow({ label, description, children }: RuleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-foreground leading-none">{label}</p>
        {description && (
          <p className="text-[11px] text-muted-foreground/60 mt-1 leading-tight">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
