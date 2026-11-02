// Дані покрокової реєстрації (зона s*). Лише довідники для прототипу.

/** Аеропорти для «Ближайший аэропорт» (s12, відповідь замовника 48): місто, назва, код IATA, латиницею (для пошуку), країна. */
export type Airport = { city: string; name?: string; code: string; /** латиницею — для пошуку */ en: string; country: string }

export const AIRPORTS: Airport[] = [
  { city: 'Одесса', code: 'ODS', en: 'Odesa', country: 'Украина' },
  { city: 'Киев', name: 'Борисполь', code: 'KBP', en: 'Kyiv Boryspil', country: 'Украина' },
  { city: 'Львов', code: 'LWO', en: 'Lviv', country: 'Украина' },
  { city: 'Херсон', code: 'KHE', en: 'Kherson', country: 'Украина' },
  { city: 'Кишинёв', code: 'KIV', en: 'Chisinau', country: 'Молдова' },
  { city: 'Яссы', code: 'IAS', en: 'Iasi', country: 'Румыния' },
  { city: 'Бухарест', name: 'Отопени', code: 'OTP', en: 'Bucharest Otopeni', country: 'Румыния' },
  { city: 'Констанца', code: 'CND', en: 'Constanta', country: 'Румыния' },
  { city: 'Варна', code: 'VAR', en: 'Varna', country: 'Болгария' },
  { city: 'Бургас', code: 'BOJ', en: 'Burgas', country: 'Болгария' },
  { city: 'Стамбул', code: 'IST', en: 'Istanbul', country: 'Турция' },
  { city: 'Варшава', name: 'Шопен', code: 'WAW', en: 'Warsaw Chopin', country: 'Польша' },
  { city: 'Краков', code: 'KRK', en: 'Krakow', country: 'Польша' },
  { city: 'Гданьск', code: 'GDN', en: 'Gdansk', country: 'Польша' },
  { city: 'Жешув', code: 'RZE', en: 'Rzeszow', country: 'Польша' },
  { city: 'Рига', code: 'RIX', en: 'Riga', country: 'Латвия' },
  { city: 'Таллин', code: 'TLL', en: 'Tallinn', country: 'Эстония' },
  { city: 'Вильнюс', code: 'VNO', en: 'Vilnius', country: 'Литва' },
  { city: 'Гамбург', code: 'HAM', en: 'Hamburg', country: 'Германия' },
  { city: 'Амстердам', name: 'Схипхол', code: 'AMS', en: 'Amsterdam Schiphol', country: 'Нидерланды' },
  { city: 'Афины', code: 'ATH', en: 'Athens', country: 'Греция' },
  { city: 'Дубай', code: 'DXB', en: 'Dubai', country: 'ОАЭ' },
  { city: 'Сингапур', name: 'Чанги', code: 'SIN', en: 'Singapore Changi', country: 'Сингапур' },
  { city: 'Манила', code: 'MNL', en: 'Manila', country: 'Филиппины' },
  { city: 'Мумбаи', code: 'BOM', en: 'Mumbai', country: 'Индия' },
]

export const airportLabel = (a: Airport) => `${a.city}${a.name ? ', ' + a.name : ''} (${a.code})`
