import type { ScreenProps } from '../registry'
import { JobsScreen } from './_app-jobs'

// p13 — те саме, що p05, з відкритим вікном «Фильтры». Закрили вікно — повертаємось на p05.
export function P13Filters({ go }: ScreenProps) {
  return <JobsScreen go={go} filtersOpen />
}
