import type { ScreenProps } from '../registry'
import { JobsScreen } from './_app-jobs'

// p23 — «Вакансии · Мои отклики» (відповідь 98): це вкладка «Отклики» екрана p05, окремого екрана немає.
export function P23Applications({ go }: ScreenProps) {
  return <JobsScreen go={go} initialTab="mine" />
}
