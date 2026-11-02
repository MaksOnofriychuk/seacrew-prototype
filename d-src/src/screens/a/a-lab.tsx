import { useState } from 'react'
import { BarChart3, FileText, FlaskConical, Lock } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { AGREEMENT, EFFECT, EFFECT_ENGINES, EFFECT_FIELDS, LAB, LAB_FIELDS, LAB_RUNS, LAB_STATUS_LABEL, type EffRow, type LabField, type LabItem, type LabRun, type LabStatus } from '@/lib/data-admin'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, Facts, Mono, Note, SectionTitle, dt, useBagState } from './_parts'

const TONE: Record<LabStatus, Tone> = { CONFIRMED: 'success', NEEDS_REVIEW: 'warning', FAILED: 'error', PROCESSING: 'primary' }
const CATEGORIES = [...new Set(LAB.map((l) => l.category))]

/* ---------- a-lab: усі розпізнавання ---------- */

export function ALab({ go }: ScreenProps) {
  const [, setRun] = useBagState('a.labRun', 'ex-7f3a')
  const [cat, setCat] = useState('')
  const [status, setStatus] = useState('')
  const [kind, setKind] = useState('')
  const rows = LAB.filter((l) => !cat || l.category === cat)
    .filter((l) => !status || l.status === status)
    .filter((l) => !kind || (kind === 'test' ? l.test : !l.test))

  const columns: Column<LabItem>[] = [
    { key: 'when', header: 'Когда', width: '16%', mono: true, sortValue: (l) => l.when, cell: (l) => dt(l.when) },
    {
      key: 'cat',
      header: 'Документ',
      width: '24%',
      sortValue: (l) => l.category,
      cell: (l) => (
        <span className="flex flex-col leading-tight">
          <span className="font-medium">{l.category}</span>
          <span className={cn('flex items-center gap-1 text-sm', l.test ? 'text-primary' : 'text-muted-foreground')}>
            {!l.test && <Lock className="size-3" />}
            {l.test ? 'тестовый' : 'реальный, значения закрыты'}
          </span>
        </span>
      ),
    },
    { key: 'status', header: 'Состояние', width: '18%', sortValue: (l) => l.status, cell: (l) => <StatusDot tone={TONE[l.status]}>{LAB_STATUS_LABEL[l.status]}</StatusDot> },
    { key: 'photos', header: 'Фото', width: '10%', align: 'right', mono: true, cell: (l) => l.photos },
    { key: 'runs', header: 'Запуски', width: '10%', align: 'right', mono: true, sortValue: (l) => l.runs, cell: (l) => l.runs },
    { key: 'conf', header: 'Подтверждено', align: 'right', cell: (l) => (l.confirmed ? 'да' : <span className="text-muted-foreground">нет</span>) },
  ]

  return (
    <AdminPage active="a-lab" go={go}>
      <PageHeader
        title="Лаборатория"
        description="Все распознавания и что вернул каждый движок. Фото и значения открываются только у тестовых документов; у реальных — запуски, время и стоимость."
        actions={
          <Button variant="outline" onClick={() => go('a-lab-effect')}>
            <BarChart3 /> Эффективность
          </Button>
        }
      />
      <FilterBar onReset={cat || status || kind ? () => (setCat(''), setStatus(''), setKind('')) : undefined} count={rows.length}>
        <FilterSelect label="Документ" value={cat} onChange={setCat} options={CATEGORIES} />
        <FilterSelect label="Состояние" value={status} onChange={setStatus} options={Object.entries(LAB_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
        <FilterSelect label="Какие" value={kind} onChange={setKind} options={[{ value: 'test', label: 'Тестовые' }, { value: 'real', label: 'Реальные' }]} />
      </FilterBar>
      <DataTable columns={columns} rows={rows} rowKey={(l) => l.id} onRowClick={(l) => (setRun(l.id), go('a-lab-run'))} initialSort={{ key: 'when', dir: 'desc' }} empty={{ icon: FlaskConical, title: 'Подходящих распознаваний нет', text: 'Сбросьте фильтры или загрузите тестовый документ с лабораторного аккаунта.' }} />
    </AdminPage>
  )
}

/* ---------- a-lab-run: один прогін ---------- */

export function ALabRun({ go }: ScreenProps) {
  const [id] = useBagState('a.labRun', 'ex-7f3a')
  const item = LAB.find((l) => l.id === id) ?? LAB[0]

  const runCols: Column<LabRun>[] = [
    { key: 'e', header: 'Движок', width: '22%', cell: (r) => <span className="font-medium">{r.engine}</span> },
    { key: 's', header: 'Состояние', width: '14%', cell: (r) => <StatusDot tone={r.state === 'ok' ? 'success' : 'error'}>{r.state === 'ok' ? 'Готово' : 'Ошибка'}</StatusDot> },
    { key: 't', header: 'Время', width: '10%', align: 'right', cell: (r) => <MonoNums text={`${String(r.sec).replace('.', ',')} с`} /> },
    { key: 'c', header: 'Стоимость', width: '11%', align: 'right', mono: true, cell: (r) => r.cost },
    { key: 'k', header: 'Токены', width: '17%', align: 'right', mono: true, cell: (r) => r.tokens },
    { key: 'r', header: 'Ошибка', cell: (r) => (r.error ? <span className="text-signal" title={r.error}>{r.error}</span> : <span className="text-muted-foreground">—</span>) },
  ]

  const cell = (v: string, ok: string) => (
    <span className={cn(item.confirmed && v !== ok && 'text-signal')}>
      <MonoNums text={v} />
    </span>
  )
  const fieldCols: Column<LabField>[] = [
    { key: 'f', header: 'Поле', width: '22%', cell: (f) => <span className="text-muted-foreground">{f.field}</span> },
    { key: 'c', header: 'Подтверждено', width: '26%', cell: (f) => (
        <span className="font-medium">
          <MonoNums text={f.confirmed} />
        </span>
      ) },
    { key: 'a', header: 'Claude Sonnet', width: '26%', cell: (f) => cell(f.a, f.confirmed) },
    { key: 'b', header: 'GPT Vision', cell: (f) => cell(f.b, f.confirmed) },
  ]

  return (
    <AdminPage active="a-lab" go={go}>
      <PageHeader
        back={{ label: 'Все распознавания', onClick: () => go('a-lab') }}
        title={`Распознавание: ${item.category}`}
        meta={
          <>
            <StatusDot tone={TONE[item.status]}>{LAB_STATUS_LABEL[item.status]}</StatusDot>
            <Mono>{dt(item.when)}</Mono>
            <Mono>{item.id}</Mono>
          </>
        }
      />
      <ViewState loading={{ kind: 'cards', rows: 2 }} empty={{ icon: FlaskConical, title: 'Распознавание удалено', text: 'Моряк удалил документ, запуски остались в статистике.' }}>
        {!item.test && (
          <Note className="mb-6">
            <span className="flex items-center gap-2">
              <Lock className="size-4 shrink-0" /> Это реальный документ: фото и значения закрыты. Видны только запуски, время и стоимость.
            </span>
          </Note>
        )}
        <div className={cn('grid gap-8', item.test ? 'grid-cols-[260px_minmax(0,1fr)]' : 'grid-cols-1')}>
          {item.test && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: Math.min(item.photos, 2) }, (_, i) => (
                <div key={i} className="flex aspect-[3/2] flex-col items-center justify-center gap-2 rounded-xl border border-border bg-muted text-sm text-muted-foreground">
                  <FileText className="size-6" />
                  <span>
                    Страница <Mono>{i + 1}</Mono>
                  </span>
                  <span className="text-xs">тестовый образец</span>
                </div>
              ))}
              <Facts cols={2} items={[['Фото', <Mono key="p">{item.photos}</Mono>], ['Запуски', <Mono key="r">{item.runs}</Mono>]]} className="mt-2" />
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <h2 className="mb-3 text-lg font-semibold">Запуски</h2>
            <DataTable ignoreView columns={runCols} rows={LAB_RUNS.slice(0, Math.max(1, item.runs))} rowKey={(r) => r.engine} />
            {item.test && (
              <>
                <SectionTitle aside={item.confirmed ? <span className="text-sm text-muted-foreground">красным — отличается от подтверждённого</span> : undefined}>По полям</SectionTitle>
                {!item.confirmed && <Note tone="warning" className="mb-3">Ещё не подтверждено: сравнивать не с чем.</Note>}
                <DataTable ignoreView columns={item.confirmed ? fieldCols : fieldCols.filter((c) => c.key !== 'c')} rows={LAB_FIELDS} rowKey={(f) => f.field} />
              </>
            )}
          </div>
        </div>
      </ViewState>
    </AdminPage>
  )
}

