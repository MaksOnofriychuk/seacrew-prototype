import { useEffect, useRef, useState, type ComponentType } from 'react'
import { ArrowDown, ArrowUp, Check, FileText, FileType, Images, LoaderCircle, RotateCw, Upload, X } from 'lucide-react'
import { ErrorState, useView, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebCheckbox, WebField, WebInput } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { StatusDot } from '@/components/web/status-badge'
import { IMPORTED_FORM_ID } from '@/lib/data-recruiter-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { useR2 } from './_parts'

type Kind = 'acro' | 'flat' | 'photos' | 'word'
type Step = 'pick' | 'pages' | 'reading' | 'mapping'

const KINDS: { id: Kind; icon: ComponentType<{ className?: string }>; title: string; text: string; file: string; size: string }[] = [
  { id: 'acro', icon: FileText, title: 'PDF с полями', text: 'Поля читаем без AI, сразу', file: 'Nordic_Offshore_application.pdf', size: '480 КБ' },
  { id: 'flat', icon: FileText, title: 'PDF без полей', text: 'Скан или распечатка, AI прочитает страницы', file: 'Application_scan.pdf', size: '3,2 МБ' },
  { id: 'photos', icon: Images, title: 'Фото бланка', text: 'JPEG или PNG, по странице на фото', file: '3 фото страниц', size: '7,9 МБ' },
  { id: 'word', icon: FileType, title: 'Документ Word', text: '.docx до 5 МБ, AI прочитает текст и таблицы', file: 'Anketa_moryaka.docx', size: '210 КБ' },
]

// proof — поле можна вимагати підтвердити документом (ТЗ §9): там, де моряк вводить значення, а не прикладає документ чи підпис.
type Row = { pdf: string; label: string; page: number; target: string; kind: 'dictionary' | 'free' | 'ignore'; sure: boolean; proof?: boolean }
const ROWS: Row[] = [
  { pdf: 'surname_1', label: 'Surname', page: 1, target: 'Фамилия', kind: 'dictionary', sure: true },
  { pdf: 'given_names', label: 'Given names', page: 1, target: 'Имя', kind: 'dictionary', sure: true },
  { pdf: 'dob', label: 'Date of birth', page: 1, target: 'Дата рождения', kind: 'dictionary', sure: true, proof: true },
  { pdf: 'NOK_name', label: 'Next of kin', page: 1, target: 'Ближайший родственник', kind: 'dictionary', sure: false, proof: true },
  { pdf: 'cert_bosiet', label: 'BOSIET certificate', page: 2, target: 'Запрос документа: BOSIET', kind: 'dictionary', sure: true },
  { pdf: 'cert_dp', label: 'DP certificate', page: 2, target: 'Запрос документа: DP', kind: 'dictionary', sure: true },
  { pdf: 'medical_oguk', label: 'OGUK medical', page: 2, target: 'Запрос документа: медицина', kind: 'dictionary', sure: true },
  { pdf: 'dp_hours', label: 'DP hours', page: 3, target: 'Свой вопрос: число', kind: 'free', sure: true, proof: true },
  { pdf: 'dp_class', label: 'DP class', page: 3, target: 'Свой вопрос: выбор', kind: 'free', sure: false, proof: true },
  { pdf: 'declaration_chk', label: 'I confirm the information is true', page: 4, target: 'Согласие', kind: 'dictionary', sure: true },
  { pdf: 'signature', label: 'Signature', page: 4, target: 'Подпись', kind: 'dictionary', sure: true },
  { pdf: 'office_approved', label: 'Office use: approved by', page: 4, target: 'Только агентство: текст', kind: 'free', sure: true },
  { pdf: 'barcode_hidden', label: 'Barcode', page: 4, target: 'Пропустить', kind: 'ignore', sure: true },
]

const STEPS: { id: Step[]; label: string }[] = [
  { id: ['pick'], label: 'Файл' },
  { id: ['pages', 'reading'], label: 'Распознавание' },
  { id: ['mapping'], label: 'Проверка полей' },
]

