import { useState, type ReactNode } from 'react'
import { WebDatePick } from '@/components/web/web-pickers'
import { BOUNDS, isoToRu, ruToIso } from '@/lib/dates'

import { BadgeCheck } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { departmentsFor, FLEETS, positionsFor } from '@/lib/data'
import { RECRUITER_ORG, type WebJob } from '@/lib/data-web'
import { CURRENCIES, emptyJob, JOB_EXTRA, NEW_JOB_ID, REGIONS, VESSEL_TYPES_WEB } from '@/lib/data-recruiter-2'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { plural, ruDate, useR2 } from './_parts'

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
  const [req, setReq] = useState(isNew ? '' : (JOB_EXTRA[source.id]?.requirements ?? ''))
  const [tried, setTried] = useState(false)

  const put = (p: Partial<WebJob>) => setJ((x) => ({ ...x, ...p }))
  const dur = parseDuration(j.duration)
  const putSalary = (p: Partial<WebJob['salary']>) => setJ((x) => ({ ...x, salary: { ...x.salary, ...p } }))
  const value: Record<Key, string> = { fleet: j.fleet, department: j.department, position: j.position, vesselType: j.vesselType, amount: j.salary.amount, board: j.board, duration: j.duration }
  const missing = REQUIRED.filter((k) => !value[k].trim())
  const err = (k: Key) => (tried && missing.includes(k) ? 'Заполните поле' : undefined)

  const back = () => (isNew ? go('r-jobs') : go('r-job'))
  const saveDraft = () => {
    r.saveJob({ ...j, status: isNew ? 'draft' : j.status })
    r.showToast('Черновик сохранён')
    if (isNew) r.openJob(NEW_JOB_ID)
    go('r-job')
  }
  const publish = () => {
    setTried(true)
    if (missing.length) return
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
        <div className="grid grid-cols-[minmax(0,720px)_minmax(0,1fr)] gap-12">
          <div className="flex flex-col gap-9">
            <Block title="Должность">
              <div className="grid grid-cols-3 gap-4">
                <WebField id="je-fleet" label="Флот" required error={err('fleet')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-fleet" value={j.fleet} onChange={(fleet) => put({ fleet, department: '', position: '' })} options={[...FLEETS]} />
                </WebField>
                <WebField id="je-dep" label="Департамент" required error={err('department')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-dep" value={j.department} onChange={(department) => put({ department, position: '' })} options={j.fleet ? departmentsFor([j.fleet]) : []} placeholder={j.fleet ? 'Выберите' : 'Сначала флот'} />
                </WebField>
                <WebField id="je-pos" label="Должность" required error={err('position')}>
                  <WebSelect className="data-[size=default]:h-10" id="je-pos" value={j.position} onChange={(position) => put({ position })} options={positionsFor(j.fleet ? [j.fleet] : [], j.department || null)} placeholder={j.department ? 'Выберите' : 'Сначала департамент'} />
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
              <div className="grid grid-cols-[minmax(0,1fr)_96px_minmax(0,1fr)] items-start gap-4">
                <WebField id="je-sal" label="Зарплата" required error={err('amount')}>
                  <WebInput id="je-sal" value={j.salary.amount} onChange={(e) => putSalary({ amount: e.target.value })} placeholder="4 200–4 600" className="font-mono" inputMode="numeric" />
                </WebField>
                <WebField id="je-cur" label="Валюта">
                  <WebSelect className="data-[size=default]:h-10" id="je-cur" value={j.salary.currency} onChange={(currency) => putSalary({ currency: currency as WebJob['salary']['currency'] })} options={[...CURRENCIES]} />
                </WebField>
                <WebField label="Период">
                  <Segmented value={j.salary.period} onChange={(period) => putSalary({ period })} options={[['месяц', 'В месяц'], ['день', 'В день']]} />
                </WebField>
              </div>
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-4">
                <WebField id="je-board" label="Дата посадки" required error={err('board')}>
                  <WebDatePick id="je-board" value={isoToRu(j.board)} onChange={(v) => put({ board: ruToIso(v) })} {...BOUNDS.future} />
                </WebField>
                <WebField id="je-dur" label="Длительность контракта" required error={err('duration')}>
                  <div className="flex gap-2">
                    <WebInput id="je-dur" value={dur.n} onChange={(e) => put({ duration: durationText(e.target.value, dur.unit) })} placeholder="4 ±1" className="w-[88px] shrink-0 font-mono" />
                    <div className="min-w-0 flex-1">
                      <Segmented value={dur.unit} onChange={(unit) => put({ duration: durationText(dur.n, unit) })} options={[['m', 'мес.'], ['w', 'нед.']]} />
                    </div>
                  </div>
                </WebField>
                <WebField id="je-reg" label="Регион">
                  <WebSelect className="data-[size=default]:h-10" id="je-reg" value={j.region} onChange={(region) => put({ region: region as WebJob['region'] })} options={[...REGIONS]} />
                </WebField>
              </div>
            </Block>

            <Block title="Описание и требования">
              <div className="flex flex-col gap-4">
                <WebField id="je-desc" label="Описание">
                  <WebTextarea id="je-desc" value={j.description} onChange={(e) => put({ description: e.target.value })} placeholder="Судовладелец, линия, смена экипажа, условия на борту" className="min-h-28" />
                </WebField>
                <WebField id="je-req" label="Требования к моряку" hint="Свободным текстом: визы, минимальный стаж, опыт на конкретном типе судна">
                  <WebTextarea id="je-req" value={req} onChange={(e) => setReq(e.target.value)} placeholder="Виза США C1/D. Стаж в должности от 12 месяцев." className="min-h-24" />
                </WebField>
              </div>
            </Block>
          </div>

          <aside className="sticky top-0 flex flex-col gap-3 self-start">
            <span className="text-sm text-muted-foreground">Так вакансию увидят в приложении</span>
            <Preview j={j} />
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

// Тривалість контракту — число й одиниця: місяці або тижні (правка №35: «1 мес / 4 недели»).
type DurUnit = 'm' | 'w'
function parseDuration(text: string): { n: string; unit: DurUnit } {
  const m = text.match(/^(.*?)\s*(мес\.?|недел[яиь]|нед\.?)$/)
  if (!m) return { n: text, unit: 'm' }
  return { n: m[1], unit: m[2].startsWith('мес') ? 'm' : 'w' }
}
function durationText(n: string, unit: DurUnit) {
  const v = n.trim()
  if (!v) return ''
  if (unit === 'm') return `${v} мес.`
  const first = Number(v.match(/\d+/)?.[0] ?? 0)
  return `${v} ${plural(first, 'неделя', 'недели', 'недель')}`
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

// Картка вакансії зі списку застосунку: посада, ЗП, тип судна, посадка, тривалість, агентство.
function Preview({ j }: { j: WebJob }) {
  const salary = j.salary.amount ? `${j.salary.currency}${j.salary.amount} / ${j.salary.period}` : ''
  const empty = <span className="text-muted-foreground/60">—</span>
  return (
    <div className="w-[360px] rounded-2xl border border-border bg-surface px-5 py-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-[17px] font-semibold">{j.position || <span className="text-muted-foreground/60">Должность</span>}</span>
        <span className="font-mono text-[15px] font-semibold text-primary">{salary || <span className="font-sans text-muted-foreground/60">Зарплата</span>}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{j.vesselType || empty}</span>
          <span>посадка {j.board ? <span className="font-mono">{ruDate(j.board)}</span> : empty}</span>
          <span>{j.duration ? <MonoNums text={j.duration} /> : empty}</span>
        </span>
        <span className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          {RECRUITER_ORG.name}
          <BadgeCheck className="size-4 text-success" aria-label="Агентство проверено" />
        </span>
      </div>
    </div>
  )
}
