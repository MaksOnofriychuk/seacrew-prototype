import { defineGroups } from '../types'
import { P02Docs } from '../dp/p02-docs'
import { P11Doc } from '../dp/p11-doc'
import { P18Add } from '../dp/p18-add'
import { P19Check } from '../dp/p19-check'
import { P14Profile } from '../p/p14'

// Документи і профіль (мобілка, етап 5). Екрани — у теці dp.
export const groups = defineGroups('mobile', [
  {
    title: 'Документы и профиль',
    screens: [
      { id: 'p02', title: 'Документы', Component: P02Docs },
      { id: 'p18', title: 'Документы · Добавить документ', Component: P18Add },
      { id: 'p19', title: 'Документы · Проверьте документ', Component: P19Check },
      { id: 'p11', title: 'Документ', Component: P11Doc },
      { id: 'p14', title: 'Профиль', Component: P14Profile },
    ],
  },
])
