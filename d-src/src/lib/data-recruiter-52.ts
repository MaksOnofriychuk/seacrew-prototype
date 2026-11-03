// Додаткові вигадані рядки для веб-рекрутера (правка №52): щоб у пошуку, вакансіях і відгуках було 2–3 сторінки.
// Підмішуються в кінець SEAFARERS / WEB_JOBS / APPLICATIONS у data-web.ts. Реальних людей немає.
import type { Application, WebJob, WebSeafarer } from './data-web'

const STCW = ['Basic Safety Training (STCW VI/1)', 'Proficiency in Survival Craft', 'Advanced Fire Fighting', 'Medical First Aid']
const MED = { title: 'Медицинский сертификат (ILO/STCW)', until: '2027-05-20' }

type S = [id: string, name: string, pos: string, fleet: string, dep: string, months: number | null, nat: string, airport: string, visas: string[], av: WebSeafarer['availability'], eng: WebSeafarer['englishLevel'], extra: string[]]

const S_ROWS: S[] = [
  ['sf13', 'Taras L.', 'Chief Officer', 'Merchant', 'Deck', 90, 'Украина', 'Кишинёв (KIV)', ['Шенген'], { kind: 'now' }, 'B2', ['ECDIS']],
  ['sf14', 'Ricardo N.', 'Cook', 'Merchant', 'Catering', 42, 'Филиппины', 'Манила (MNL)', [], { kind: 'from', date: '2026-12-05' }, 'B2', ['Food Hygiene']],
  ['sf15', 'Sergei V.', '3rd Engineer', 'Merchant', 'Engine', 33, 'Грузия', 'Тбилиси (TBS)', ['Шенген'], { kind: 'now' }, 'B1', ['ECDIS']],
  ['sf16', 'Aleksei F.', 'AB (Able Seaman)', 'Merchant', 'Deck', 61, 'Украина', 'Варшава (WAW)', ['Шенген'], { kind: 'now' }, 'B1', []],
  ['sf17', 'Hamza K.', 'Motorman', 'Merchant', 'Engine', 18, 'Египет', 'Каир (CAI)', [], { kind: 'now' }, 'A2', []],
  ['sf18', 'Stefan M.', '2nd Officer', 'Offshore', 'Deck', 52, 'Румыния', 'Бухарест (OTP)', ['Шенген', 'Великобритания'], { kind: 'from', date: '2027-01-20' }, 'C1', ['BOSIET', 'DP Induction']],
  ['sf19', 'Arjun P.', '2nd Engineer', 'Merchant', 'Engine', 77, 'Индия', 'Мумбаи (BOM)', ['Шенген'], { kind: 'now' }, 'C1', ['Tanker Familiarization']],
  ['sf20', 'Luka J.', 'Bosun (Boatswain)', 'Merchant', 'Deck', 104, 'Хорватия', 'Сплит (SPU)', ['Шенген'], { kind: 'from', date: '2026-12-12' }, 'B1', []],
  ['sf21', 'Pavlo R.', 'Master', 'Merchant', 'Deck', 183, 'Украина', 'Кишинёв (KIV)', ['Шенген', 'США C1/D'], { kind: 'not' }, 'C1', ['ECDIS', 'Ship Security Officer']],
  ['sf22', 'Emre D.', 'Chief Engineer', 'Merchant', 'Engine', 146, 'Турция', 'Стамбул (IST)', ['Шенген'], { kind: 'from', date: '2027-02-15' }, 'B2', ['ECDIS']],
  ['sf23', 'Kristaps Z.', 'Senior DPO', 'Offshore', 'Deck', 88, 'Латвия', 'Рига (RIX)', ['Шенген', 'Великобритания'], { kind: 'now' }, 'C1', ['DP Unlimited', 'BOSIET']],
  ['sf24', 'Vasil G.', 'Fitter', 'Merchant', 'Engine', 26, 'Болгария', 'Варна (VAR)', ['Шенген'], { kind: 'now' }, 'B1', []],
  ['sf25', 'Joao T.', 'Steward', 'Passenger / Cruise', 'Catering', 15, 'Филиппины', 'Манила (MNL)', [], { kind: 'now' }, 'B2', ['Crowd Management']],
  ['sf26', 'Maksym H.', 'Chief Cook', 'Merchant', 'Catering', 59, 'Украина', 'Варшава (WAW)', ['Шенген'], { kind: 'from', date: '2026-12-20' }, 'B1', ['Ship Cook Certificate']],
  ['sf27', 'Dario C.', '3rd Officer', 'Merchant', 'Deck', 25, 'Хорватия', 'Загреб (ZAG)', ['Шенген'], { kind: 'now' }, 'B2', ['ECDIS']],
  ['sf28', 'Anton B.', 'Electrician', 'Offshore', 'Engine', 67, 'Польша', 'Гданьск (GDN)', ['Шенген', 'Великобритания'], { kind: 'not' }, 'B2', ['High Voltage', 'BOSIET']],
]

