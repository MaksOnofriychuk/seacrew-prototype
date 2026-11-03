import { useEffect } from 'react'
import { Info, Lock, Ship } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CountryPick, DatePick, MonthRangePick } from '@/components/app/pickers'
import { BOUNDS } from '@/lib/dates'
import type { ScreenProps } from '../registry'
import { CheckRow, contractsText, DOC_TYPES, durText, Field, FlowScreen, Footer, FORM_DEFAULTS, Hint, months, Note, TextInput, Title, type DocTypeId, type QForm, type TagKind, useQ } from './_parts'

// q05 — перевірка прочитаного. Групи: личные данные, документ моряка, диплом, морской стаж.
// Правки пп. 5–6: «Название документа» — перше поле в обох документах; у «Диплом» після
// «Должность по диплому» — «Правило STCW» і «Уровень» (з документа, можна виправити).
// Правка №14 — новий підзаголовок; №3 — у підсумку стажу «контракты», не «рейсы».
export const STCW_RULES = ['II/1', 'II/2', 'II/3', 'III/1', 'III/2', 'III/3', 'III/4', 'III/5', 'III/6']
export const STCW_LEVELS = ['Management', 'Operational', 'Support']

type Manual = { name: string; num: string; issue: string; exp: string; country: string; file: boolean }
type FormState = { v: QForm; orig: QForm; manual: boolean; src: string }

const CV_KEYS = ['cit', 'phone', 'vessel1', 'vessel2']
const MANUAL_KEYS = ['docName', 'docNum', 'docIssue', 'docExp', 'docCountry']
const NO_TAG = ['rank1', 'per1', 'rank2', 'per2']

const srcKey = (manual: Manual | null, noName: boolean) => JSON.stringify({ manual, noName })

function initForm(manual: Manual | null, noName: boolean): FormState {
  const v: QForm = { ...FORM_DEFAULTS }
  if (manual) {
    // Як 'manual-done' у C: дані документа — з ручного введення, ім'я і дата народження — порожні.
    Object.assign(v, { first: '', last: '', birth: '', docName: manual.name, docNum: manual.num, docIssue: manual.issue, docExp: manual.exp, docCountry: manual.country })
  } else if (noName) {
    Object.assign(v, { first: '', last: '' })
  }
  return { v, orig: { ...v }, manual: !!manual, src: srcKey(manual, noName) }
}

