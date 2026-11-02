import type { ScreenProps } from '../registry'
import { JobScreen } from './_app-jobs'

// p08 — сторінка вакансії: факти, вимоги (без порівняння з профілем — відповідь 99), судно, опис.
// Внизу — закладка й «Откликнуться»; після відгуку — «Открыть чат с рекрутером». Закрита вакансія — сіра, без відгуку.
export function P08Job({ go }: ScreenProps) {
  return <JobScreen go={go} />
}
