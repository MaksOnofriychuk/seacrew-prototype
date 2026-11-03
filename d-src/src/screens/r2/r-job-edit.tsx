import { useState, type ReactNode } from 'react'
import { WebDatePick, WebMultiSelect } from '@/components/web/web-pickers'
import { BOUNDS, isoToRu, ruToIso } from '@/lib/dates'

import { BadgeCheck, Bookmark, ChevronLeft, Search } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { RECRUITER_ORG, type WebJob } from '@/lib/data-web'
import { CURRENCIES, emptyJob, JOB_EXTRA, NEW_JOB_ID, REGIONS, VESSEL_TYPES_WEB } from '@/lib/data-recruiter-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { plural, ruDate, useR2 } from './_parts'
import { CERT_OPTIONS, EMPTY_META, ENGLISH_LEVELS, EXPERIENCE, LANG_OPTIONS, requirementLines, SEATS, VISA_OPTIONS, type JobMeta } from './_job-meta'

type Key = 'fleet' | 'department' | 'position' | 'vesselType' | 'amount' | 'board' | 'duration'
const REQUIRED: Key[] = ['fleet', 'department', 'position', 'vesselType', 'amount', 'board', 'duration']

// r-job-edit — нова вакансія або редагування. Поля — відповідь 92: флот, департамент, посада, судно, ЗП (валюта, за день / за місяць),
// дата посадки, тривалість контракту, регіон, опис, вимоги вільним текстом.
// Праворуч — як вакансію побачить моряк у списку застосунку (поля короткої картки — відп. 95).
export function RJobEdit({ go }: ScreenProps) {
  const r = useR2()
  const isNew = r.editId === 'new'
  const source = isNew ? emptyJob() : (r.jobs.find((j) => j.id === r.editId) ?? emptyJob())
  const [j, setJ] = useState<WebJob>(source)
  const { bag, setBag } = useProto()
  const metaAll = bag<Record<string, JobMeta>>('r2.jobMeta', {})
  const [meta, setMeta] = useState<JobMeta>(() => metaAll[source.id] ?? { ...EMPTY_META, note: isNew ? '' : (JOB_EXTRA[source.id]?.requirements ?? '') })
  const putMeta = (p: Partial<JobMeta>) => setMeta((m) => ({ ...m, ...p }))
  const [tried, setTried] = useState(false)
  const [sal, setSal] = useState(() => parseSalary(source.salary.amount))
  const [previewOpen, setPreviewOpen] = useState(false)

  const commitSalary = (n: SalaryState) => {
    setSal(n)
    putSalary({ amount: n.mode === 'nego' ? NEGO : n.mode === 'fixed' ? n.lo : n.lo && n.hi ? `${n.lo}–${n.hi}` : '' })
  }

  const put = (p: Partial<WebJob>) => setJ((x) => ({ ...x, ...p }))
  const dur = parseDuration(j.duration)
  const putSalary = (p: Partial<WebJob['salary']>) => setJ((x) => ({ ...x, salary: { ...x.salary, ...p } }))
  const value: Record<Key, string> = { fleet: j.fleet, department: j.department, position: j.position, vesselType: j.vesselType, amount: j.salary.amount, board: j.board, duration: j.duration }
  const missing = REQUIRED.filter((k) => !value[k].trim())
  const err = (k: Key) => (tried && missing.includes(k) ? 'Заполните поле' : undefined)

  const saveMeta = () => setBag('r2.jobMeta', { ...metaAll, [j.id]: meta })
  const back = () => (isNew ? go('r-jobs') : go('r-job'))
  const saveDraft = () => {
    saveMeta()
    r.saveJob({ ...j, status: isNew ? 'draft' : j.status })
    r.showToast('Черновик сохранён')
    if (isNew) r.openJob(NEW_JOB_ID)
    go('r-job')
  }
  const publish = () => {
    setTried(true)
    if (missing.length) return
    saveMeta()
    r.saveJob({ ...j, status: 'open' })
    r.setJobStatus(j.id, 'open')
    r.openJob(j.id)
    r.showToast(isNew ? 'Вакансия опубликована' : 'Изменения опубликованы')
    go('r-job')
  }

  return (
    <WebShell variant="recruiter" active="r-jobs" go={go} className="flex flex-col p-0">
      <div className="min-h-0 flex-1 overflow-y-auto px-8 pt-8 pb-10">
        <PageHeader back={{ label: isNew ? 'Вакансии' : 'Вакансия', onClick: back }} title={isNew ? 'Новая вакансия' : 'Редактирование вакансии'} />
        <div className="grid grid-cols-[minmax(0,1fr)_372px] gap-10">
          <div className="flex flex-col gap-6">
            <Block title="Должность">
              <div className="grid grid-cols-3 gap-4">
                <WebField id="je-fleet" label="Флот" required error={err('fleet')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-fleet" value={j.fleet} onChange={(fleet) => put({ fleet, department: '', position: '' })} options={[...FLEETS]} />
                </WebField>
                <WebField id="je-dep" label="Департамент" required error={err('department')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-dep" value={j.department} onChange={(department) => put({ department, position: '' })} options={j.fleet ? departmentsFor([j.fleet]) : []} disabled={!j.fleet} placeholder={j.fleet ? 'Выберите' : 'Сначала флот'} />
                </WebField>
                <WebField id="je-pos" label="Должность" required error={err('position')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-pos" searchable value={j.position} onChange={(position) => put({ position })} options={positionsFor(j.fleet ? [j.fleet] : [], j.department || null)} disabled={!j.department} placeholder={j.department ? 'Выберите' : 'Сначала департамент'} />
                </WebField>
              </div>
            </Block>

            <Block title="Судно">
              <div className="grid grid-cols-2 gap-4">
                <WebField id="je-vt" label="Тип судна" required error={err('vesselType')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-vt" value={j.vesselType} onChange={(vesselType) => put({ vesselType })} options={VESSEL_TYPES_WEB} />
                </WebField>
                <WebField id="je-vn" label="Название судна" hint="Можно не указывать — моряк увидит только тип">
                  <WebInput id="je-vn" value={j.vesselName} onChange={(e) => put({ vesselName: e.target.value })} placeholder="MT Aurora Spirit" />
                </WebField>
              </div>
            </Block>

            <Block title="Условия">
              <div className="grid grid-cols-[minmax(0,2.6fr)_minmax(0,1fr)_minmax(0,1.1fr)_80px] items-start gap-4">
                <WebField label="Зарплата" required error={err('amount')}>
                  <Segmented value={sal.mode} onChange={(mode) => commitSalary({ ...sal, mode })} options={[['range', 'От–до'], ['fixed', 'Точная'], ['nego', 'Договорная']]} />
                </WebField>
                {sal.mode !== 'nego' ? (
                  <>
                    <WebField id="je-lo" label={sal.mode === 'range' ? 'От' : 'Сумма'} hint="">
                      <WebSelect id="je-lo" searchable className="data-[size=default]:h-10 font-mono" value={sal.lo} onChange={(lo) => commitSalary({ ...sal, lo, hi: sal.hi && toNum(sal.hi) <= toNum(lo) ? '' : sal.hi })} options={salaryOptions(j.salary.period, sal.lo)} />
                    </WebField>
                    {sal.mode === 'range' ? (
                      <WebField id="je-hi" label="До" hint="">
                        <WebSelect id="je-hi" searchable disabled={!sal.lo} className="data-[size=default]:h-10 font-mono" value={sal.hi} onChange={(hi) => commitSalary({ ...sal, hi })} options={salaryOptions(j.salary.period, sal.hi).filter((o) => toNum(o) > toNum(sal.lo))} placeholder={sal.lo ? 'Выберите' : 'Нужно «от»'} />
                      </WebField>
                    ) : (
                      <span />
                    )}
                  </>
                ) : (
                  <p className="col-span-2 self-center text-sm text-muted-foreground">Сумму моряк увидит после отклика, в карточке будет «Договорная».</p>
                )}
                <WebField id="je-cur" label="Валюта" hint="">
                  <WebSelect className="data-[size=default]:h-10" id="je-cur" value={j.salary.currency} onChange={(currency) => putSalary({ currency: currency as WebJob['salary']['currency'] })} options={[...CURRENCIES]} />
                </WebField>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.5fr)] items-start gap-4">
                <WebField label="Период оплаты">
                  <Segmented value={j.salary.period} onChange={(period) => { putSalary({ period }); commitSalary({ ...sal, lo: '', hi: '' }) }} options={[['месяц', 'В месяц'], ['день', 'В день']]} />
                </WebField>
                <WebField id="je-board" label="Дата посадки" required error={err('board')}>
                  <WebDatePick id="je-board" value={isoToRu(j.board)} onChange={(v) => put({ board: ruToIso(v) })} {...BOUNDS.future} />
                </WebField>
                <WebField id="je-dur" label="Длительность контракта" required error={err('duration')}>
                  <div className="flex gap-2">
                    <WebSelect id="je-dur" className="w-[76px] shrink-0 font-mono" value={dur.n} onChange={(n) => put({ duration: durationText(n, dur.unit, dur.tol) })} options={(dur.unit === 'm' ? MONTH_N : WEEK_N).map(String)} placeholder="—" />
                    <WebSelect className="w-[96px] shrink-0" value={dur.tol || '0'} onChange={(tol) => put({ duration: durationText(dur.n, dur.unit, tol === '0' ? '' : tol) })} options={[{ value: '0', label: 'точно' }, { value: '1', label: '±1' }, { value: '2', label: '±2' }]} />
                    <div className="min-w-0 flex-1">
                      <Segmented value={dur.unit} onChange={(unit) => put({ duration: durationText(dur.n, unit, dur.tol) })} options={[['m', 'мес.'], ['w', 'нед.']]} />
                    </div>
                  </div>
                </WebField>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <WebField id="je-reg" label="Регион">
                  <WebSelect className="data-[size=default]:h-10" id="je-reg" value={j.region} onChange={(region) => put({ region: region as WebJob['region'] })} options={[...REGIONS]} />
                </WebField>
                <WebField id="je-seats" label="Сколько человек нужно">
                  <WebSelect className="data-[size=default]:h-10 font-mono" id="je-seats" value={meta.seats} onChange={(seats) => putMeta({ seats })} options={SEATS} />
                </WebField>
              </div>
            </Block>

            <Block title="Требования к моряку">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <WebField id="je-exp" label="Стаж в должности">
                  <WebSelect className="data-[size=default]:h-10" id="je-exp" value={meta.expPos} onChange={(expPos) => putMeta({ expPos })} options={EXPERIENCE} />
                </WebField>
                <WebField id="je-expv" label="Опыт на этом типе судна">
                  <WebSelect className="data-[size=default]:h-10" id="je-expv" value={meta.expVessel} onChange={(expVessel) => putMeta({ expVessel })} options={EXPERIENCE} />
                </WebField>
                <WebField id="je-cert" label="Сертификаты">
                  <WebMultiSelect id="je-cert" label="Сертификаты" values={meta.certs} onChange={(certs) => putMeta({ certs })} options={CERT_OPTIONS} placeholder="Не важны" />
                </WebField>
                <WebField id="je-visa" label="Визы">
                  <WebMultiSelect id="je-visa" label="Визы" values={meta.visas} onChange={(visas) => putMeta({ visas })} options={VISA_OPTIONS} placeholder="Не нужны" />
                </WebField>
                <WebField id="je-lang" label="Языки экипажа">
                  <WebMultiSelect id="je-lang" label="Языки" values={meta.langs} onChange={(langs) => putMeta({ langs })} options={LANG_OPTIONS} placeholder="Не важны" />
                </WebField>
                <WebField id="je-eng" label="Английский">
                  <WebSelect className="data-[size=default]:h-10" id="je-eng" value={meta.english} onChange={(english) => putMeta({ english })} options={ENGLISH_LEVELS} />
                </WebField>
              </div>
            </Block>

            <Block title="Описание">
              <div className="grid grid-cols-2 gap-4">
                <WebField id="je-desc" label="Описание">
                  <WebTextarea id="je-desc" value={j.description} onChange={(e) => put({ description: e.target.value })} placeholder="Судовладелец, линия, смена экипажа, условия на борту" className="min-h-28" />
                </WebField>
                <WebField id="je-req" label="Ещё для моряка" hint="Только то, чего нет в списках выше">
                  <WebTextarea id="je-req" value={meta.note} onChange={(e) => putMeta({ note: e.target.value })} placeholder="Например: двигатели MAN B&W" className="min-h-28" />
                </WebField>
              </div>
            </Block>
          </div>

          <aside className="sticky top-0 flex flex-col gap-3 self-start">
            <span className="text-sm text-muted-foreground">Так вакансию увидят в приложении</span>
            <div className="w-full max-w-[340px] self-center">
              <Segmented value={previewOpen ? 'open' : 'card'} onChange={(v) => setPreviewOpen(v === 'open')} options={[['card', 'В списке'], ['open', 'Открытая']]} />
            </div>
            <Preview j={j} meta={meta} open={previewOpen} />
          </aside>
        </div>
      </div>

      <footer className="flex h-[72px] shrink-0 items-center gap-3 border-t border-border bg-surface px-8">
        {tried && missing.length > 0 && (
          <span className="text-sm text-signal">
            Чтобы опубликовать, заполните ещё <span className="font-mono">{missing.length}</span> {plural(missing.length, 'поле', 'поля', 'полей')}
          </span>
        )}
        <span className="ml-auto" />
        <Button variant="ghost" onClick={back}>
          Отмена
        </Button>
        {(isNew || j.status === 'draft') && (
          <Button variant="outline" onClick={saveDraft}>
            Сохранить черновик
          </Button>
        )}
        <Button onClick={publish}>{isNew || j.status === 'draft' ? 'Опубликовать' : 'Сохранить изменения'}</Button>
      </footer>
    </WebShell>
  )
}

// Длительность контракта — число из списка, допуск и единица: месяцы или недели (правка №35: «1 мес / 4 недели»).
// Небольшой набор значений — выбор из списка, не ввод (перевірка 03.11, №4).
type DurUnit = 'm' | 'w'
const MONTH_N = Array.from({ length: 12 }, (_, i) => i + 1)
const WEEK_N = Array.from({ length: 12 }, (_, i) => i + 1)
function parseDuration(text: string): { n: string; tol: string; unit: DurUnit } {
  const m = text.match(/^(\d+)(?:\s*±\s*(\d+))?\s*(мес\.?|недел[яиь]|нед\.?)$/)
  if (!m) return { n: '', tol: '', unit: 'm' }
  return { n: m[1], tol: m[2] ?? '', unit: m[3].startsWith('мес') ? 'm' : 'w' }
}
function durationText(n: string, unit: DurUnit, tol = '') {
  const v = n.trim()
  if (!v) return ''
  const t = tol ? ` ±${tol}` : ''
  if (unit === 'm') return `${v}${t} мес.`
  return `${v}${t} ${plural(Number(v), 'неделя', 'недели', 'недель')}`
}

// Зарплата выбором: диапазон «от–до», точная сумма или «Договорная». Шаги суммы — списком, руками ничего не вводится.
const NEGO = 'Договорная'
type SalaryState = { mode: 'range' | 'fixed' | 'nego'; lo: string; hi: string }
const fmtNum = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
const toNum = (s: string) => Number(s.replace(/\D/g, '')) || 0
const seq = (from: number, to: number, step: number) => Array.from({ length: Math.floor((to - from) / step) + 1 }, (_, i) => from + i * step)
const MONTH_SUMS = [...seq(1000, 6000, 200), ...seq(6500, 12000, 500), ...seq(13000, 20000, 1000)]
const DAY_SUMS = [...seq(100, 600, 10), ...seq(650, 1000, 50)]
function salaryOptions(period: WebJob['salary']['period'], current: string) {
  const list = (period === 'месяц' ? MONTH_SUMS : DAY_SUMS).slice()
  const cur = toNum(current)
  if (cur && !list.includes(cur)) list.push(cur)
  return list.sort((a, b) => a - b).map(fmtNum)
}
function parseSalary(amount: string): SalaryState {
  if (amount === NEGO) return { mode: 'nego', lo: '', hi: '' }
  const [lo = '', hi = ''] = amount.split('–')
  if (hi) return { mode: 'range', lo, hi }
  return { mode: lo ? 'fixed' : 'range', lo, hi: '' }
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-border pb-2 text-base font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div role="radiogroup" className="flex h-10 rounded-md border border-border bg-surface p-0.5">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={cn('flex-1 rounded-[9px] text-sm font-medium transition-colors', v === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

// Вакансия так, как её видит моряк в мобильном приложении: рамка телефона, карточка списка или открытая вакансия.
function Preview({ j, meta, open }: { j: WebJob; meta: JobMeta; open: boolean }) {
  const nego = j.salary.amount === NEGO
  const salary = j.salary.amount ? (nego ? NEGO : `${j.salary.currency}${j.salary.amount} / ${j.salary.period === 'месяц' ? 'мес' : 'день'}`) : ''
  const empty = <span className="text-muted-foreground/60">—</span>
  const reqs = requirementLines(meta)
  const title = j.position || <span className="text-muted-foreground/60">Должность</span>
  const money = salary || <span className="text-muted-foreground/60">Зарплата</span>
  const card = (
    <div className="flex flex-col gap-1">
      <span className="text-[17px] font-semibold">{title}</span>
      <span className="font-mono text-[15px] font-semibold text-primary">{money}</span>
      <span className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
        <span>{j.vesselType || empty}</span>
        <span>
          контракт {j.duration ? <MonoNums text={j.duration} /> : empty}
        </span>
        <span>
          посадка {j.board ? <span className="font-mono">{ruDate(j.board)}</span> : empty}
        </span>
      </span>
    </div>
  )
  return (
    <div className="mx-auto w-full max-w-[340px] overflow-hidden rounded-[32px] border-[6px] border-border bg-background">
      <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs text-muted-foreground">
        <span className="font-mono">9:41</span>
        <span className="h-1.5 w-16 rounded-full bg-border" />
        <span className="w-8" />
      </div>
      {open ? (
        <div className="flex min-h-[420px] flex-col">
          <div className="flex items-center gap-1 px-3 py-2 text-sm text-primary">
            <ChevronLeft className="size-4" /> Вакансии
            <Bookmark className="ml-auto size-4 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-3 border-t border-border bg-surface px-5 py-4">
            {card}
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              {RECRUITER_ORG.name}
              <BadgeCheck className="size-4 text-success" aria-label="Агентство проверено" />
            </span>
            {j.description && <p className="text-sm leading-relaxed">{j.description}</p>}
            {meta.seats !== '1' && (
              <p className="text-sm text-muted-foreground">
                Нужно <span className="font-mono text-foreground">{meta.seats}</span> {plural(Number(meta.seats), 'человек', 'человека', 'человек')}
              </p>
            )}
            {reqs.length > 0 && (
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {reqs.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            )}
            <span className="mt-1 flex h-10 items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground">Откликнуться</span>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[420px] flex-col">
          <div className="px-3 pb-2">
            <span className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground">
              <Search className="size-4" /> Поиск вакансий
            </span>
          </div>
          <div className="flex flex-col divide-y divide-border border-t border-border bg-surface">
            <div className="px-5 py-4">
              {card}
              <span className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                {RECRUITER_ORG.name}
                <BadgeCheck className="size-4 text-success" aria-label="Агентство проверено" />
              </span>
            </div>
            <div className="flex flex-col gap-1.5 px-5 py-4 opacity-40" aria-hidden="true">
              <span className="h-3.5 w-36 rounded bg-border" />
              <span className="h-3 w-24 rounded bg-border" />
              <span className="h-3 w-48 rounded bg-border" />
            </div>
            <div className="flex flex-col gap-1.5 px-5 py-4 opacity-40" aria-hidden="true">
              <span className="h-3.5 w-28 rounded bg-border" />
              <span className="h-3 w-20 rounded bg-border" />
              <span className="h-3 w-44 rounded bg-border" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
