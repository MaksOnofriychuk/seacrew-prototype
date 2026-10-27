import type { ScreenProps } from '../registry'
import { DocsScreen } from './_app-docs'

// p02 — документи (docsScreen у C): групи, номер прихований, крім останніх цифр, строк дії.
// Плашка строку й примітка зверху — лише в документа, що спливає. «+» — додати документ (ИИ прочитає);
// медичні — окремо, вручну на кроці s5 (ADR-090). ?med=1 показує медичний документ, що спливає за 18 днів.
export function P02Docs({ go }: ScreenProps) {
  return <DocsScreen go={go} />
}
