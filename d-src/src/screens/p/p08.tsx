import type { ScreenProps } from '../registry'
import { JobScreen } from './_app-jobs'

// p08 — сторінка вакансії (jobScreen у C): вимоги порівнюються з профілем, внизу — закладка й «Откликнуться».
// Кнопки листування з агентством немає (правка п. 16).
export function P08Job({ go }: ScreenProps) {
  return <JobScreen go={go} />
}
