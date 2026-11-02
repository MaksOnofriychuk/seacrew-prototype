// Вигадані дані повідомлень і сповіщень моряка (етап 6). Реальних людей, компаній і документів немає.
// Правка №22: чат з'являється, коли моряк підтвердив інтерес до пропозиції рекрутера
// або відгукнувся на вакансію (тоді — заглушка «Вы откликнулись на вакансию», відповідь рекрутера — тут же).

/* ---------- чати ---------- */

export type ChatMsg =
  | { kind: 'day'; text: string }
  /** службова подія: підтвердження інтересу, відгук, надіслана анкета */
  | { kind: 'event'; event: 'offer' | 'applied' | 'form-sent' | 'cv-sent'; time: string }
  | { kind: 'text'; from: 'me' | 'them'; text: string; time: string }
  | { kind: 'photo'; from: 'me' | 'them'; caption?: string; time: string }
  | { kind: 'file'; from: 'me' | 'them'; name: string; size: string; time: string }
  | { kind: 'link'; from: 'me' | 'them'; url: string; title: string; text?: string; time: string }
  /** запит анкети від рекрутера → m-form */
  | { kind: 'form'; from: 'them'; title: string; due: string; time: string }

export type Chat = {
  id: string
  /** рекрутер; null — ще не відповів (чат після відгуку) */
  person: { name: string; initials: string } | null
  org: string
  orgShort: string
  online: boolean
  /** коли був онлайн, якщо зараз ні */
  seen?: string
  /** індекс вакансії в JOBS */
  job: number
  origin: 'offer' | 'applied'
  /** скільки останніх повідомлень рекрутера не прочитано */
  unread: number
  /** до якого (індекс у messages) включно рекрутер прочитав мої повідомлення */
  readUpTo: number
  messages: ChatMsg[]
  /** час останнього повідомлення для списку */
  time: string
}

export const CHATS: Chat[] = [
  {
    id: 'bw',
    person: { name: 'Елена Маринова', initials: 'ЕМ' },
    org: 'BlueWave Crewing',
    orgShort: 'BW',
    online: true,
    job: 0,
    origin: 'offer',
    unread: 2,
    readUpTo: 9,
    time: '11:41',
    messages: [
      { kind: 'day', text: '31 октября' },
      { kind: 'event', event: 'offer', time: '16:05' },
      { kind: 'text', from: 'them', text: 'Добрый день! Нашла ваш профиль в базе: опыт на химовозах нам подходит. Судно MT Aurora Spirit, посадка 05.12 в Роттердаме.', time: '16:05' },
      { kind: 'text', from: 'me', text: 'Здравствуйте! Да, интересно. Какая ротация?', time: '16:20' },
      { kind: 'text', from: 'them', text: '4 месяца ±1, смена экипажа в ЕС. Вот судно.', time: '16:31' },
      { kind: 'photo', from: 'them', caption: 'MT Aurora Spirit, Роттердам', time: '16:32' },
      { kind: 'day', text: 'Сегодня' },
      { kind: 'link', from: 'them', url: 'bluewave-crewing.example/vessels/aurora-spirit', title: 'MT Aurora Spirit', text: 'Chemical Tanker, 19 800 DWT, 2018', time: '10:02' },
      { kind: 'text', from: 'me', text: 'Спасибо, посмотрю и вернусь сегодня.', time: '10:15' },
      { kind: 'photo', from: 'me', caption: 'Последнее судно, MV Example Star', time: '10:16' },
      { kind: 'file', from: 'them', name: 'Условия контракта.pdf', size: '240 КБ', time: '11:40' },
      { kind: 'form', from: 'them', title: 'Анкета BlueWave Crewing', due: '08.11.2026', time: '11:41' },
    ],
  },
  {
    id: 'ns',
    person: { name: 'Мартин Сёренсен', initials: 'МС' },
    org: 'Nordline Ship Management',
    orgShort: 'NS',
    online: false,
    seen: 'был в сети 2 ч назад',
    job: 1,
    origin: 'applied',
    unread: 0,
    readUpTo: 2,
    time: 'вчера',
    messages: [
      { kind: 'day', text: '30 октября' },
      { kind: 'event', event: 'applied', time: '09:12' },
      { kind: 'day', text: 'Вчера' },
      { kind: 'text', from: 'them', text: 'Спасибо за отклик! Сколько месяцев у вас на контейнеровозах? В требованиях — от 6.', time: '14:48' },
      { kind: 'text', from: 'me', text: 'Пока 4 месяца на Container Ship, остальное — химовозы.', time: '15:02' },
    ],
  },
  {
    id: 'mc',
    person: null,
    org: 'Meridian Crew',
    orgShort: 'MC',
    online: false,
    job: 2,
    origin: 'applied',
    unread: 0,
    readUpTo: -1,
    time: '09:30',
    messages: [
      { kind: 'day', text: 'Сегодня' },
      { kind: 'event', event: 'applied', time: '09:30' },
    ],
  },
]