export const EXTRA_SEAFARERS: WebSeafarer[] = S_ROWS.map(([id, name, position, fleet, department, experienceMonths, nationality, airport, visas, availability, englishLevel, extra], i) => ({
  id,
  name,
  initials: name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2),
  position,
  fleet,
  department,
  experienceMonths,
  nationality,
  airport,
  visas,
  availability,
  englishLevel,
  certificates: [...STCW, ...extra],
  diplomas: [],
  medical: MED,
  promotions: i % 3 === 0,
  about: 'Ищу контракт по своей должности, документы действующие.',
  updated: `2026-10-${String(10 + (i % 20)).padStart(2, '0')}`,
}))

type J = [id: string, pos: string, fleet: string, dep: string, vt: string, vn: string, amount: string, cur: '$' | '€' | '£', period: 'день' | 'месяц', region: WebJob['region'], board: string, dur: string, status: WebJob['status'], rc: string, created: string]

const J_ROWS: J[] = [
  ['j07', '2nd Engineer', 'Merchant', 'Engine', 'LPG Carrier', 'MV Gas Pioneer', '6 300', '$', 'месяц', 'Европа', '2026-12-18', '5 мес.', 'open', 'rc1', '2026-10-31'],
  ['j08', 'AB (Able Seaman)', 'Merchant', 'Deck', 'Container Ship', 'MV Baltic Way', '1 650', '$', 'месяц', 'ОАЭ', '2026-12-02', '6 мес.', 'open', 'rc2', '2026-10-29'],
  ['j09', 'Master', 'Merchant', 'Deck', 'Chemical Tanker', 'MT Aurora Spirit', '11 200', '$', 'месяц', 'Европа', '2027-01-08', '3 мес.', 'open', 'rc1', '2026-10-27'],
  ['j10', 'Motorman', 'Merchant', 'Engine', 'Oil Tanker', 'MT Cape Horizon', '1 450', '$', 'месяц', 'Африка', '2026-11-28', '6 мес.', 'open', 'rc3', '2026-10-26'],
  ['j11', 'Senior DPO', 'Offshore', 'Deck', 'PSV', 'Sea Harrier', '520', '€', 'день', 'Европа', '2026-12-08', '4 недели', 'open', 'rc1', '2026-11-01'],
  ['j12', 'Cook', 'Merchant', 'Catering', 'Bulk Carrier', 'MV Nordic Star', '1 800', '$', 'месяц', 'ОАЭ', '2026-12-14', '6 мес.', 'open', 'rc2', '2026-10-24'],
  ['j13', 'Chief Engineer', 'Merchant', 'Engine', 'Bulk Carrier', 'MV Nordic Star', '9 800', '$', 'месяц', 'ОАЭ', '2027-01-05', '4 мес.', 'open', 'rc1', '2026-10-23'],
  ['j14', '3rd Officer', 'Merchant', 'Deck', 'Container Ship', 'MV Baltic Way', '3 100', '$', 'месяц', 'Европа', '2026-12-22', '6 мес.', 'draft', 'rc3', '2026-11-02'],
  ['j15', 'Electrician', 'Offshore', 'Engine', 'AHTS', 'Ocean Titan', '340', '£', 'день', 'Африка', '2027-01-25', '5 недель', 'draft', 'rc3', '2026-11-02'],
  ['j16', 'Bosun (Boatswain)', 'Merchant', 'Deck', 'Oil Tanker', 'MT Cape Horizon', '2 700', '$', 'месяц', 'Африка', '2026-11-20', '6 мес.', 'closed', 'rc2', '2026-09-18'],
  ['j17', 'Steward', 'Passenger / Cruise', 'Catering', 'Cruise Ship', 'Aegean Pearl', '1 900', '€', 'месяц', 'Европа', '2026-11-12', '6 мес.', 'closed', 'rc1', '2026-09-10'],
  ['j18', '3rd Engineer', 'Merchant', 'Engine', 'LPG Carrier', 'MV Gas Pioneer', '4 400', '$', 'месяц', 'Европа', '2027-01-12', '4 ±1 мес.', 'open', 'rc2', '2026-10-30'],
  ['j19', 'Chief Officer', 'Offshore', 'Deck', 'PSV', 'Sea Harrier', '620', '€', 'день', 'Европа', '2026-12-30', '4 недели', 'open', 'rc1', '2026-10-22'],
  ['j20', 'Chief Cook', 'Passenger / Cruise', 'Catering', 'Cruise Ship', 'Aegean Pearl', '3 000', '€', 'месяц', 'Европа', '2027-01-18', '6 мес.', 'open', 'rc3', '2026-10-20'],
  ['j21', 'Fitter', 'Merchant', 'Engine', 'Bulk Carrier', 'MV Nordic Star', '2 600', '$', 'месяц', 'ОАЭ', '2026-12-26', '6 мес.', 'open', 'rc2', '2026-10-19'],
  ['j22', 'ETO (Electro-Technical Officer)', 'Merchant', 'Engine', 'Container Ship', 'MV Baltic Way', '5 600', '$', 'месяц', 'Европа', '2027-01-30', '4 мес.', 'open', 'rc1', '2026-10-18'],
]

