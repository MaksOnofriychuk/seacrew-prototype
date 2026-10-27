import type { ScreenProps } from '../registry'

// p08 — заглушка; екран робиться на етапі 8.
export function P08Job(_: ScreenProps) {
  return <div className="flex h-full items-center justify-center px-6 text-center text-muted-foreground">p08 — в работе</div>
}