export function Q05Check({ go }: ScreenProps) {
  const { state, bag, setBag } = useQ()
  const type = state.docType as DocTypeId
  const manualData = bag<Manual | null>('q.manual', null)
  const nameless = state.scenario === 'noName'
  // Збережену форму беремо, лише якщо вона з того самого джерела (не після нового ручного введення чи сценарію).
  const stored = bag<FormState | null>('q.form', null)
  const saved = stored && stored.src === srcKey(manualData, nameless) ? stored : null
  const f = saved ?? initForm(manualData, nameless)

  useEffect(() => {
    if (!saved) setBag('q.form', f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved])

  const v = f.v
  const s = (k: string) => String(v[k] ?? '')
  const put = (k: string, val: string | boolean) => setBag('q.form', { ...f, v: { ...v, [k]: val } })

  const edited = (k: string) => !!f.orig[k] && v[k] !== f.orig[k]
  const anyEdited = Object.keys(v).some((k) => typeof v[k] === 'string' && edited(k))

  const tag = (k: string): TagKind | null => {
    if (!s(k) || NO_TAG.includes(k)) return null
    if (edited(k)) return 'edited'
    if (!f.orig[k]) return null // поле вписали ви самі
    if (f.manual && MANUAL_KEYS.includes(k)) return 'manual'
    return CV_KEYS.includes(k) ? 'cv' : 'doc'
  }

  const text = (k: string, label: string, o: { ph?: string; mono?: boolean; ac?: string; need?: boolean } = {}) => (
    <Field id={`q05-${k}`} label={label} tag={tag(k)}>
      <TextInput id={`q05-${k}`} value={s(k)} placeholder={o.ph} autoComplete={o.ac} mono={o.mono} invalid={o.need && !s(k).trim()} onChange={(e) => put(k, e.target.value)} />
    </Field>
  )
  const date = (k: string, label: string, b: { min?: Date | null; max?: Date | null }, need?: boolean) => (
    <Field id={`q05-${k}`} label={label} tag={tag(k)}>
      <DatePick id={`q05-${k}`} title={label} value={s(k)} invalid={need && !s(k).trim()} onChange={(val) => put(k, val)} {...b} />
    </Field>
  )
  const country = (k: string, label: string) => (
    <Field id={`q05-${k}`} label={label} tag={tag(k)}>
      <CountryPick id={`q05-${k}`} title={label} value={s(k)} onChange={(val) => put(k, val)} />
    </Field>
  )

  const exp = (k: string, nk: string, issueKey: string) => {
    const off = !!v[nk]
    return (
      <div className="flex flex-col gap-3">
        {off ? (
          <Field id={`q05-${k}`} label="Действителен до" tag="noexp">
            <TextInput id={`q05-${k}`} value="" placeholder="Без срока действия" disabled />
          </Field>
        ) : (
          date(k, 'Действителен до', BOUNDS.expiry(s(issueKey)))
        )}
        <CheckRow id={`q05-${nk}`} checked={off} onChange={(c) => put(nk, c)}>
          Без срока действия
        </CheckRow>
      </div>
    )
  }

  const pick = (k: string, label: string, options: string[], mono?: boolean) => (
    <Field id={`q05-${k}`} label={label} tag={tag(k)}>
      <Select value={s(k)} onValueChange={(val) => put(k, val)}>
        <SelectTrigger id={`q05-${k}`} className={`h-12 w-full px-4 text-base data-[size=default]:h-12 ${mono ? 'font-mono' : ''}`}>
          <SelectValue placeholder="Выберите" />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-64">
          {options.map((o) => (
            <SelectItem key={o} value={o} className={`py-2 text-base ${mono ? 'font-mono' : ''}`}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )

  const miss = [
    (!s('first').trim() || !s('last').trim()) && 'имя и фамилия',
    !s('birth').trim() && 'дата рождения',
    !s('docNum').trim() && 'номер документа',
  ].filter(Boolean)

  const noName = state.scenario === 'noName' && !f.manual
  const sub = f.manual
    ? 'Данные документа введены вами вручную — администратор сверит их с фото. Остальное мы взяли из CV.'
    : noName
      ? 'Не удалось прочитать имя — введите его как в документе.'
      : 'Данные из CV и документов уже заполнены. Проверьте их и подтвердите.'

  const total = months(s('per1')) + months(s('per2'))
  const contracts = [1, 2].filter((n) => s(`vessel${n}`).trim() || months(s(`per${n}`))).length

  return (
    <FlowScreen
      step={3}
      onBack={() => go('q03')}
      footer={
        <Footer className="border-t border-border pt-4">
          <Button size="lg" disabled={miss.length > 0} onClick={() => go('q06')}>
            Подтвердить и продолжить
          </Button>
          <Hint>{miss.length ? `Осталось: ${miss.join(', ')}` : ''}</Hint>
        </Footer>
      }
    >
      <Title sub={sub}>Проверьте данные из документов</Title>

      <Group title="Личные данные">
        {text('first', 'Имя', { ph: 'Как в документе', ac: 'given-name', need: true })}
        {text('last', 'Фамилия', { ph: 'Как в документе', ac: 'family-name', need: true })}
        {date('birth', 'Дата рождения', BOUNDS.birth, true)}
        {country('cit', 'Гражданство')}
        {text('phone', 'Телефон', { ph: '+380 …', mono: true })}
      </Group>

      <Paper title={DOC_TYPES[type].n} className="mt-8">
        <div className="flex flex-col gap-5 py-1">
          {text('docName', 'Название документа')}
          {text('docNum', 'Номер документа', { mono: true, need: true })}
          {date('docIssue', 'Дата выдачи', BOUNDS.issue)}
          {exp('docExp', 'docNoExp', 'docIssue')}
          {country('docCountry', 'Страна выдачи')}
        </div>
      </Paper>

      <Paper title="Диплом" className="mt-4">
        <div className="flex flex-col gap-5 py-1">
          {text('dipName', 'Название документа')}
          {text('dipNum', 'Номер диплома', { mono: true })}
          {date('dipIssue', 'Дата выдачи', BOUNDS.issue)}
          {exp('dipExp', 'dipNoExp', 'dipIssue')}
          {country('dipCountry', 'Страна выдачи')}
          {text('dipRank', 'Должность по диплому')}
          {pick('dipStcw', 'Правило STCW', STCW_RULES, true)}
          {pick('dipLevel', 'Уровень', STCW_LEVELS)}
        </div>
      </Paper>

      <Group title="Опыт работы">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <Ship className="size-5 shrink-0 text-primary" />
          <span className="flex flex-col">
            <span className="text-sm text-muted-foreground">Общий стаж</span>
            <span className="text-base font-medium">
              <MonoNums text={durText(total) || '—'} />
              {contracts > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  · <MonoNums text={contractsText(contracts)} />
                </span>
              )}
            </span>
          </span>
        </div>
        {[1, 2].map((n) => (
          <div key={n} className={`flex flex-col gap-4 ${n > 1 ? 'border-t border-border pt-5' : ''}`}>
            {text(`vessel${n}`, 'Судно')}
            {text(`rank${n}`, 'Должность')}
            <Field id={`q05-per${n}`} label="Период" note={durText(months(s(`per${n}`)))}>
              <MonthRangePick id={`q05-per${n}`} value={s(`per${n}`)} onChange={(val) => put(`per${n}`, val)} />
            </Field>
          </div>
        ))}
      </Group>

      <div className="mt-8 flex flex-col gap-3">
        {anyEdited && <Note icon={Info}>Вы исправили данные документа — администратор сверит их с фото документа.</Note>}
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          Подтверждённое идёт в профиль и в автозаполнение анкет. Неподтверждённое — нет.
        </p>
      </div>
    </FlowScreen>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 flex flex-col gap-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

