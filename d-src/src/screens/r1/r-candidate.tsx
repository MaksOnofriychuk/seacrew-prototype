import type { ScreenProps } from '../types'
import { SeafarerPage } from './r-seafarer'

// r-candidate — тот же экран, что r-seafarer (профиль моряка со вкладками «Анкеты», «Переписка», «Файлы»),
// открытый из списка кандидатов (перевірка 03.11, №19: без двух копий одного профиля).
export function RCandidate({ go }: ScreenProps) {
  return <SeafarerPage go={go} entry="candidates" />
}
