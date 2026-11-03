import { defineGroups } from '../types'
import { PubLegal } from '../r3/pub-legal'
import { PubJob } from '../r3/pub-job'
import { PubLanding } from '../r3/pub-landing'
import { PubProfile } from '../r3/pub-profile'
import { RBilling } from '../r3/r-billing'
import { RBillingHistory } from '../r3/r-billing-history'
import { RTeam } from '../r3/r-team'
import { RVerify } from '../r3/r-verify'

// Веб, частина 3: публічні сторінки (без кабінету) і компанія — тариф, рахунки, верифікація, команда.
// Екрани — у screens/r3, дані — у lib/data-recruiter-3.ts. Тарифи, рівні перевірки й ролі — приклад (відп. 139–141, 160, 161 без відповіді).
export const groups = defineGroups('recruiter', [
  {
    title: 'Публичные страницы',
    screens: [
      { id: 'pub-landing', title: 'Seafolio — главная', Component: PubLanding, path: '/' },
      { id: 'pub-job', title: 'Вакансия (публичная страница)', Component: PubJob, path: '/job/j01' },
      { id: 'pub-legal', title: 'Условия, политика, поддержка (текст)', Component: PubLegal, path: '/legal' },
      { id: 'pub-profile', title: 'Профиль моряка (публичный превью)', Component: PubProfile, path: '/s/andrii-k' },
    ],
  },
  {
    title: 'Тариф, верификация, команда',
    screens: [
      { id: 'r-billing', title: 'Тариф и оплата', Component: RBilling, path: '/billing' },
      { id: 'r-billing-history', title: 'Счета', Component: RBillingHistory, path: '/billing/invoices' },
      { id: 'r-verify', title: 'Верификация компании', Component: RVerify, path: '/verification' },
      { id: 'r-team', title: 'Команда', Component: RTeam, path: '/team' },
    ],
  },
])
