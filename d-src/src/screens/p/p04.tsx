import type { ScreenProps } from '../registry'
import { FeedScreen } from './_feed-screen'

// p04 — бокове меню: та сама стрічка з відкритим меню (C: S.drawer = true; feedScreen(false)).
// Закрили меню — переходимо на p01, як у C.
export function P04Drawer({ go }: ScreenProps) {
  return <FeedScreen go={go} drawer />
}
