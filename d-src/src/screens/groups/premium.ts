import { defineGroups } from '../types'
import { PrAnalytics } from '../pr/pr-analytics'
import { PrCompare } from '../pr/pr-compare'
import { PrFollow, PrFollowing } from '../pr/pr-follow'
import { PrGroupNew } from '../pr/pr-group-new'
import { PrGroup } from '../pr/pr-group-topic'
import { PrGroups, PrGroupsMine } from '../pr/pr-groups'
import { PrInvite, PrPromo } from '../pr/pr-invite'
import { PrLock, PrLockAlerts, PrLockCompare, PrLockSearches } from '../pr/pr-lock'
import { PrPaywall } from '../pr/pr-paywall'
import { PrRecommend } from '../pr/pr-recommend'
import { PrSalary, PrSalaryFew } from '../pr/pr-salary'
import { PrStatus, PrStatusEnded } from '../pr/pr-status'

// Премиум, зарплата й аналітика, рекомендації, підписки, обговорення (мобілка, 02.11 «все малюємо повністю»).
// Відповіді замовника: 96, 103, 105, 107, 113, 117, 126, 128–132, 134–136; бриф S22, S23, S29, S35, S46–S48.
export const groups = defineGroups('mobile', [
  {
    title: 'Премиум',
    screens: [
      { id: 'pr-paywall', title: 'Премиум (конец онбординга)', Component: PrPaywall, bleed: true },
      { id: 'pr-status', title: 'Моя подписка', Component: PrStatus },
      { id: 'pr-status-ended', title: 'Моя подписка · закончилась', Component: PrStatusEnded },
      { id: 'pr-lock', title: 'Замок · анкета из профиля', Component: PrLock },
      { id: 'pr-lock-searches', title: 'Замок · больше 3 подборок', Component: PrLockSearches },
      { id: 'pr-lock-compare', title: 'Замок · сравнение вакансий', Component: PrLockCompare },
      { id: 'pr-lock-alerts', title: 'Замок · подходящие вакансии сразу', Component: PrLockAlerts },
      { id: 'pr-invite', title: 'Пригласить коллегу', Component: PrInvite },
      { id: 'pr-promo', title: 'Ввести промокод', Component: PrPromo },
      { id: 'pr-compare', title: 'Сравнение вакансий', Component: PrCompare },
    ],
  },
  {
    title: 'Зарплата, аналитика, рекомендации',
    screens: [
      { id: 'pr-salary', title: 'Моя зарплата и рейтинг', Component: PrSalary },
      { id: 'pr-salary-few', title: 'Моя зарплата · недостаточно данных', Component: PrSalaryFew },
      { id: 'pr-analytics', title: 'Аналитика', Component: PrAnalytics },
      { id: 'pr-recommend', title: 'Вакансии · Рекомендации', Component: PrRecommend },
    ],
  },
  {
    title: 'Подписки и обсуждения',
    screens: [
      { id: 'pr-follow', title: 'Профиль моряка · Подписаться', Component: PrFollow },
      { id: 'pr-following', title: 'Подписки', Component: PrFollowing },
      { id: 'pr-groups', title: 'Обсуждения (скоро)', Component: PrGroups },
      { id: 'pr-groups-mine', title: 'Обсуждения · Мои темы', Component: PrGroupsMine },
      { id: 'pr-group-new', title: 'Обсуждения · Новая тема', Component: PrGroupNew },
      { id: 'pr-group', title: 'Обсуждения · Тема', Component: PrGroup },
    ],
  },
])
