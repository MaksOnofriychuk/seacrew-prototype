import type { ScreenProps } from '../types'
import { JobsScreen } from '../p/_app-jobs'

// pr-recommend — це вкладка «Рекомендации» екрана p05 (відповідь 105), окремого екрана немає.
// id лишається в реєстрі, щоб старі переходи відкривали p05 на цій вкладці.
export function PrRecommend({ go }: ScreenProps) {
  return <JobsScreen go={go} initialTab="rec" />
}
