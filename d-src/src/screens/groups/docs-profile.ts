import { defineGroups } from '../types'
import { P02Docs } from '../p/p02'
import { P11Doc } from '../p/p11'
import { P14Profile } from '../p/p14'

// Документи і профіль (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Документы и профиль',
    screens: [
      { id: 'p02', title: 'Документы', Component: P02Docs },
      { id: 'p11', title: 'Документ', Component: P11Doc },
      { id: 'p14', title: 'Профиль', Component: P14Profile },
    ],
  },
])
