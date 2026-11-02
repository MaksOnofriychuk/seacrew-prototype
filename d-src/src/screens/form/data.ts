import { useProto } from '@/lib/proto-state'
import { FORM_DEFAULTS, type QForm } from '../q/_parts'
import type { Acct } from '../q/q06'

// Анкета BlueWave Crewing для моряка: розділи й написи — як у бланку агентства (ADR-073 п. 7, 19:
// назви розділів і полів не перекладаємо й не переіменовуємо). Розділи — ті самі, що бачить рекрутер
// у r-form-edit (FORM_DEFS.f01), без розділу «Оценка агентства» (лише для агентства).
// Дані вигадані.

/** Звідки значення (ADR-077 п. 6: профіль → документ → резюме → минулі відповіді). */
export type SrcKind = 'profile' | 'doc' | 'cv' | 'past'
export type Src = { kind: SrcKind; label: string; value: string; /** профіль без підтвердження документом */ unproved?: boolean }

/** Збережена відповідь з іншим написом або розділом — лише пропозиція (ADR-073 п. 16.1). */
export type Suggestion = { question: string; section: string; org: string; value: string }

export type QKind = 'text' | 'textarea' | 'photo' | 'table' | 'consent' | 'signature'

export type Question = {
  id: string
  label: string
  kind: QKind
  required?: boolean
  mono?: boolean
  placeholder?: string
  /** «Нужно подтверждение документом» (registration-spec §9, FormField.requiresDocumentProof) */
  proof?: boolean
  /** відповідь можна зберегти в профіль (ADR-051: не документи) */
  savable?: boolean
  sources: Src[]
  suggestion?: Suggestion
  /** пояснення у вікні вибору, коли значень кілька */
  ask?: string
  numeric?: boolean
}

export type Section = { id: string; title: string; sub: string; questions: Question[] }

/* ---------- таблиця «Контракты за 5 лет» ---------- */

export type ContractRow = { id: string; vessel: string; type: string; rank: string; period: string; engine: string }

export const CONTRACT_COLS: { key: keyof Omit<ContractRow, 'id'>; label: string; mono?: boolean; placeholder?: string }[] = [
  { key: 'vessel', label: 'Судно' },
  { key: 'type', label: 'Тип судна' },
  { key: 'rank', label: 'Должность' },
  { key: 'period', label: 'Период', mono: true, placeholder: 'ММ.ГГГГ – ММ.ГГГГ' },
  { key: 'engine', label: 'Главный двигатель' },
]

// Рядки зі списку контрактів профілю (ті самі судна, що в кроці «Опыт работы» реєстрації).
// В останнього контракту в профілі немає двигуна — рядок неповний.
export const PROFILE_CONTRACTS: ContractRow[] = [
  { id: 'c1', vessel: 'MV Example Crest', type: 'Tanker', rank: '3rd Engineer', period: '11.2024 – 06.2025', engine: 'MAN B&W 6G50' },
  { id: 'c2', vessel: 'MV Example Star', type: 'Container Ship', rank: '3rd Engineer', period: '02.2024 – 09.2024', engine: 'MAN B&W 6S46' },
  { id: 'c3', vessel: 'MV Example Wave', type: 'Bulk Carrier', rank: '4th Engineer', period: '05.2022 – 12.2023', engine: '' },
]

export const rowMissing = (r: ContractRow) => CONTRACT_COLS.filter((c) => !r[c.key].trim()).map((c) => c.label)

/* ---------- анкета ---------- */

export const FORM_ORG = 'BlueWave Crewing'
export const FORM_TITLE = 'Анкета BlueWave Crewing'
export const FORM_DUE = '08.11.2026'

