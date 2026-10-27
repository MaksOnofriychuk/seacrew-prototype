import type { ScreenProps } from '../registry'
import { Q09Profile } from '../q/q09'

// p14 — профіль у застосунку. Як у C (profileScreen для q09 і p14) — той самий екран, що q09.
export function P14Profile(props: ScreenProps) {
  return <Q09Profile {...props} />
}
