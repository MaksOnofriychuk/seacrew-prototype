import { A2Content } from '../a2/a2-content'
import { A2Payments } from '../a2/a2-payments'
import { A2Plans } from '../a2/a2-plans'
import { A2Promo } from '../a2/a2-promo'
import { A2Reports } from '../a2/a2-reports'
import { A2Sub } from '../a2/a2-sub'
import { A2Subs } from '../a2/a2-subs'
import { A2Verify } from '../a2/a2-verify'
import { defineGroups } from '../types'

// Адмінка, частина 2: гроші моряків, компанії, скарги, тексти (рішення Макса 02.11 «все малюємо повністю»).
export const groups = defineGroups('admin', [
  {
    title: 'Премиум и платежи',
    screens: [
      { id: 'a2-subs', title: 'Подписки моряков', Component: A2Subs, path: '/admin/subscriptions' },
      { id: 'a2-sub', title: 'Подписка: история и продление', Component: A2Sub, path: '/admin/subscriptions/s-104' },
      { id: 'a2-payments', title: 'Платежи', Component: A2Payments, path: '/admin/payments' },
      { id: 'a2-promo', title: 'Промокоды и приглашения', Component: A2Promo, path: '/admin/promo' },
    ],
  },
  {
    title: 'Компании',
    screens: [
      { id: 'a2-verify', title: 'Верификация компаний', Component: A2Verify, path: '/admin/verification' },
      { id: 'a2-plans', title: 'Тарифы компаний', Component: A2Plans, path: '/admin/plans' },
    ],
  },
  {
    title: 'Жалобы и контент',
    screens: [
      { id: 'a2-reports', title: 'Жалобы', Component: A2Reports, path: '/admin/reports' },
      { id: 'a2-content', title: 'Тексты и рассылки', Component: A2Content, path: '/admin/content' },
    ],
  },
])
