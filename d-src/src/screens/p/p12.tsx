import type { ScreenProps } from '../registry'
import { JobScreen } from './_app-jobs'

// p12 — p08 з відкритим вікном відгуку: анкета з профілю, чого бракує, супровідний лист.
export function P12Apply({ go }: ScreenProps) {
  return <JobScreen go={go} applyOpen />
}
