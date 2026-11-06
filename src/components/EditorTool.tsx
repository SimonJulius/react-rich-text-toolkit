import type { ReactNode } from 'react'

export function Tool({ label, children, onClick, pressed, disabled }: {
    label: string
    children: ReactNode
    onClick: () => void
    pressed?: boolean
    disabled?: boolean
}) {
    return <button type="button" title={label} aria-label={label} aria-pressed={pressed} disabled={disabled}
        onMouseDown={event => event.preventDefault()} onClick={onClick}>{children}</button>
}

