import type { ScreenProps } from '../registry'
import { JobScreen } from './_app-jobs'

// p12 — p08 з відкритим підтвердженням відгуку (відповідь 97). Після «Откликнуться» — чат з рекрутером m-chat (правка №22).
export function P12Apply({ go }: ScreenProps) {
  return <JobScreen go={go} applyOpen />
}
