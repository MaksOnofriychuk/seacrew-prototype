import type { ScreenProps } from '../registry'
import { MyApplicationsScreen } from './_app-jobs'

// p23 — «Вакансии · Мои отклики» (відповідь 98): статуси Отправлено / Ожидание / Метч / Отклонено.
export function P23Applications({ go }: ScreenProps) {
  return <MyApplicationsScreen go={go} />
}
