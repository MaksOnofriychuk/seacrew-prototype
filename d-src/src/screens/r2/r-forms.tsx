import { useState } from 'react'
import { FileText, Inbox, Plus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { ASSIGNMENT_STATUS_LABEL, ASSIGNMENTS, FORMS, seafarerById, type Assignment, type WebForm } from '@/lib/data-web'
import { FORM_DEFS } from '@/lib/data-recruiter-2'
import type { ScreenProps } from '../registry'
import { ASSIGNMENT_TONE, ruDate, useR2 } from './_parts'

type Tab = 'forms' | 'answers'

// r-forms — анкети агентства (contract-recruiter-web §4) і відповіді моряків на них.
export function RForms({ go }: ScreenProps) {
  const r = useR2()
  const [tab, setTab] = useState<Tab>('forms')
  const [q, setQ] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [aForm, setAForm] = useState('')
  const [aStatus, setAStatus] = useState('')
  const needle = q.trim().toLowerCase()
  const forms = FORMS.filter((f) => (!fStatus || f.status === fStatus) && (!needle || f.title.toLowerCase().includes(needle) || ASSIGNMENTS.some((a) => a.formId === f.id && seafarerById(a.seafarerId)!.name.toLowerCase().includes(needle))))
  const answers = ASSIGNMENTS.filter((a) => (!aForm || a.formId === aForm) && (!aStatus || a.status === aStatus) && (!needle || seafarerById(a.seafarerId)!.name.toLowerCase().includes(needle) || FORMS.find((f) => f.id === a.formId)!.title.toLowerCase().includes(needle)))
  const switchTab = (t: Tab) => {
    setTab(t)
    setQ('')
  }

  const formCols: Column<WebForm>[] = [
    {
      key: 'title',
      header: 'Анкета',
      width: '27%',
      sortValue: (f) => f.title,
      cell: (f) => (
        <span className="flex flex-col">
          <span className="truncate font-medium">{f.title}</span>
          <span className="text-[13px] text-muted-foreground">{f.source === 'import' ? 'Импортирована из PDF' : 'Собрана в конструкторе'}</span>
        </span>
      ),
    },
    {
      key: 'size',
      header: 'Структура',
      width: '12%',
      cell: (f) => (
        <span className="text-muted-foreground">
          <span className="font-mono text-foreground">{FORM_DEFS[f.id]?.length ?? f.sections}</span> / <span className="font-mono text-foreground">{FORM_DEFS[f.id]?.reduce((n, x) => n + x.fields.length, 0) ?? f.fields}</span>
        </span>
      ),
    },
    {
      key: 'to',
      header: 'Кому отправлена',
      width: '20%',
      cell: (f) => {
        const names = ASSIGNMENTS.filter((a) => a.formId === f.id).map((a) => seafarerById(a.seafarerId)!.name)
        if (!names.length) return <span className="text-muted-foreground">Никому</span>
        return (
          <span className="truncate">
            {names.slice(0, 2).join(', ')}
            {f.sent > 2 && <span className="text-muted-foreground"> и ещё <span className="font-mono">{f.sent - Math.min(2, names.length)}</span></span>}
          </span>
        )
      },
    },
    {
      key: 'answers',
      header: 'Ответили',
      width: '12%',
      sortValue: (f) => f.answered,
      cell: (f) => (
        <span className="text-muted-foreground">
          <span className="font-mono text-foreground">{f.answered}</span> из <span className="font-mono">{f.sent}</span>
        </span>
      ),
    },
    { key: 'updated', header: 'Изменена', width: '12%', mono: true, sortValue: (f) => f.updated, cell: (f) => ruDate(f.updated) },
    { key: 'status', header: 'Статус', width: '17%', cell: (f) => <StatusDot tone={f.status === 'active' ? 'success' : 'muted'}>{f.status === 'active' ? 'Опубликована' : 'Черновик'}</StatusDot> },
  ]

  const answerCols: Column<Assignment>[] = [
    {
      key: 'who',
      header: 'Моряк',
      width: '30%',
      sortValue: (a) => seafarerById(a.seafarerId)!.name,
      cell: (a) => {
        const s = seafarerById(a.seafarerId)!
        return (
          <span className="flex items-center gap-3">
            <WebAvatar initials={s.initials} size="sm" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium">{s.name}</span>
              <span className="truncate text-[13px] text-muted-foreground">{s.position}</span>
            </span>
          </span>
        )
      },
    },
    { key: 'form', header: 'Анкета', width: '34%', sortValue: (a) => a.formId, cell: (a) => FORMS.find((f) => f.id === a.formId)?.title },
    { key: 'status', header: 'Статус', width: '18%', cell: (a) => <StatusDot tone={ASSIGNMENT_TONE[a.status]}>{ASSIGNMENT_STATUS_LABEL[a.status]}</StatusDot> },
    { key: 'date', header: 'Дата', width: '18%', mono: true, sortValue: (a) => a.date, cell: (a) => ruDate(a.date) },
  ]

  const newForm = () => {
    r.openForm('new')
    go('r-form-edit')
  }

  return (
    <WebShell variant="recruiter" active="r-forms" go={go}>
      <PageHeader
        title="Анкеты"
        description="Анкеты вашего агентства. Моряк заполняет их в приложении, большая часть подставляется из профиля."
        actions={
          <>
            <Button variant="outline" onClick={() => go('r-form-import')}>
              <Upload /> Импорт анкеты
            </Button>
            <Button onClick={newForm}>
              <Plus /> Новая анкета
            </Button>
          </>
        }
      />
      <PageTabs<Tab>
        value={tab}
        onChange={switchTab}
        tabs={[
          { id: 'forms', label: 'Анкеты', count: FORMS.length },
          { id: 'answers', label: 'Ответы моряков', count: ASSIGNMENTS.length },
        ]}
      />
      {tab === 'forms' ? (
        <>
          <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Название анкеты или моряк' }} count={forms.length} onReset={q || fStatus ? () => (setQ(''), setFStatus('')) : undefined}>
            <FilterSelect label="Статус" value={fStatus} onChange={setFStatus} options={[{ value: 'active', label: 'Опубликована' }, { value: 'draft', label: 'Черновик' }]} />
          </FilterBar>
        <DataTable
          key="forms"
          columns={formCols}
          rows={forms}
          rowKey={(f) => f.id}
          onRowClick={(f) => {
            r.openForm(f.id)
            go('r-form-edit')
          }}
          empty={{
            icon: FileText,
            title: 'Анкет пока нет',
            text: 'Соберите анкету в конструкторе или загрузите ту, что уже используете: PDF, Word или фото бланка.',
            action: (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => go('r-form-import')}>
                  <Upload /> Импорт анкеты
                </Button>
                <Button onClick={newForm}>
                  <Plus /> Новая анкета
                </Button>
              </div>
            ),
          }}
        />
        </>
      ) : (
        <>
          <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Моряк или анкета' }} count={answers.length} onReset={q || aForm || aStatus ? () => (setQ(''), setAForm(''), setAStatus('')) : undefined}>
            <FilterSelect label="Анкета" value={aForm} onChange={setAForm} options={FORMS.filter((f) => f.sent > 0).map((f) => ({ value: f.id, label: f.title }))} />
            <FilterSelect label="Статус" value={aStatus} onChange={setAStatus} options={Object.entries(ASSIGNMENT_STATUS_LABEL).map(([value, label]) => ({ value, label }))} />
          </FilterBar>
        <DataTable
          key="answers"
          columns={answerCols}
          rows={answers}
          rowKey={(a) => a.id}
          onRowClick={(a) => {
            r.openAssignment(a.id)
            go('r-assignment')
          }}
          initialSort={{ key: 'date', dir: 'desc' }}
          empty={{ icon: Inbox, title: 'Ответов пока нет', text: 'Отправьте анкету моряку из разговора — его ответ появится здесь.' }}
        />
        </>
      )}
    </WebShell>
  )
}
