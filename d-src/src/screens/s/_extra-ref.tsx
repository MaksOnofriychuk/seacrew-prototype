// Довідники для «Желаемой должности» (s11, правка п. 12): флот → типи суден, департамент → посади.
// Джерело — KB: 40-domains/reference-data (normalization-rules, reference-data-review,
// reference-data-open-questions) і field-dictionary/fields-preferences. Повний файл
// reference-data.json (369 посад, 147 типів) у код не потрапив, тому тут — представницька
// підмножина реальних назв. Підписи англійською (G1), сортування за алфавітом (G2),
// вторинні департаменти — внизу (G2), «Other» — варіант з вільним текстом (G3).
// Onshore / Office не показуємо: для нього не задано ні посад, ні типів суден (Q16).

const abc = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

export const FLEETS: Record<string, string[]> = {
  Merchant: [
    'Bulk Carrier',
    'Car Carrier / PCTC',
    'Cement Carrier',
    'Chemical Tanker',
    'Container Ship',
    'General Cargo',
    'Heavy Lift Vessel',
    'LNG Carrier',
    'LPG Carrier',
    'Oil Tanker',
    'Reefer Vessel',
    'Ro-Ro',
    'Timber Carrier',
    'Woodchip Carrier',
  ],
  Offshore: ['AHTS', 'Cable Layer', 'Diving Support Vessel', 'Drillship', 'FPSO', 'Heavy Lift Vessel', 'Jack-up Rig', 'PSV', 'Standby Vessel'],
  'Passenger / Cruise': ['Cruise Ship', 'Ferry', 'Ro-Pax'],
  Fishing: ['Reefer Vessel', 'Seiner', 'Trawler'],
}

export const FLEET_NAMES = Object.keys(FLEETS).sort(abc)

type Dept = { name: string; positions: string[]; secondary?: boolean; fleet?: string }

const DEPTS: Dept[] = [
  {
    name: 'Deck',
    positions: ['Master', 'Chief Officer', '2nd Officer', '3rd Officer', 'Deck Cadet', 'Bosun (Boatswain)', 'AB (Able Seaman)', 'OS (Ordinary Seaman)', 'Pumpman', 'DPO (Dynamic Positioning Operator)'],
  },
  {
    name: 'Engine',
    positions: ['Chief Engineer', '2nd Engineer', '3rd Engineer', '4th Engineer', 'ETO (Electro-Technical Officer)', 'Engine Cadet', 'Fitter', 'Motorman', 'Motorman / Electrician', 'Motorman / Welder', 'Oiler', 'Wiper'],
  },
  { name: 'Catering', positions: ['Chief Cook', 'Cook', 'Cook Assistant', 'Messman', 'Steward', 'AB / Cook', 'OS / Cook'] },
  { name: 'Safety / HSE', positions: ['HLO (Helicopter Landing Officer)', 'Medic', 'Safety Officer'] },
  { name: 'Fishing / Processing', positions: ['Fish Processor', 'Fisherman', 'Fishing Master'], fleet: 'Fishing' },
  { name: 'Hotel & Entertainment', positions: ['Bartender', 'Cabin Steward', 'Laundry Attendant', 'Waiter'], secondary: true, fleet: 'Passenger / Cruise' },
]

// Типи суден лише вибраних флотів; тип, що є у двох флотах, — один запис (V1).
export function typesOf(fleets: string[]) {
  return FLEET_NAMES.filter((f) => fleets.includes(f)).map((f) => ({ fleet: f, types: [...FLEETS[f]].sort(abc) }))
}

// Департаменти для вибраних флотів: «Fishing / Processing» — лише з Fishing,
// «Hotel & Entertainment» — лише з Passenger / Cruise.
export function deptsOf(fleets: string[]) {
  const list = DEPTS.filter((d) => !d.fleet || fleets.includes(d.fleet))
  return [...list.filter((d) => !d.secondary).sort((a, b) => abc(a.name, b.name)), ...list.filter((d) => d.secondary)].map((d) => d.name)
}

export function positionsOf(dept: string) {
  return [...(DEPTS.find((d) => d.name === dept)?.positions ?? [])].sort(abc)
}
