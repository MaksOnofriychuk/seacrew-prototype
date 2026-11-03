import { useState } from 'react'
import { FileText, Plus, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { WebDatePick } from '@/components/web/web-pickers'
import { BOUNDS, isoToRu, ruToIso } from '@/lib/dates'
import { FilterBar, FilterSelect } from '@/components/web/filter-bar'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { LANGS, MAILINGS, TEXTS, TEXT_STATE_LABEL, type Mailing, type TextItem, type TextKind, type TextState } from '@/lib/data-admin-2'
import '@/lib/data-admin-53-f'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { AdminPage, AdminTabs, CancelButton, Facts, Mono, Note, PeriodFilter, SideSheet, dt, inPeriod, useBagState } from '../a/_parts'
import { Sample } from './_parts'

type Tab = TextKind | 'mail'
const TONE: Record<TextState, Tone> = { draft: 'muted', review: 'warning', approved: 'success' }
const MAIL_STATE: Record<Mailing['state'], { tone: Tone; label: string }> = { on: { tone: 'success', label: 'Работает' }, off: { tone: 'muted', label: 'Выключена' }, draft: { tone: 'muted', label: 'Черновик' } }

export function A2Content({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [texts, setTexts] = useBagState<TextItem[]>('a2.texts', TEXTS)
  const [mails, setMails] = useBagState<Mailing[]>('a2.mails', MAILINGS)
  const [tab, setTab] = useState<Tab>('app')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [creating, setCreating] = useState(false)
  const [st, setSt] = useState('')
  const [nm, setNm] = useState({ title: '', channel: 'Push' as Mailing['channel'], audience: 'Все моряки', date: '', text: '' })
  const [ru, setRu] = useState('')
  const [en, setEn] = useState('')
  const text = tab !== 'mail' ? texts.find((t) => t.id === openId) : undefined
  const mail = tab === 'mail' ? mails.find((m) => m.id === openId) : undefined

  const textRows = texts.filter((t) => t.kind === tab).filter((t) => !st || t.state === st).filter((t) => inPeriod(t.updated, from, to)).filter((t) => !q || (t.title + t.key + t.ru).toLowerCase().includes(q.toLowerCase()))
  const mailRows = mails.filter((m) => !st || m.state === st).filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase()))

  const createMail = () => {
    const m: Mailing = { id: 'm' + Date.now(), title: nm.title.trim(), channel: nm.channel, trigger: `Один раз, ${dt(nm.date)}`, audience: nm.audience, state: 'draft', sent: 0 }
    setMails([m, ...mails])
    setCreating(false)
    setNm({ title: '', channel: 'Push', audience: 'Все моряки', date: '', text: '' })
    showToast('Рассылка сохранена как черновик')
  }

  const openText = (t: TextItem) => {
    setOpenId(t.id)
    setRu(t.ru)
    setEn(t.en)
  }
  const saveText = (state: TextState, toast: string) => {
    if (!text) return
    const changed = ru !== text.ru || en !== text.en
    setTexts(texts.map((t) => (t.id === text.id ? { ...t, ru, en, state, updated: '2026-11-02', translated: changed ? Math.min(t.translated, 2) : t.translated } : t)))
    showToast(toast)
    setOpenId(null)
  }

  const textCols: Column<TextItem>[] = [
    {
      key: 'title',
      header: 'Где',
      width: '28%',
      sortValue: (t) => t.title,
      cell: (t) => (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-medium" title={t.title}>{t.title}</span>
          <span className="truncate font-mono text-xs text-muted-foreground" title={t.key}>{t.key}</span>
        </span>
      ),
    },
    { key: 'ru', header: 'Текст', width: '36%', cell: (t) => <span className="block truncate" title={t.ru}>{t.ru}</span> },
    {
      key: 'tr',
      header: 'Переводы',
      width: '11%',
      sortValue: (t) => t.translated,
      cell: (t) => (
        <Mono className={t.translated < LANGS.length ? 'text-muted-foreground' : ''}>
          {t.translated}/{LANGS.length}
        </Mono>
      ),
    },
    { key: 'state', header: 'Статус', width: '13%', sortValue: (t) => t.state, cell: (t) => <StatusDot tone={TONE[t.state]}>{TEXT_STATE_LABEL[t.state]}</StatusDot> },
    { key: 'upd', header: 'Изменён', mono: true, sortValue: (t) => t.updated, cell: (t) => dt(t.updated) },
  ]

  const mailCols: Column<Mailing>[] = [
    { key: 'title', header: 'Рассылка', width: '28%', sortValue: (m) => m.title, cell: (m) => <span className="block truncate font-medium" title={m.title}>{m.title}</span> },
    { key: 'ch', header: 'Канал', width: '13%', cell: (m) => <span className="text-muted-foreground">{m.channel}</span> },
    { key: 'when', header: 'Когда', width: '22%', cell: (m) => <span className="block truncate" title={m.trigger}>{m.trigger}</span> },
    { key: 'aud', header: 'Кому', width: '17%', cell: (m) => <span className="block truncate text-muted-foreground" title={m.audience}>{m.audience}</span> },
    { key: 'sent', header: 'Отправлено', width: '10%', align: 'right', mono: true, sortValue: (m) => m.sent, cell: (m) => m.sent.toLocaleString('ru') },
    { key: 'state', header: 'Статус', sortValue: (m) => m.state, cell: (m) => <StatusDot tone={MAIL_STATE[m.state].tone}>{MAIL_STATE[m.state].label}</StatusDot> },
  ]

  return (
    <AdminPage active="a2-content" go={go}>
      <PageHeader
        title="Тексты и рассылки"
        description="Тексты приложения, ответы на частые вопросы и письма. Мы пишем черновик на русском и английском, заказчик утверждает, потом текст уходит переводчикам."
        actions={
          tab === 'mail' && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Новая рассылка
            </Button>
          )
        }
        meta={
          <span className="flex items-center gap-2">
            Кто пишет и утверждает тексты — пока наше предложение <Sample q="152–154" />
          </span>
        }
      />
      <AdminTabs<Tab>
        tabs={[
          { id: 'app', label: 'Приложение', count: texts.filter((t) => t.kind === 'app').length },
          { id: 'faq', label: 'Вопросы и ответы', count: texts.filter((t) => t.kind === 'faq').length },
          { id: 'email', label: 'Письма', count: texts.filter((t) => t.kind === 'email').length },
          { id: 'mail', label: 'Рассылки', count: mails.length },
        ]}
        value={tab}
        onChange={(t) => (setTab(t), setQ(''), setFrom(''), setTo(''), setSt(''), setOpenId(null))}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: tab === 'mail' ? 'Название рассылки' : 'Текст или ключ' }} onReset={from || to || q || st ? () => (setFrom(''), setTo(''), setQ(''), setSt('')) : undefined} count={tab === 'mail' ? mailRows.length : textRows.length}>
        <FilterSelect
          label="Статус"
          value={st}
          onChange={setSt}
          options={tab === 'mail' ? (Object.keys(MAIL_STATE) as Mailing['state'][]).map((k) => ({ value: k, label: MAIL_STATE[k].label })) : (Object.keys(TEXT_STATE_LABEL) as TextState[]).map((k) => ({ value: k, label: TEXT_STATE_LABEL[k] }))}
        />
        {tab !== 'mail' && <PeriodFilter label="Изменён" from={from} to={to} onChange={(a, b) => (setFrom(a), setTo(b))} />}
      </FilterBar>
      {tab === 'mail' ? (
        <DataTable
          columns={mailCols}
          rows={mailRows}
          rowKey={(m) => m.id}
          onRowClick={(m) => setOpenId(m.id)}
          selectedKey={openId ?? undefined}
          pageSizes={[10, 20, 50]}
          sortOptions={[
            { key: 'sent', dir: 'desc', label: 'Отправлено: сначала больше' },
            { key: 'sent', dir: 'asc', label: 'Отправлено: сначала меньше' },
            { key: 'title', dir: 'asc', label: 'Название: А — Я' },
            { key: 'state', dir: 'asc', label: 'Статус' },
          ]}
          empty={q || st ? { icon: Send, title: 'Ничего не нашлось', text: 'Проверьте запрос или сбросьте фильтр.' } : { icon: Send, title: 'Рассылок нет', text: 'Автоматические уведомления и письма появятся здесь.' }}
        />
      ) : (
        <DataTable
          columns={textCols}
          rows={textRows}
          rowKey={(t) => t.id}
          onRowClick={openText}
          selectedKey={openId ?? undefined}
          initialSort={{ key: 'upd', dir: 'desc' }}
          pageSizes={[10, 20, 50]}
          sortOptions={[
            { key: 'upd', dir: 'desc', label: 'Изменён: сначала новые' },
            { key: 'upd', dir: 'asc', label: 'Изменён: сначала старые' },
            { key: 'title', dir: 'asc', label: 'Где: А — Я' },
            { key: 'tr', dir: 'asc', label: 'Переводы: сначала меньше' },
            { key: 'state', dir: 'asc', label: 'Статус' },
          ]}
          empty={q || st || from || to ? { icon: FileText, title: 'Ничего не нашлось', text: 'Проверьте запрос или сбросьте фильтр.' } : { icon: FileText, title: 'Текстов пока нет' }}
        />
      )}

      <SideSheet
        open={!!text}
        onOpenChange={(v) => !v && setOpenId(null)}
        title={text?.title}
        description={text ? <Mono>{text.key}</Mono> : undefined}
        footer={
          text && (
            <>
              <Button variant="ghost" className="mr-auto text-primary" onClick={() => saveText('draft', 'Черновик сохранён')}>
                Сохранить черновик
              </Button>
              {text.state === 'review' ? (
                <Button onClick={() => saveText('approved', 'Текст утверждён, уходит переводчикам')}>Заказчик утвердил</Button>
              ) : (
                <Button onClick={() => saveText('review', 'Текст отправлен заказчику')}>Отправить заказчику</Button>
              )}
            </>
          )
        }
      >
        {text && (
          <>
            <StatusDot tone={TONE[text.state]}>{TEXT_STATE_LABEL[text.state]}</StatusDot>
            <WebField id="tx-ru" label="Русский" hint={<><Mono>{ru.length}</Mono> знаков</>}>
              <WebTextarea id="tx-ru" value={ru} onChange={(e) => setRu(e.target.value)} />
            </WebField>
            <WebField id="tx-en" label="English" hint={<><Mono>{en.length}</Mono> знаков</>}>
              <WebTextarea id="tx-en" value={en} onChange={(e) => setEn(e.target.value)} />
            </WebField>
            <Note>
              Переведено на <Mono>{text.translated}</Mono> из <Mono>{LANGS.length}</Mono> языков: {LANGS.slice(0, text.translated).join(', ') || 'пока ни на один'}. Если поменять текст, переводы уйдут на проверку заново.
            </Note>
          </>
        )}
      </SideSheet>

      <SideSheet
        open={creating}
        onOpenChange={setCreating}
        title="Новая рассылка"
        description="Сохранится черновиком. Отправится в выбранный день, когда вы её включите."
        footer={
          <>
            <CancelButton onClick={() => setCreating(false)} />
            <Button disabled={!nm.title.trim() || !nm.date} onClick={createMail}>
              Сохранить черновик
            </Button>
          </>
        }
      >
        <WebField id="nm-title" label="Название" required hint="Видно только команде.">
          <WebInput id="nm-title" value={nm.title} onChange={(e) => setNm({ ...nm, title: e.target.value })} placeholder="Например: Новые вакансии недели" />
        </WebField>
        <div className="grid grid-cols-2 gap-3">
          <WebField id="nm-ch" label="Канал">
            <WebSelect id="nm-ch" value={nm.channel} onChange={(v) => setNm({ ...nm, channel: v as Mailing['channel'] })} options={['Push', 'Email', 'Push и email']} />
          </WebField>
          <WebField id="nm-aud" label="Кому">
            <WebSelect id="nm-aud" value={nm.audience} onChange={(v) => setNm({ ...nm, audience: v })} options={['Все моряки', 'Новые моряки', 'Без премиума', 'Активные за 30 дней', 'Рекрутеры']} />
          </WebField>
        </div>
        <WebField id="nm-date" label="Когда отправить" required hint="Не раньше сегодняшнего дня.">
          <WebDatePick id="nm-date" value={isoToRu(nm.date)} onChange={(v) => setNm({ ...nm, date: ruToIso(v) })} {...BOUNDS.future} className="w-48" />
        </WebField>
        <WebField id="nm-text" label="Текст" hint="Можно написать позже, в черновике.">
          <WebTextarea id="nm-text" value={nm.text} onChange={(e) => setNm({ ...nm, text: e.target.value })} />
        </WebField>
      </SideSheet>

      <SideSheet
        open={!!mail}
        onOpenChange={(v) => !v && setOpenId(null)}
        title={mail?.title}
        description={mail?.channel}
        footer={
          mail && (
            <Button
              variant={mail.state === 'on' ? 'outline' : 'default'}
              onClick={() => {
                setMails(mails.map((m) => (m.id === mail.id ? { ...m, state: mail.state === 'on' ? 'off' : 'on' } : m)))
                showToast(mail.state === 'on' ? 'Рассылка выключена' : 'Рассылка включена')
                setOpenId(null)
              }}
            >
              {mail.state === 'on' ? 'Выключить' : 'Включить'}
            </Button>
          )
        }
      >
        {mail && (
          <Facts
            className="[&_dd]:whitespace-normal"
            cols={2}
            items={[
              ['Когда', mail.trigger],
              ['Кому', mail.audience],
              ['Отправлено', <Mono key="s">{mail.sent.toLocaleString('ru')}</Mono>],
              ['Статус', <StatusDot key="st" tone={MAIL_STATE[mail.state].tone}>{MAIL_STATE[mail.state].label}</StatusDot>],
            ]}
          />
        )}
        {mail && <Note>Текст рассылки берётся из вкладки «Письма» или «Приложение» — правьте его там.</Note>}
      </SideSheet>
    </AdminPage>
  )
}
