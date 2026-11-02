import { defineGroups } from '../types'
import { G01GuestFeed } from '../g01-guest-feed'
import { G02GuestJobs, G03GuestGate } from '../g02-guest-jobs'
import { G04GuestJob } from '../g04-guest-job'
import { O01Slides } from '../o01-slides'
import { O02Choice } from '../o02-choice'
import { O03Quick } from '../o03-quick'
import { O04StepIntro } from '../o04-step-intro'

// Онбординг, вхід, гість (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Онбординг и гость',
    screens: [
      { id: 'o01', title: '1. Слайды', Component: O01Slides, bleed: true },
      { id: 'o02', title: '2. Выбор способа', Component: O02Choice, bleed: true },
      { id: 'o03', title: '3. Что понадобится (быстро)', Component: O03Quick },
      { id: 'o04', title: '4. Что понадобится (пошагово)', Component: O04StepIntro },
      { id: 'g01', title: 'Гость · Лента', Component: G01GuestFeed },
      { id: 'g02', title: 'Гость · Вакансии', Component: G02GuestJobs },
      { id: 'g04', title: 'Гость · Вакансия', Component: G04GuestJob },
      { id: 'g03', title: 'Гость · «Зарегистрируйтесь, чтобы…»', Component: G03GuestGate },
    ],
  },
])
