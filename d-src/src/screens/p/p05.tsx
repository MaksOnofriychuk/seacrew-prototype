import type { ScreenProps } from '../registry'
import { JobsScreen } from './_app-jobs'

// p05 — вакансії моряка: пошук, фільтри чіпами (правка №35), сортування (відповідь 94),
// «Сохранить поиск» → підборка (p17), картка — посада, тип судна, контракт, посадка, ЗП (відповідь 95).
export function P05Jobs({ go }: ScreenProps) {
  return <JobsScreen go={go} />
}