export const EXTRA_JOBS: WebJob[] = J_ROWS.map(([id, position, fleet, department, vesselType, vesselName, amount, currency, period, region, board, duration, status, recruiterId, created]) => ({
  id,
  position,
  fleet,
  department,
  vesselType,
  vesselName,
  salary: { amount, currency, period },
  region,
  board,
  duration,
  status,
  recruiterId,
  created,
  description: 'Условия и документы — в описании вакансии.',
}))

// jobId, seafarerId, status, date
const A_ROWS: [string, string, Application['status'], string][] = [
  ['j07', 'sf19', 'waiting', '2026-11-02'],
  ['j07', 'sf10', 'sent', '2026-11-02'],
  ['j08', 'sf16', 'match', '2026-10-31'],
  ['j08', 'sf03', 'waiting', '2026-10-30'],
  ['j09', 'sf21', 'rejected', '2026-10-29'],
  ['j09', 'sf12', 'waiting', '2026-10-28'],
  ['j10', 'sf17', 'sent', '2026-11-01'],
  ['j10', 'sf08', 'match', '2026-10-30'],
  ['j11', 'sf23', 'match', '2026-11-02'],
  ['j11', 'sf05', 'waiting', '2026-11-01'],
  ['j12', 'sf14', 'rejected', '2026-10-27'],
  ['j12', 'sf11', 'waiting', '2026-10-26'],
  ['j13', 'sf22', 'waiting', '2026-10-28'],
  ['j13', 'sf06', 'rejected', '2026-10-25'],
  ['j18', 'sf15', 'sent', '2026-11-02'],
  ['j18', 'sf01', 'waiting', '2026-10-31'],
  ['j19', 'sf13', 'waiting', '2026-10-29'],
  ['j19', 'sf02', 'match', '2026-10-28'],
  ['j20', 'sf26', 'match', '2026-10-27'],
  ['j21', 'sf24', 'rejected', '2026-10-24'],
  ['j22', 'sf04', 'waiting', '2026-10-26'],
  ['j03', 'sf18', 'rejected', '2026-10-28'],
]

export const EXTRA_APPLICATIONS: Application[] = A_ROWS.map(([jobId, seafarerId, status, date], i) => ({ id: `ap${11 + i}`, jobId, seafarerId, status, date }))
