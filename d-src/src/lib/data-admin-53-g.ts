// Додаткові вигадані рядки для веб-адмінки (правка №53, екрани тарифів, промокодів, підписок і платежів):
// щоб у списках було 2–3 сторінки. Підмішуються в кінець SUBS / PAYMENTS / PROMOS / INVITERS / ORG_PLANS.
// Реальних людей і компаній немає.
import { ORG_PLANS, PAYMENTS, PROMOS, INVITERS, SUBS } from './data-admin-2'
import type { Inviter, OrgPlanRow, Payment, Promo, Sub, SubPlan, SubSource, SubState } from './data-admin-2'

const POS = ['Master', 'Chief Officer', '2nd Officer', '3rd Officer', 'Chief Engineer', '2nd Engineer', '3rd Engineer', 'Bosun (Boatswain)', 'AB (Able Seaman)', 'Oiler', 'Cook', 'Electrician (ETO)']
const NAMES = ['Oleh V.', 'Marek W.', 'Ravi S.', 'Nikolai B.', 'Joel C.', 'Viktor H.', 'Ahmed R.', 'Petar D.', 'Ioan M.', 'Carlos E.', 'Yuri T.', 'Samir A.', 'Lars O.', 'Dennis G.', 'Anton Z.', 'Rafael Q.', 'Teodor P.', 'Vasyl K.', 'Zoran J.', 'Henrik F.', 'Mikhail U.', 'Ernesto L.', 'Aleksandr N.', 'Jun B.']
const ini = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const pad = (n: number) => String(n).padStart(2, '0')
/** день листопада–грудня 2026 за номером */
const day = (n: number) => (n <= 30 ? `2026-11-${pad(Math.max(1, n))}` : n <= 61 ? `2026-12-${pad(n - 30)}` : `2027-01-${pad(Math.min(28, n - 61))}`)

const PLAN_CYCLE: SubPlan[] = ['month', 'year', 'month', 'week', 'month', 'month', 'year', 'week']
const SRC_CYCLE: SubSource[] = ['appstore', 'googleplay', 'card', 'promo', 'appstore', 'invite', 'googleplay', 'manual']
const STATE_CYCLE: SubState[] = ['active', 'active', 'trial', 'ended', 'active', 'trial', 'active', 'ended']

export const EXTRA_SUBS: Sub[] = NAMES.map((name, i) => {
  const plan = PLAN_CYCLE[i % 8]
  const state = STATE_CYCLE[i % 8]
  const source = SRC_CYCLE[i % 8]
  const until = state === 'ended' ? `2026-10-${pad(5 + ((i * 3) % 25))}` : plan === 'year' ? `2027-0${1 + (i % 9)}-1${i % 9}` : day(6 + ((i * 5) % 50))
  const paid = source === 'promo' || source === 'invite' || source === 'manual' || plan === 'week' ? 0 : plan === 'year' ? 39.99 : 4.99 * (1 + (i % 3))
  return {
    id: `s-${130 + i}`,
    name,
    initials: ini(name),
    position: POS[i % POS.length],
    plan,
    state,
    source,
    started: `2026-10-${pad(1 + ((i * 2) % 28))}`,
    until,
    autoRenew: state !== 'ended' && source !== 'promo' && source !== 'manual' && i % 3 !== 1,
    paid: Math.round(paid * 100) / 100,
    history: paid
      ? [{ at: `2026-10-${pad(1 + ((i * 2) % 28))} 10:15`, kind: 'pay', text: `Оплата: ${plan === 'year' ? 'год' : 'месяц'}`, amount: Math.round(paid * 100) / 100 }]
      : [{ at: `2026-10-${pad(1 + ((i * 2) % 28))} 10:15`, kind: source === 'promo' ? 'promo' : source === 'invite' ? 'invite' : source === 'manual' ? 'manual' : 'trial', text: source === 'promo' ? 'Промокод: неделя премиума' : source === 'invite' ? 'Неделя по приглашению' : source === 'manual' ? 'Продлено вручную' : 'Пробная неделя после онбординга' }],
  }
})
export const ALL_SUBS: Sub[] = [...SUBS, ...EXTRA_SUBS]

const ORGS = ['Harbor Line Crewing', 'Pacific Star Manning', 'Baltic Seas Agency', 'Aegean Marine Staff', 'Northport Crew', 'Cape Horn Ships', 'Black Sea Recruit', 'Oceanic Talent', 'Vega Maritime', 'Southwind Crewing']
const ITEMS: [string, number][] = [['Тариф «Команда», месяц', 149], ['Тариф «Агентство», месяц', 399], ['Тариф «Команда», год', 1490]]
const CH: Payment['channel'][] = ['Карта', 'Счёт', 'Карта']
const ST: Payment['state'][] = ['paid', 'paid', 'paid', 'failed', 'paid', 'pending', 'refunded', 'paid']