// r-form-import — імпорт анкети агентства: PDF з полями, PDF без полів, фото, Word → розпізнавання → перевірка → конструктор.
// Тексти — з apps/web (pdfImport.*). Кроки справді йдуть по черзі, тому нумеровані.
export function RFormImport({ go }: ScreenProps) {
  const r = useR2()
  const view = useView()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<Kind | null>(null)
  const [step, setStep] = useState<Step>('pick')
  const [tried, setTried] = useState(false)
  const [clean, setClean] = useState(false)
  const [pages, setPages] = useState([0, 1, 2].map((i) => ({ id: i, turn: 0 })))
  const [confirmed, setConfirmed] = useState<string[]>([])
  // «Нужно подтверждение документом» — рекрутер ставить позначку вже під час імпорту (ТЗ §9).
  const [proof, setProof] = useState<string[]>(['dp_hours'])
  const { setBag } = useProto()
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const k = KINDS.find((x) => x.id === kind)
  const ai = kind !== 'acro'
  const read = () => {
    setStep('reading')
    timer.current = window.setTimeout(() => setStep('mapping'), ai ? 2200 : 1100)
  }
  const next = () => {
    setTried(true)
    if (!title.trim() || !kind) return
    setTried(false)
    if (kind === 'acro') read()
    else setStep('pages')
  }
  const reset = () => {
    setKind(null)
    setStep('pick')
    setClean(false)
    setConfirmed([])
  }

  const review = ROWS.filter((x) => !x.sure && !confirmed.includes(x.pdf))
  const stepIndex = STEPS.findIndex((s) => s.id.includes(step))

  const cols: Column<Row>[] = [
    {
      key: 'pdf',
      header: ai ? 'Поле на бланке' : 'Поле в PDF',
      width: '22%',
      cell: (x) => (
        <span className="flex flex-col">
          {ai ? <span className="truncate">{x.label}</span> : <span className="truncate font-mono text-[13px]">{x.pdf}</span>}
          <span className="text-[13px] text-muted-foreground">
            Страница <span className="font-mono">{x.page}</span>
          </span>
        </span>
      ),
    },
    { key: 'target', header: 'Заполняется из', width: '27%', cell: (x) => <span className={cn(x.kind === 'ignore' && 'text-muted-foreground')}>{x.target}</span> },
    {
      key: 'sure',
      header: 'Предложение',
      width: '16%',
      cell: (x) => (x.sure || confirmed.includes(x.pdf) ? <StatusDot tone="success">{confirmed.includes(x.pdf) ? 'Подтверждено' : 'Совпадает'}</StatusDot> : <StatusDot tone="warning">Проверьте</StatusDot>),
    },
    {
      key: 'proof',
      header: 'Нужен документ',
      width: '15%',
      cell: (x) =>
        x.proof ? (
          <WebCheckbox id={`proof-${x.pdf}`} checked={proof.includes(x.pdf)} onChange={(v) => setProof((p) => (v ? [...p, x.pdf] : p.filter((k) => k !== x.pdf)))}>
            {proof.includes(x.pdf) ? 'Да' : <span className="text-muted-foreground">Нет</span>}
          </WebCheckbox>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: 'act',
      header: <span className="sr-only">Действие</span>,
      width: '20%',
      align: 'right',
      cell: (x) =>
        !x.sure && !confirmed.includes(x.pdf) ? (
          <Button variant="outline" size="sm" onClick={() => setConfirmed((c) => [...c, x.pdf])}>
            <Check /> Подтвердить
          </Button>
        ) : null,
    },
  ]

  const body = (
    <div className="flex max-w-[960px] flex-col gap-8">
      <ol className="flex items-center gap-3" aria-label="Шаги импорта">
        {STEPS.map((s, i) => (
          <li key={s.label} className="flex items-center gap-3">
            {i > 0 && <span className="h-px w-10 bg-border" />}
            <span className={cn('flex items-center gap-2 text-sm', i === stepIndex ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              <span className={cn('flex size-6 items-center justify-center rounded-full font-mono text-xs', i < stepIndex ? 'bg-success text-primary-foreground' : i === stepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                {i < stepIndex ? <Check className="size-3.5" /> : i + 1}
              </span>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      {step === 'pick' && (
        <>
          <WebField id="imp-title" label="Название анкеты" error={tried && !title.trim() ? 'Укажите название анкеты.' : undefined}>
            <WebInput id="imp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Анкета" className="max-w-[480px]" />
          </WebField>
          <div className={cn('flex flex-col items-center gap-3 rounded-xl border border-dashed bg-surface px-8 py-10 text-center', tried && !kind ? 'border-signal' : 'border-border')}>
            {k ? (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
                  <k.icon className="size-6" />
                </span>
                <span className="text-[15px] font-medium">{k.file}</span>
                <span className="text-sm text-muted-foreground">
                  {k.title}, <span className="font-mono">{k.size}</span>
                </span>
                <button type="button" onClick={reset} className="flex items-center gap-1 text-sm font-medium text-primary">
                  <X className="size-4" /> Выбрать другой файл
                </button>
              </>
            ) : (
              <>
                <span className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
                  <Upload className="size-6" />
                </span>
                <span className="text-[15px] font-medium">Перетащите анкету сюда</span>
                <span className="max-w-[520px] text-sm text-muted-foreground">
                  Один PDF или фото страниц (JPEG, PNG) до <span className="font-mono">20</span> МБ каждое, или один документ Word до <span className="font-mono">5</span> МБ.
                </span>
                <Button variant="outline" className="mt-1" onClick={() => setKind('acro')}>
                  Выбрать файлы
                </Button>
              </>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <span className="text-sm text-muted-foreground">Что можно загрузить</span>
            <div className="grid grid-cols-4 divide-x divide-border overflow-hidden rounded-xl border border-border bg-surface">
              {KINDS.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setKind(x.id)}
                  aria-pressed={kind === x.id}
                  className={cn('flex flex-col gap-1.5 p-4 text-left transition-colors', kind === x.id ? 'bg-muted' : 'hover:bg-muted')}
                >
                  <x.icon className={cn('size-5', kind === x.id ? 'text-primary' : 'text-muted-foreground')} />
                  <span className={cn('text-sm font-medium', kind === x.id && 'text-primary')}>{x.title}</span>
                  <span className="text-[13px] text-muted-foreground">{x.text}</span>
                </button>
              ))}
            </div>
          </div>
          {tried && !kind && <p className="-mt-4 text-sm text-signal">Выберите файл анкеты.</p>}
          <div>
            <Button onClick={next}>{kind === 'acro' || !kind ? 'Загрузить и прочитать поля' : 'Далее'}</Button>
          </div>
        </>
      )}

      {step === 'pages' && kind && (
        <>
          {kind === 'word' ? (
            <p className="max-w-[640px] text-[15px]">AI читает текст и таблицы документа Word: разделы, поля, таблицы. Результат вы проверите в конструкторе.</p>
          ) : (
            <>
              <p className="max-w-[640px] text-[15px]">
                {kind === 'flat' ? 'В этом PDF нет полей формы, поэтому AI прочитает его со страниц. ' : ''}
                Расставьте страницы по порядку и поверните те, что лежат боком. AI прочитает разделы, поля и таблицы.
              </p>
              <ul className="flex gap-4">
                {pages.map((p, i) => (
                  <li key={p.id} className="flex flex-col items-center gap-2">
                    <span className="flex size-[168px] items-center justify-center rounded-xl border border-border bg-surface">
                      <span className="flex h-[136px] w-[100px] flex-col gap-1.5 overflow-hidden rounded-sm border border-border bg-background transition-transform duration-200 motion-reduce:transition-none" style={{ transform: `rotate(${p.turn}deg)` }}>
                        <span className="h-3 bg-primary/70" />
                        {Array.from({ length: 7 }, (_, n) => (
                          <span key={n} className={cn('mx-2 h-1 rounded-full bg-border', n % 3 === 2 ? 'w-1/2' : 'w-3/4')} />
                        ))}
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Страница <span className="font-mono">{i + 1}</span>
                    </span>
                    <span className="flex gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Повернуть страницу ${i + 1}`} onClick={() => setPages((ps) => ps.map((x) => (x.id === p.id ? { ...x, turn: x.turn + 90 } : x)))}>
                        <RotateCw />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Переместить страницу ${i + 1} выше`} disabled={i === 0} onClick={() => setPages((ps) => swap(ps, i, i - 1))}>
                        <ArrowUp className="-rotate-90" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Переместить страницу ${i + 1} ниже`} disabled={i === pages.length - 1} onClick={() => setPages((ps) => swap(ps, i, i + 1))}>
                        <ArrowDown className="-rotate-90" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Убрать страницу ${i + 1}`} disabled={pages.length < 2} onClick={() => setPages((ps) => ps.filter((x) => x.id !== p.id))}>
                        <X />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="flex flex-col gap-1.5">
            <WebCheckbox id="imp-clean" checked={clean} onChange={setClean}>
              На бланке нет данных моряка: он пустой или на нём только пометки от руки
            </WebCheckbox>
            <p className={cn('pl-7 text-sm', tried && !clean ? 'text-signal' : 'text-muted-foreground')}>
              {tried && !clean ? 'Подтвердите, что на бланке нет данных моряка.' : 'Бесплатные AI-движки могут учиться на том, что читают, поэтому отправляйте только пустой бланк.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              Назад
            </Button>
            <Button
              onClick={() => {
                if (clean) read()
                else setTried(true)
              }}
            >
              Распознать форму
            </Button>
          </div>
        </>
      )}

      {step === 'reading' && (
        <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-6">
          <LoaderCircle className="size-6 shrink-0 animate-spin text-primary motion-reduce:animate-none" />
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-medium">{ai ? 'Читаем бланк…' : 'Читаем поля…'}</span>
            <span className="text-sm text-muted-foreground">
              {ai ? 'Это занимает до минуты на страницу. Можно уйти со страницы — анкета появится в списке, когда будет готова.' : 'Поля PDF читаются сразу, без AI.'}
            </span>
          </div>
        </div>
      )}

      {step === 'mapping' && (
        <>
          <div className="flex items-end justify-between gap-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">
                Найдено <span className="font-mono">{ROWS.length}</span> полей
              </h2>
              <p className="max-w-[620px] text-sm text-muted-foreground">
                Проверьте, что означает каждое поле. Предложения — по названиям полей и прошлым анкетам вашего агентства. Подтверждено <span className="font-mono">{ROWS.length - review.length}</span> из <span className="font-mono">{ROWS.length}</span>. «Нужен документ» — моряк подтвердит значение документом из профиля или приложит фото либо файл.
              </p>
            </div>
            {review.length > 0 && (
              <Button variant="outline" onClick={() => setConfirmed(ROWS.map((x) => x.pdf))}>
                Подтвердить все предложения
              </Button>
            )}
          </div>
          <DataTable columns={cols} rows={ROWS} rowKey={(x) => x.pdf} ignoreView />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                r.openForm(IMPORTED_FORM_ID)
                r.setImportTitle(title.trim())
                setBag('r2.importProof', proof)
                go('r-form-edit')
              }}
            >
              Открыть в конструкторе
            </Button>
            <Button variant="ghost" onClick={reset}>
              Загрузить другой файл
            </Button>
            {review.length > 0 && (
              <span className="text-sm text-muted-foreground">
                На проверку: <span className="font-mono">{review.length}</span>, можно проверить и в конструкторе
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <WebShell variant="recruiter" active="r-forms" go={go}>
      <PageHeader back={{ label: 'Анкеты', onClick: () => go('r-forms') }} title="Импорт анкеты" description="Загрузите анкету, которую агентство уже использует. Мы соберём из неё анкету для приложения." />
      {view === 'error' ? (
        <ErrorState title="Бланк не прочитан" text="AI-движки не смогли прочитать этот бланк. Попробуйте ещё раз или сделайте более чёткие фото." className="mx-0 items-start text-left" />
      ) : view === 'empty' ? (
        body
      ) : (
        <ViewState loading={{ kind: 'cards' }}>{body}</ViewState>
      )}
    </WebShell>
  )
}

function swap<T>(xs: T[], i: number, j: number) {
  const n = [...xs]
  ;[n[i], n[j]] = [n[j], n[i]]
  return n
}

