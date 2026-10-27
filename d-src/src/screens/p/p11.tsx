import type { ScreenProps } from '../registry'
import { DocScreen } from './_app-docs'

// p11 — документ (docScreen у C): документ як папір, превʼю зашифроване, дані з документа.
// «Изменить данные» — поля прямо на папері; правку видно адміністратору. Видалення — з підтвердженням.
export function P11Doc({ go }: ScreenProps) {
  return <DocScreen go={go} />
}
