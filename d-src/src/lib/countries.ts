// Країни для полів «Гражданство», «Страна выдачи», «Флаг» тощо. Назви — як у документах прототипу (російською),
// англійська — для пошуку і для англомовного CV. Прапори суден (Liberia, Malta, Panama…) теж тут.
export type Country = { ru: string; en: string }

export const COUNTRIES: Country[] = [
  { ru: 'Австралия', en: 'Australia' },
  { ru: 'Азербайджан', en: 'Azerbaijan' },
  { ru: 'Антигуа и Барбуда', en: 'Antigua and Barbuda' },
  { ru: 'Багамы', en: 'Bahamas' },
  { ru: 'Бангладеш', en: 'Bangladesh' },
  { ru: 'Бельгия', en: 'Belgium' },
  { ru: 'Белиз', en: 'Belize' },
  { ru: 'Болгария', en: 'Bulgaria' },
  { ru: 'Бразилия', en: 'Brazil' },
  { ru: 'Великобритания', en: 'United Kingdom' },
  { ru: 'Вьетнам', en: 'Vietnam' },
  { ru: 'Гана', en: 'Ghana' },
  { ru: 'Германия', en: 'Germany' },
  { ru: 'Гибралтар', en: 'Gibraltar' },
  { ru: 'Гонконг', en: 'Hong Kong' },
  { ru: 'Греция', en: 'Greece' },
  { ru: 'Грузия', en: 'Georgia' },
  { ru: 'Дания', en: 'Denmark' },
  { ru: 'Египет', en: 'Egypt' },
  { ru: 'Индия', en: 'India' },
  { ru: 'Индонезия', en: 'Indonesia' },
  { ru: 'Ирландия', en: 'Ireland' },
  { ru: 'Испания', en: 'Spain' },
  { ru: 'Италия', en: 'Italy' },
  { ru: 'Казахстан', en: 'Kazakhstan' },
  { ru: 'Канада', en: 'Canada' },
  { ru: 'Кипр', en: 'Cyprus' },
  { ru: 'Китай', en: 'China' },
  { ru: 'Латвия', en: 'Latvia' },
  { ru: 'Либерия', en: 'Liberia' },
  { ru: 'Литва', en: 'Lithuania' },
  { ru: 'Малайзия', en: 'Malaysia' },
  { ru: 'Мальта', en: 'Malta' },
  { ru: 'Маршалловы Острова', en: 'Marshall Islands' },
  { ru: 'Мьянма', en: 'Myanmar' },
  { ru: 'Нигерия', en: 'Nigeria' },
  { ru: 'Нидерланды', en: 'Netherlands' },
  { ru: 'Норвегия', en: 'Norway' },
  { ru: 'ОАЭ', en: 'United Arab Emirates' },
  { ru: 'Остров Мэн', en: 'Isle of Man' },
  { ru: 'Пакистан', en: 'Pakistan' },
  { ru: 'Панама', en: 'Panama' },
  { ru: 'Польша', en: 'Poland' },
  { ru: 'Португалия', en: 'Portugal' },
  { ru: 'Республика Корея', en: 'South Korea' },
  { ru: 'Молдова', en: 'Moldova' },
  { ru: 'Румыния', en: 'Romania' },
  { ru: 'Сент-Винсент и Гренадины', en: 'Saint Vincent and the Grenadines' },
  { ru: 'Сингапур', en: 'Singapore' },
  { ru: 'США', en: 'United States' },
  { ru: 'Турция', en: 'Turkey' },
  { ru: 'Украина', en: 'Ukraine' },
  { ru: 'Филиппины', en: 'Philippines' },
  { ru: 'Финляндия', en: 'Finland' },
  { ru: 'Франция', en: 'France' },
  { ru: 'Хорватия', en: 'Croatia' },
  { ru: 'Черногория', en: 'Montenegro' },
  { ru: 'Швеция', en: 'Sweden' },
  { ru: 'Шри-Ланка', en: 'Sri Lanka' },
  { ru: 'Эстония', en: 'Estonia' },
  { ru: 'Япония', en: 'Japan' },
].sort((a, b) => a.ru.localeCompare(b.ru, 'ru'))

const BY_EN = new Map(COUNTRIES.map((c) => [c.en.toLowerCase(), c.ru]))

// Значення може прийти англійською (прапор у контракті — «Malta»): показуємо російською, як у списку.
export function countryLabel(v: string) {
  return BY_EN.get(v.trim().toLowerCase()) ?? v
}

export function findCountries(q: string) {
  const n = q.trim().toLowerCase()
  if (!n) return COUNTRIES
  return COUNTRIES.filter((c) => c.ru.toLowerCase().includes(n) || c.en.toLowerCase().includes(n))
}
