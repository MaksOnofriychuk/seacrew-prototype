import type { ScreenProps } from '../registry'
import { JobsScreen } from './_app-jobs'

// p05 — вакансії моряка (jobsScreen у C): пошук, фільтри чипами, «Сохранить поиск»,
// у рядку — «Подходит по профилю», закладка пише спільний saved.jobs.
export function P05Jobs({ go }: ScreenProps) {
  return <JobsScreen go={go} />
}