/** Чат, що з'являється після підтвердження інтересу до пропозиції Atlas (p10 → «Мне интересно»). */
export const OFFER_CHAT: Chat = {
  id: 'am',
  person: { name: 'Ахмед Карими', initials: 'АК' },
  org: 'Atlas Marine Services',
  orgShort: 'AM',
  online: true,
  job: 3,
  origin: 'offer',
  unread: 0,
  readUpTo: -1,
  time: 'сейчас',
  messages: [
    { kind: 'day', text: 'Сегодня' },
    { kind: 'text', from: 'them', text: 'Здравствуйте! Ищем 3rd Engineer на газовоз LPG Atlas Star, посадка 20.12. По профилю вы подходите — интересно обсудить?', time: '08:50' },
    { kind: 'event', event: 'offer', time: 'сейчас' },
  ],
}

/** Чат після відгуку на вакансію зі списку (ключ bag job.applied, екран вакансії). */
export function appliedChat(job: number, org: string, orgShort: string): Chat {
  return {
    id: `job-${job}`,
    person: null,
    org,
    orgShort,
    online: false,
    job,
    origin: 'applied',
    unread: 0,
    readUpTo: -1,
    time: 'сейчас',
    messages: [
      { kind: 'day', text: 'Сегодня' },
      { kind: 'event', event: 'applied', time: 'сейчас' },
    ],
  }
}

/* ---------- сповіщення (правка №22: «Рабочие» і «Нерабочие») ---------- */

export type NotifKind = 'offer' | 'reply' | 'confirmed' | 'jobs' | 'doc' | 'comment' | 'like'

export type AppNotif = {
  id: string
  tab: 'work' | 'other'
  kind: NotifKind
  /** текст; **жирне** — у подвійних зірочках */
  text: string
  time: string
  unread: boolean
  /** куди веде тап */
  to?: string
  chat?: string
  post?: string
}

export const NOTIFS: AppNotif[] = [
  { id: 'offer-am', tab: 'work', kind: 'offer', text: '**Ахмед Карими**, Atlas Marine Services, предлагает работу', time: '15 мин', unread: true },
  { id: 'reply-ns', tab: 'work', kind: 'reply', text: '**Nordline Ship Management** ответили на ваш отклик', time: 'вчера', unread: true, to: 'm-chat', chat: 'ns' },
  { id: 'jobs', tab: 'work', kind: 'jobs', text: '2 новые вакансии по подборке «3rd Engineer, от $4 000 / мес»', time: '5 ч', unread: false, to: 'p05' },
  { id: 'med', tab: 'work', kind: 'doc', text: '**Медосмотр истекает через 20 дней.** Обновите документ, чтобы не терять предложения.', time: 'вчера', unread: false, to: 'p02' },
  { id: 'conf-bw', tab: 'work', kind: 'confirmed', text: 'Вы подтвердили интерес к предложению **BlueWave Crewing**. Чат — в «Сообщениях»', time: '31.10', unread: false, to: 'm-chat', chat: 'bw' },
  { id: 'cmt', tab: 'other', kind: 'comment', text: '**Марко Петров** ответил на ваш комментарий', time: '2 ч', unread: true, to: 'p07', post: 'u1' },
  { id: 'like1', tab: 'other', kind: 'like', text: '**Ирина Бондарь** и ещё 7 моряков отметили ваш комментарий', time: 'вчера', unread: false, to: 'p07', post: 'u2' },
  { id: 'like2', tab: 'other', kind: 'like', text: '**Олегу Коваленко** понравилась ваша публикация', time: '2 дня', unread: false, to: 'p07', post: 'u3' },
]

/** Пропозиція рекрутера, яку моряк підтверджує однією кнопкою (відповідь 110: захист від випадкового кліку). */
export const OFFER = {
  id: 'offer-am',
  chat: 'am',
  job: 3,
  text: 'Ищем 3rd Engineer на газовоз LPG Atlas Star, посадка 20.12. По профилю вы подходите — интересно обсудить?',
}

/* ---------- типи сповіщень для налаштувань (відповіді 108, 109) ---------- */

export const NOTIF_TYPES: { id: string; tab: 'work' | 'other'; title: string; sub?: string }[] = [
  { id: 'offers', tab: 'work', title: 'Предложения от рекрутеров', sub: 'Рекрутер нашёл вас в базе' },
  { id: 'messages', tab: 'work', title: 'Сообщения от рекрутеров' },
  { id: 'applications', tab: 'work', title: 'Ответы на отклики' },
  { id: 'docs', tab: 'work', title: 'Сроки документов', sub: 'За 180, 90 и 30 дней до окончания' },
  { id: 'jobs', tab: 'work', title: 'Новые вакансии по подборкам' },
  { id: 'social', tab: 'other', title: 'Реакции и комментарии', sub: 'К вашим публикациям и комментариям' },
  { id: 'birthday', tab: 'other', title: 'Поздравления с днём рождения' },
]
