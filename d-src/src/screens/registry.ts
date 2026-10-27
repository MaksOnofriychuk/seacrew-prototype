import type { ComponentType } from 'react'
import { O01Slides } from './o01-slides'

export type ScreenProps = { go: (id: string) => void }

export type ScreenDef = {
  id: string
  title: string
  Component: ComponentType<ScreenProps>
  /** екран займає й місце під рядком статусу */
  bleed?: boolean
}

// Ті самі групи й назви, що у вкладці C. Екрани додаються етапами.
export const GROUPS: { title: string; screens: ScreenDef[] }[] = [
  {
    title: 'Онбординг и гость',
    screens: [{ id: 'o01', title: '1. Слайды', Component: O01Slides, bleed: true }],
  },
]

export const SCREENS = GROUPS.flatMap((g) => g.screens)
