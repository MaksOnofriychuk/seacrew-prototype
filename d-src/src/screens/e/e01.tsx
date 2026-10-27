import type { ScreenProps } from '../registry'

// e01 — заглушка; екран робиться на етапі 4.
export function E01NotRead(_: ScreenProps) {
  return <div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground">e01 — в работе</div>
}
