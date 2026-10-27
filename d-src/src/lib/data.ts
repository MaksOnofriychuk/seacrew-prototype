// Дані — ті самі вигадані, що у вкладці C (index.html: POSTS, JOBS). Реальних даних немає.

export type Post =
  | { id: string; kind: 'news'; pin?: boolean; title: string; text: string; time: string }
  | { id: string; kind: 'user'; av: string; name: string; role: string; time: string; text: string; photo?: boolean; likes: number; comments: number }
  | { id: string; kind: 'ad' }

export const POSTS: Post[] = [
  { id: 'n1', kind: 'news', pin: true, title: 'Crew запущен: профиль из документов за минуту', text: 'Загрузите удостоверение, диплом и CV — ИИ заполнит профиль. Анкеты агентств заполняются из профиля в один тап.', time: 'Закреплено' },
  { id: 'u1', kind: 'user', av: 'МП', name: 'Марко Петров', role: 'Chief Officer · Bulk Carrier', time: '2 ч', text: 'Закончил 6-месячный контракт на MV Nordic Star. Отличный экипаж, ротация по графику, зарплата вовремя. Спрашивайте о компании что угодно.', photo: true, likes: 24, comments: 6 },
  { id: 'ad', kind: 'ad' },
  { id: 'u2', kind: 'user', av: 'ИБ', name: 'Ирина Бондарь', role: '2nd Officer · Container Ship', time: '5 ч', text: 'Кто недавно проходил медосмотр в Одессе? Посоветуйте клинику, где делают за один день и без очередей.', likes: 8, comments: 14 },
  { id: 'n2', kind: 'news', title: 'Напоминание: сроки сертификатов STCW', text: 'Проверьте даты в разделе «Документы». Мы напомним за 60 и 30 дней до окончания срока.', time: 'вчера' },
  { id: 'u3', kind: 'user', av: 'ОК', name: 'Олег Коваленко', role: 'Master · Chemical Tanker', time: '2 дня', text: 'Совет молодым офицерам: держите сканы всех документов в одном месте и следите за сроками. Половина отказов — из-за просроченного сертификата.', likes: 61, comments: 9 },
]

export type Job = {
  t: string
  sal: string
  ship: string
  board: string
  dur: string
  co: string
  lg: string
  ago: string
  tags: string[]
  vessel: [string, string][]
  req: [string, boolean][]
  desc: string
}

export const JOBS: Job[] = [
  { t: '3rd Engineer', sal: '$4 200–4 600 / мес', ship: 'Chemical Tanker', board: '05.12.2026', dur: '4 ±1 мес', co: 'BlueWave Crewing', lg: 'BW', ago: '2 ч назад', tags: ['NEW'],
    vessel: [['Судно', 'MT Aurora Spirit'], ['Флаг', 'Malta'], ['DWT', '19 800'], ['Построено', '2018'], ['Главный двигатель', 'MAN B&W 6S46']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Опыт на Chemical Tanker от 12 мес', true], ['Действующий медосмотр', true], ['Basic Safety Training (STCW VI/1)', true], ['Шенгенская виза', false]],
    desc: 'Надёжный судовладелец, ротация 4 месяца ±1. Смены экипажа в ЕС, интернет на борту, оплата в USD без задержек.' },
  { t: '3rd Engineer', sal: '$4 000 / мес', ship: 'Container Ship', board: 'как можно скорее', dur: '6 мес', co: 'Nordline Ship Management', lg: 'NS', ago: '5 ч назад', tags: ['NEW', 'Срочно'],
    vessel: [['Судно', 'MV Baltic Way'], ['Флаг', 'Liberia'], ['TEU', '4 200'], ['Построено', '2015']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Опыт на Container Ship от 6 мес', false], ['Действующий медосмотр', true]],
    desc: 'Срочная замена. Линия Европа — Азия, экипаж смешанный.' },
  { t: '4th Engineer', sal: 'Договорная', ship: 'Oil Tanker', board: '15.12.2026', dur: '4 мес', co: 'Meridian Crew', lg: 'MC', ago: '1 д назад', tags: [],
    vessel: [['Судно', 'MT North Pearl'], ['Флаг', 'Marshall Islands'], ['DWT', '45 000']],
    req: [['Английский — средний (A2+)', true], ['Диплом 4th Engineer', true], ['Действующий медосмотр', true]],
    desc: 'Подойдёт кандидатам, которые хотят опыт на танкерах.' },
  { t: '3rd Engineer', sal: '$4 500 / мес', ship: 'LPG Carrier', board: '20.12.2026', dur: '5 мес', co: 'Atlas Marine Services', lg: 'AM', ago: '2 д назад', tags: [],
    vessel: [['Судно', 'LPG Atlas Star'], ['Флаг', 'Panama'], ['CBM', '22 000']],
    req: [['Английский — хороший (B1+)', true], ['Диплом 3rd Engineer (III/1)', true], ['Gas Tanker Familiarization', false], ['Действующий медосмотр', true]],
    desc: 'Газовоз, ротация 5 месяцев, бонус за продление.' },
]

// Що саме гість хоче зробити — для «Зарегистрируйтесь, чтобы…» (тексти з C).
export const GATE_TEXT: Record<string, string> = {
  apply: 'откликнуться на вакансию',
  msg: 'написать агентству',
  react: 'ставить отметки и писать комментарии',
  docs: 'хранить документы',
  post: 'публиковать',
  save: 'сохранять вакансии',
  inbox: 'получать анкеты и сообщения',
  profile: 'создать профиль',
}
