import { useState } from 'react'
import { Image, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { FilterBar } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, WebAvatar, type Tone } from '@/components/web/status-badge'
import { APOST_STATE_LABEL, A_POSTS, type APost, type APostState } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { AdminPage, Mono, SideSheet, dt, useBagState } from './_parts'

const TONE: Record<APostState, Tone> = { complaint: 'warning', published: 'success', hidden: 'muted' }
type Tab = 'complaint' | 'all' | 'hidden'

export function APosts({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [posts, setPosts] = useBagState<APost[]>('a.posts', A_POSTS)
  const [, setUser] = useBagState('a.user', 'u02')
  const [tab, setTab] = useState<Tab>('complaint')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const open = posts.find((p) => p.id === openId)
  const rows = posts.filter((p) => (tab === 'all' ? true : p.state === tab)).filter((p) => !q || (p.author + p.text).toLowerCase().includes(q.toLowerCase()))

  const decide = (id: string, state: APostState, toast: string) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, state, complaints: state === 'published' ? 0 : p.complaints, reasons: state === 'published' ? [] : p.reasons } : p)))
    showToast(toast)
    setOpenId(null)
  }

  const columns: Column<APost>[] = [
    {
      key: 'author',
      header: 'Автор',
      width: '22%',
      sortValue: (p) => p.author,
      cell: (p) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={p.initials} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{p.author}</span>
            <span className="truncate text-sm text-muted-foreground">{p.role}</span>
          </span>
        </span>
      ),
    },
    { key: 'text', header: 'Публикация', width: '32%', cell: (p) => <span className="block truncate">{p.text}</span> },
    {
      key: 'cmp',
      header: 'Жалобы',
      width: '18%',
      sortValue: (p) => p.complaints,
      cell: (p) =>
        p.complaints ? (
          <span className="flex flex-col leading-tight">
            <Mono className="text-signal">{p.complaints}</Mono>
            <span className="truncate text-sm text-muted-foreground">{p.reasons.join(', ')}</span>
          </span>
        ) : (
          <Mono className="text-muted-foreground">0</Mono>
        ),
    },
    { key: 'date', header: 'Дата', width: '12%', mono: true, sortValue: (p) => p.date, cell: (p) => dt(p.date.split(' ')[0]) },
    { key: 'state', header: 'Статус', width: '16%', cell: (p) => <StatusDot tone={TONE[p.state]}>{APOST_STATE_LABEL[p.state]}</StatusDot> },
  ]

  return (
    <AdminPage active="a-posts" go={go}>
      <PageHeader title="Публикации" description="Моряки жалуются на посты в ленте — здесь вы решаете, оставить пост или скрыть. Автор скрытого поста получит уведомление." />
      <PageTabs<Tab>
        tabs={[
          { id: 'complaint', label: 'С жалобами', count: posts.filter((p) => p.state === 'complaint').length },
          { id: 'all', label: 'Все', count: posts.length },
          { id: 'hidden', label: 'Скрытые', count: posts.filter((p) => p.state === 'hidden').length },
        ]}
        value={tab}
        onChange={setTab}
      />
      <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Автор или текст' }} count={rows.length} />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => setOpenId(p.id)}
        selectedKey={openId ?? undefined}
        initialSort={{ key: 'date', dir: 'desc' }}
        empty={tab === 'complaint' && !q ? { icon: Newspaper, title: 'Жалоб нет', text: 'Когда моряк пожалуется на пост, он появится здесь.' } : { icon: Newspaper, title: 'Публикаций не нашлось', text: 'Проверьте запрос или откройте вкладку «Все».' }}
      />

      <SideSheet
        open={!!open}
        onOpenChange={(v) => !v && setOpenId(null)}
        title="Публикация"
        description={open ? <Mono>{dt(open.date)}</Mono> : undefined}
        footer={
          open && (
            <>
              {open.authorId && (
                <Button variant="ghost" className="mr-auto text-primary" onClick={() => (setUser(open.authorId!), go('a-user'))}>
                  Профиль автора
                </Button>
              )}
              {open.state === 'hidden' ? (
                <Button variant="outline" onClick={() => decide(open.id, 'published', 'Публикация снова видна')}>
                  Вернуть в ленту
                </Button>
              ) : (
                <>
                  {open.state === 'complaint' && (
                    <Button variant="outline" onClick={() => decide(open.id, 'published', 'Публикация оставлена, жалобы закрыты')}>
                      Оставить
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => decide(open.id, 'hidden', 'Публикация скрыта')}>
                    Скрыть
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {open && (
          <>
            <div className="flex items-center gap-3">
              <WebAvatar initials={open.initials} />
              <span className="flex flex-col leading-tight">
                <span className="font-medium">{open.author}</span>
                <span className="text-sm text-muted-foreground">{open.role}</span>
              </span>
            </div>
            <p className="text-[15px] leading-relaxed">{open.text}</p>
            {open.photos > 0 && (
              <div className="flex h-32 items-center justify-center gap-2 rounded-md bg-muted text-sm text-muted-foreground">
                <Image className="size-4" /> Фото к публикации: <Mono>{open.photos}</Mono>
              </div>
            )}
            {open.complaints > 0 && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <span className="text-sm font-medium">
                  Жалобы: <Mono>{open.complaints}</Mono>
                </span>
                <ul className="flex flex-col gap-1.5">
                  {open.reasons.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-[15px]">
                      <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </SideSheet>
    </AdminPage>
  )
}
