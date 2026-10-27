import type { ScreenProps } from '../registry'
import { FeedScreen } from './_feed-screen'

// p01 — стрічка моряка (C: feedScreen(false)).
export function P01Feed({ go }: ScreenProps) {
  return <FeedScreen go={go} />
}