/* ---------- a-lab-effect: ефективність ---------- */

function Accuracy({ r }: { r: EffRow }) {
  if (r.mock) return <span className="text-muted-foreground">mock: не в рейтинге</span>
  const p = (r.correct / r.compared) * 100
  return (
    <span className="flex items-center gap-3">
      <span className="h-1.5 w-28 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${p}%` }} />
      </span>
      <Mono className="w-12 font-medium">{p.toFixed(1).replace('.', ',')} %</Mono>
      <span className="text-sm text-muted-foreground">
        <Mono>{r.correct.toLocaleString('ru')}</Mono> из <Mono>{r.compared.toLocaleString('ru')}</Mono>
      </span>
    </span>
  )
}

export function ALabEffect({ go }: ScreenProps) {
  const [cat, setCat] = useState('')
  const cats = ['Seafarer’s ID', 'Диплом', 'Загранпаспорт', 'Сертификат', 'Медицинский']

  const cols: Column<EffRow>[] = [
    { key: 'e', header: 'Движок', width: '17%', sortValue: (r) => r.engine, cell: (r) => <span className="font-medium">{r.engine}</span> },
    { key: 'd', header: 'Документы', width: '10%', align: 'right', mono: true, sortValue: (r) => r.docs, cell: (r) => r.docs },
    { key: 'a', header: 'Верные поля', width: '33%', sortValue: (r) => (r.mock ? -1 : r.correct / r.compared), cell: (r) => <Accuracy r={r} /> },
    { key: 'c', header: 'За документ', width: '11%', align: 'right', mono: true, cell: (r) => r.cost },
    { key: 't', header: 'Время', width: '9%', align: 'right', sortValue: (r) => r.sec, cell: (r) => <MonoNums text={`${String(r.sec).replace('.', ',')} с`} /> },
    { key: 'm', header: 'Чаще исправляют', cell: (r) => <span className="text-muted-foreground">{r.corrected}</span> },
  ]

  type FRow = (typeof EFFECT_FIELDS)[number]
  const fieldCols: Column<FRow>[] = [
    { key: 'f', header: 'Поле', width: '20%', cell: (f) => <span className="font-medium">{f.field}</span> },
    ...EFFECT_ENGINES.map((e, i) => ({
      key: e,
      header: e,
      width: '20%',
      align: 'right' as const,
      sortValue: (f: FRow) => f.vals[i] ?? -1,
      cell: (f: FRow) => {
        const v = f.vals[i]
        if (v === null) return <span className="text-sm text-muted-foreground">мало документов</span>
        const best = Math.max(...f.vals.filter((x): x is number => x !== null))
        return <Mono className={cn(v === best && 'font-semibold text-primary', v < 85 && 'text-warning')}>{v} %</Mono>
      },
    })),
  ]

  type ARow = (typeof AGREEMENT)[number]
  const agrCols: Column<ARow>[] = [
    { key: 'p', header: 'Движки', width: '50%', cell: (a) => a.pair },
    { key: 'r', header: 'Одинаковое значение', width: '25%', align: 'right', mono: true, sortValue: (a) => a.rate, cell: (a) => `${a.rate} %` },
    { key: 'f', header: 'Полей сравнили', align: 'right', mono: true, cell: (a) => a.fields.toLocaleString('ru') },
  ]

  return (
    <AdminPage active="a-lab" go={go}>
      <PageHeader
        back={{ label: 'Лаборатория', onClick: () => go('a-lab') }}
        title="Эффективность"
        description="Как часто движок верно читает поле — по сравнению со значениями, которые подтвердили моряки. Только цифры, без значений из документов."
      />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {['', ...cats].map((c) => (
          <button
            key={c || 'all'}
            type="button"
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={cn('h-9 rounded-full border px-4 text-sm font-medium transition-colors', cat === c ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:bg-muted')}
          >
            {c || 'Все документы'}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground">
          подтверждённых документов: <Mono>{cat ? 37 : 184}</Mono>
        </span>
      </div>
      <DataTable columns={cols} rows={EFFECT} rowKey={(r) => r.engine} initialSort={{ key: 'a', dir: 'desc' }} empty={{ icon: BarChart3, title: 'Пока ничего не подтверждено', text: 'Цифры появятся, когда моряки подтвердят первые документы.' }} />

      <SectionTitle>По полям</SectionTitle>
      <p className="mb-3 max-w-[720px] text-sm text-muted-foreground">Поля о здоровье и разбивку по полю при меньше чем 5 реальных документах не показываем. Строки списков (стаж, должности) сопоставляются по дате посадки и судну.</p>
      {cat === 'Медицинский' ? (
        <Note>Для медицинских документов разбивку по полям не показываем: это данные о здоровье.</Note>
      ) : (
        <DataTable columns={fieldCols} rows={EFFECT_FIELDS} rowKey={(f) => f.field} />
      )}

      <SectionTitle>Совпадение между движками</SectionTitle>
      <DataTable columns={agrCols} rows={AGREEMENT} rowKey={(a) => a.pair} initialSort={{ key: 'r', dir: 'desc' }} />
    </AdminPage>
  )
}