export function useFormDef(empty: boolean): Section[] {
  const { bag } = useProto()
  const f: QForm = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const email = bag<Acct | null>('q.acct', null)?.email || 'you@example.com'
  const profile = 'Из профиля'
  const sid = 'Из документа: Удостоверение моряка'
  // «Пусто» з панелі: у профілі ще нічого немає — джерел немає ні в кого
  const s = (list: Src[]) => (empty ? [] : list)

  return [
    {
      id: 'personal',
      title: 'Личные данные',
      sub: 'Как в документах. Размеры — для спецодежды.',
      questions: [
        { id: 'last', label: 'Фамилия', kind: 'text', required: true, savable: true, sources: s([{ kind: 'doc', label: sid, value: String(f.last) }]) },
        { id: 'first', label: 'Имя', kind: 'text', required: true, savable: true, sources: s([{ kind: 'doc', label: sid, value: String(f.first) }]) },
        { id: 'birth', label: 'Дата рождения', kind: 'text', mono: true, required: true, savable: true, placeholder: 'ДД.ММ.ГГГГ', sources: s([{ kind: 'doc', label: sid, value: String(f.birth) }]) },
        // профіль і документ збігаються — підставляємо з профілю (вищий пріоритет), вибору немає
        {
          id: 'cit',
          label: 'Гражданство',
          kind: 'text',
          required: true,
          savable: true,
          sources: s([
            { kind: 'profile', label: profile, value: String(f.cit) },
            { kind: 'doc', label: sid, value: String(f.cit) },
          ]),
        },
        { id: 'photo', label: 'Фото на документы', kind: 'photo', required: true, sources: s([{ kind: 'profile', label: profile, value: 'Фото 3×4' }]) },
        // той самий напис і той самий розділ, що й у минулій анкеті, — підставляється «из профиля» (16.1)
        { id: 'coverall', label: 'Размер комбинезона', kind: 'text', savable: true, sources: s([{ kind: 'profile', label: profile, value: '52' }]) },
        // інший напис і розділ — лише пропозиція з «Использовать»
        {
          id: 'shoes',
          label: 'Размер обуви',
          kind: 'text',
          mono: true,
          numeric: true,
          savable: true,
          sources: [],
          suggestion: empty ? undefined : { question: 'Shoe size', section: 'Снаряжение', org: 'Meridian Crew', value: '43' },
        },
      ],
    },
    {
      id: 'contacts',
      title: 'Контакты',
      sub: 'Куда агентству звонить и откуда вас отправлять.',
      questions: [
        { id: 'phone', label: 'Телефон', kind: 'text', mono: true, required: true, savable: true, sources: s([{ kind: 'profile', label: profile, value: String(f.phone) }]) },
        { id: 'email', label: 'Email', kind: 'text', savable: true, sources: s([{ kind: 'profile', label: profile, value: email }]) },
        // різні значення в профілі й у минулій анкеті — моряк вибирає, нічого не змішуємо (ADR-077 п. 6)
        {
          id: 'airport',
          label: 'Ближайший аэропорт',
          kind: 'text',
          required: true,
          savable: true,
          ask: 'Есть в профиле и в вашей прежней анкете. Выберите, что отправить:',
          sources: s([
            { kind: 'profile', label: profile, value: 'Одесса (ODS)' },
            { kind: 'past', label: 'Из вашей анкеты для Nordline', value: 'Кишинёв (KIV)' },
          ]),
        },
        { id: 'nok', label: 'Контакт на случай ЧС', kind: 'text', required: true, savable: true, sources: s([{ kind: 'profile', label: profile, value: 'Ольга Коваль, жена, +380 00 000 0001' }]) },
      ],
    },
    {
      id: 'docs',
      title: 'Документы',
      sub: 'Номера и сроки. Где нужно — с подтверждением.',
      questions: [
        {
          id: 'sid',
          label: 'Паспорт моряка',
          kind: 'text',
          required: true,
          ask: 'Есть в 2 ваших документах. Выберите тот, о котором вопрос:',
          sources: s([
            { kind: 'doc', label: sid, value: `${f.docNum}, до ${f.docExp}` },
            { kind: 'doc', label: 'Из документа: Мореходная книжка', value: 'MK 004512, до 03.09.2030' },
          ]),
        },
        {
          id: 'coc',
          label: 'Диплом (CoC)',
          kind: 'text',
          required: true,
          proof: true,
          sources: s([{ kind: 'doc', label: 'Из документа: Диплом', value: `${f.dipRank}, ${f.dipStcw}, до ${f.dipExp}` }]),
        },
        // медичні документи вносяться вручну (ADR-090) — значення з профілю не підтверджене документом
        {
          id: 'medical',
          label: 'Медицинский сертификат, действует до',
          kind: 'text',
          mono: true,
          required: true,
          proof: true,
          placeholder: 'ДД.ММ.ГГГГ',
          sources: s([{ kind: 'profile', label: 'Из профиля, без документа', value: '30.06.2027', unproved: true }]),
        },
        { id: 'bst', label: 'Basic Safety Training', kind: 'text', sources: s([{ kind: 'doc', label: 'Из документа: Сертификат BST', value: 'STCW VI/1, до 15.03.2029' }]) },
      ],
    },
    {
      id: 'service',
      title: 'Морской стаж',
      sub: 'Строки — из ваших контрактов в профиле.',
      questions: [
        { id: 'contracts', label: 'Контракты за 5 лет', kind: 'table', required: true, savable: true, sources: s([{ kind: 'profile', label: profile, value: '' }]) },
        { id: 'engines', label: 'Типы главных двигателей', kind: 'textarea', savable: true, placeholder: 'Например, MAN B&W, Wärtsilä', sources: [] },
      ],
    },
    {
      id: 'sign',
      title: 'Согласие и подпись',
      sub: 'Последний раздел бланка.',
      questions: [
        { id: 'gdpr', label: 'Согласие на обработку данных', kind: 'consent', required: true, sources: [] },
        { id: 'signature', label: 'Подпись', kind: 'signature', required: true, sources: [] },
      ],
    },
  ]
}
