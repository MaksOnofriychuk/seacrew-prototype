import { defineGroups } from '../types'
import { G01GuestFeed } from '../g01-guest-feed'
import { G02GuestJobs, G03GuestGate } from '../g02-guest-jobs'
import { G04GuestJob } from '../g04-guest-job'
import { O01Slides, O07Lang } from '../o01-slides'
import { O02Choice } from '../o02-choice'
import { O03Quick } from '../o03-quick'
import { O04StepIntro } from '../o04-step-intro'
import { O05Login } from '../o05-login'
import { O06Recovery } from '../o06-recovery'

// Онбординг, вхід, гість (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Онбординг и гость',
    screens: [
      { id: 'o01', title: '1. Слайды', Component: O01Slides, bleed: true },
      { id: 'o07', title: '1a. Язык приложения', Component: O07Lang, bleed: true },
      { id: 'o02', title: '2. Выбор способа', Component: O02Choice, bleed: true },
      { id: 'o03', title: '3. Что понадобится (быстро)', Component: O03Quick },
      { id: 'o04', title: '4. Что понадобится (пошагово)', Component: O04StepIntro },
      { id: 'o05', title: 'Вход', Component: O05Login },
      { id: 'o06', title: 'Восстановление пароля', Component: O06Recovery },
      { id: 'g01', title: 'Гость · Лента', Component: G01GuestFeed },
      { id: 'g02', title: 'Гость · Вакансии', Component: G02GuestJobs },
      { id: 'g04', title: 'Гость · Вакансия', Component: G04GuestJob },
      { id: 'g03', title: 'Гость · окно «Зарегистрируйтесь…»', Component: G03GuestGate },
    ],
  },
])