export const EXTRA_PAYMENTS: Payment[] = Array.from({ length: 22 }, (_, i) => {
  const company = i % 3 === 2
  const state = ST[i % 8]
  const when = `2026-10-${pad(30 - i)} ${pad(8 + (i % 10))}:${pad((i * 7) % 60)}`
  if (company) {
    const [item, amount] = ITEMS[i % 3]
    return { id: `p-${1980 - i * 3}`, at: when, payer: ORGS[i % ORGS.length], payerKind: 'company', item, channel: CH[i % 3], amount, state, ref: `ch_${7000 + i}•••${10 + i}`, ...(state === 'refunded' ? { refund: { amount, reason: 'Ошибочное списание', at: `2026-10-${pad(30 - i)} 18:00`, who: 'Команда Seafolio' } } : {}) }
  }
  const s = EXTRA_SUBS[i % EXTRA_SUBS.length]
  const year = s.plan === 'year'
  const channel: Payment['channel'] = s.source === 'googleplay' ? 'Google Play' : s.source === 'card' ? 'Карта' : 'App Store'
  const amount = year ? 39.99 : 4.99
  return { id: `p-${1980 - i * 3}`, at: when, payer: s.name, payerKind: 'seafarer', subId: s.id, item: year ? 'Премиум, год' : 'Премиум, месяц', channel, amount, state: state === 'pending' ? 'paid' : state, ref: `GPA.${3000 + i}•••${20 + i}`, ...(state === 'refunded' ? { refund: { amount, reason: 'Возврат по запросу моряка', at: `2026-10-${pad(30 - i)} 20:00`, who: channel === 'Карта' ? 'Команда Seafolio' : 'Apple' } } : {}) }
})
export const ALL_PAYMENTS: Payment[] = [...PAYMENTS, ...EXTRA_PAYMENTS]

const NOTES = ['Выставка в Одессе', 'Партнёр: учебный центр', 'Рассылка по базе', 'Инфлюенсер, канал моряков', 'Стенд на ярмарке в Гданьске', 'Подарок участникам вебинара', 'Тест подписки', 'Конференция агентств', 'Листовки в порту']
export const EXTRA_PROMOS: Promo[] = NOTES.map((note, i) => {
  const limit = i % 4 === 3 ? null : [50, 100, 250, 500, 1000][i % 5]
  const used = limit === null ? 120 + i * 40 : Math.min(limit, Math.round((limit * (i * 13 + 8)) / 100))
  const expired = i % 5 === 4
  return {
    id: `pc${10 + i}`,
    code: ['GDANSK-26', 'WEBINAR-NOV', 'PORT-ODESA', 'CREWDAY', 'AGENCY-MEET', 'SEA-FRIEND', 'TEST-PAY', 'BLUE-SKY', 'LEAFLET'][i],
    days: [7, 14, 30][i % 3],
    limit,
    used,
    until: i % 6 === 5 ? null : expired ? `2026-10-${pad(10 + i)}` : day(14 + i * 6),
    audience: i % 2 ? 'all' : 'new',
    state: expired ? 'expired' : i % 5 === 2 ? 'off' : 'active',
    created: `2026-10-${pad(2 + i * 3)}`,
    note,
  }
})
export const ALL_PROMOS: Promo[] = [...PROMOS, ...EXTRA_PROMOS]

const INV_NAMES = ['Oleh V.', 'Marek W.', 'Ravi S.', 'Nikolai B.', 'Joel C.', 'Viktor H.', 'Ahmed R.', 'Petar D.', 'Ioan M.', 'Carlos E.', 'Yuri T.', 'Samir A.']
export const EXTRA_INVITERS: Inviter[] = INV_NAMES.map((name, i) => ({
  id: `iv${10 + i}`,
  name,
  initials: ini(name),
  position: POS[(i + 3) % POS.length],
  opened: 24 - i * 2 + (i % 3),
  joined: Math.max(0, 6 - Math.floor(i / 2)),
  weeks: Math.max(0, 6 - Math.floor(i / 2) - (i % 2)),
  last: `2026-10-${pad(28 - i * 2)}`,
  ...(i === 4 ? { flag: '1 приглашённый с его устройства' } : {}),
}))
export const ALL_INVITERS: Inviter[] = [...INVITERS, ...EXTRA_INVITERS]

const PLANS = ['Старт', 'Команда', 'Агентство']
export const EXTRA_ORG_PLANS: OrgPlanRow[] = ORGS.map((org, i) => {
  const plan = PLANS[[0, 1, 1, 2, 0, 1, 0, 2, 1, 0][i]]
  const free = plan === 'Старт'
  return {
    orgId: `org-x${i + 1}`,
    org,
    plan,
    since: `2026-${pad(8 + (i % 3))}-${pad(3 + i * 2)}`,
    next: free ? null : day(3 + i * 4),
    channel: free ? '—' : i % 3 === 0 ? 'Счёт' : 'Карта',
    state: free ? 'free' : i === 5 ? 'overdue' : 'ok',
  }
})
export const ALL_ORG_PLANS: OrgPlanRow[] = [...ORG_PLANS, ...EXTRA_ORG_PLANS]
/** организации, у которых есть карточка в a-org */
export const KNOWN_ORGS = new Set(ORG_PLANS.map((o) => o.orgId))

/** Шаги для фильтров «от …» */
export const AMOUNT_STEPS = [5, 20, 50, 150, 400]
export const amountOptions = AMOUNT_STEPS.map((n) => ({ value: String(n), label: `от $${n}` }))
