import { useState } from 'react'
import { FileText, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebField, WebTextarea } from '@/components/web/fields'
import { FilterBar } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { LANGS, MAILINGS, TEXTS, TEXT_STATE_LABEL, type Mailing, type TextItem, type TextKind, type TextState } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { AdminPage, Facts, Mono, Note, SideSheet, dt, useBagState } from '../a/_parts'
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
  const [ru, setRu] = useState('')
  const [en, setEn] = useState('')
  const text = tab !== 'mail' ? texts.find((t) => t.id === openId) : undefined
  const mail = tab === 'mail' ? mails.find((m) => m.id === openId) : undefined

  const textRows = texts.filter((t) => t.kind === tab).filter((t) => !q || (t.title + t.key + t.ru).toLowerCase().includes(q.toLowerCase()))
  const mailRows = mails.filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase()))

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
          <span className="truncate font-medium">{t.title}</span>
          <Mono className="truncate text-xs text-muted-foreground">{t.key}</Mono>
        </span>
      ),
    },
    { key: 'ru', header: 'Текст', width: '36%', cell: (t) => <span className="block truncate">{t.ru}</span> },
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
    { key: 'title', header: 'Рассылка', width: '28%', sortValue: (m) => m.title, cell: (m) => <span className="truncate font-medium">{m.title}</span> },
    { key: 'ch', header: 'Канал', width: '13%', cell: (m) => <span className="text-muted-foreground">{m.channel}</span> },
    { key: 'when', header: 'Когда', width: '22%', cell: (m) => <span className="truncate">{m.trigger}</span> },
    { key: 'aud', header: 'Кому', width: '17%', cell: (m) => <span className="truncate text-muted-foreground">{m.audience}</span> },
    { key: 'sent', header: 'Отправлено', width: '10%', align: 'right', mono: true, sortValue: (m) => m.sent, cell: (m) => m.sent.toLocaleString('ru') },
    { key: 'state', header: 'Статус', cell: (m) => <StatusDot tone={MAIL_STATE[m.state].tone}>{MAIL_STATE[m.state].label}</StatusDot> },
  ]

  return (
    <AdminPage active="a-refs" go={go}>
      <PageHeader
        title="Тексты и рассылки"
        description="Тексты приложения, ответы на частые вопросы и письма. Мы пишем черновик на русском и английском, заказчик утверждает, потом текст уходит переводчикам."
        meta={
          <span className="flex items-center gap-2">
            Кто пишет и утверждает тексты — пока наше предложение <Sample q="152–154" />
          </span>
        }
      />
      <PageTabs<Tab>
        tabs={[
          { id: 'app', label: 'Приложение', count: texts.filter((t) => t.kind === 'app').length },
          { id: 'faq', label: 'Вопросы и ответы', count: texts.filter((t) => t.kind === 'faq').length },
          { id: 'email', label: 'Письма', count: texts.filter((t) => t.kind === 'email').length },
          { id: 'mail', label: 'Рассылки', count: mails.length },
        ]}
        value={tab}
        onChange={(t) => (setTab(t), setQ(''), setOpenId(null))}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: tab === 'mail' ? 'Название рассылки' : 'Текст или ключ' }} count={tab === 'mail' ? mailRows.length : textRows.length} />
      {tab === 'mail' ? (
        <DataTable columns={mailCols} rows={mailRows} rowKey={(m) => m.id} onRowClick={(m) => setOpenId(m.id)} selectedKey={openId ?? undefined} empty={{ icon: Send, title: 'Рассылок нет', text: 'Автоматические уведомления и письма появятся здесь.' }} />
      ) : (
        <DataTable
          columns={textCols}
          rows={textRows}
          rowKey={(t) => t.id}
          onRowClick={openText}
          selectedKey={openId ?? undefined}
          initialSort={{ key: 'upd', dir: 'desc' }}
          empty={q ? { icon: FileText, title: 'Ничего не нашлось', text: 'Проверьте запрос.' } : { icon: FileText, title: 'Текстов пока нет' }}
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
            <WebField id="tx-en" label="English">
              <WebTextarea id="tx-en" value={en} onChange={(e) => setEn(e.target.value)} />
            </WebField>
            <Note>
              Переведено на <Mono>{text.translated}</Mono> из <Mono>{LANGS.length}</Mono> языков: {LANGS.slice(0, text.translated).join(', ') || 'пока ни на один'}. Если поменять текст, переводы уйдут на проверку заново.
            </Note>
          </>
        )}
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
