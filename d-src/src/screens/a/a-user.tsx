import { useState } from 'react'
import { Ban, FileText, LockOpen, UserX } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/web/data-table'
import { WebField, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { DOC_STATE_LABEL, USTATUS_LABEL, aUser } from '@/lib/data-admin'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { USTATUS_TONE, useUserOverrides } from './a-users'
import { AdminPage, CancelButton, Facts, Mono, Note, SectionTitle, SideSheet, dt, useBagState } from './_parts'

const BAN_REASONS = ['Жалоба рекрутера: чужой документ', 'Поддельный документ', 'Спам в публикациях', 'Оплата за трудоустройство', 'Другое']

export function AUserScreen({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [id] = useBagState('a.user', 'u02')
  const [over, setOver] = useUserOverrides()
  const [, setRegTab] = useBagState('a.regTab', 'attempts')
  const u = { ...aUser(id), ...over[id] }
  const [sheet, setSheet] = useState<'unblock' | 'ban' | 'unban' | null>(null)
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const seafarer = u.role === 'seafarer'
  const autoBlocked = u.status === 'blocked' && u.attempts.length >= 2 && u.wrongDocs >= 2

  const patch = (p: Partial<typeof u>, toast: string) => {
    setOver({ ...over, [u.id]: { ...over[u.id], ...p } })
    showToast(toast)
    setSheet(null)
  }

  return (
    <AdminPage active="a-users" go={go}>
      <PageHeader
        back={{ label: 'Пользователи', onClick: () => go('a-users') }}
        title={
          <span className="flex items-center gap-4">
            <WebAvatar initials={u.initials} size="lg" className="border border-border bg-surface" />
            {u.name}
          </span>
        }
        meta={
          <>
            <StatusDot tone={USTATUS_TONE[u.status]}>{USTATUS_LABEL[u.status]}</StatusDot>
            <span>{seafarer ? `Моряк, ${u.position}` : `Рекрутер, ${u.org}`}</span>
          </>
        }
        actions={
          <>
            {u.status === 'banned' ? (
              <Button variant="outline" onClick={() => setSheet('unban')}>
                Снять бан
              </Button>
            ) : (
              <Button variant="outline" className="text-signal" onClick={() => setSheet('ban')}>
                <Ban /> Забанить
              </Button>
            )}
            {u.status === 'blocked' && (
              <Button onClick={() => setSheet('unblock')}>
                <LockOpen /> Разблокировать
              </Button>
            )}
          </>
        }
      />

      <ViewState empty={{ icon: UserX, title: 'Аккаунт удалён', text: 'Моряк удалил аккаунт. Отпечатки из бан-листа остались.' }} loading={{ kind: 'cards', rows: 2 }}>
        {autoBlocked && (
          <section className="mb-8 rounded-xl border border-border bg-surface">
            <div className="flex items-baseline justify-between gap-4 border-b border-border px-6 py-4">
              <h2 className="text-base font-semibold">Заблокирован автоматически</h2>
              <span className="text-sm text-muted-foreground">
                <Mono>{dt(u.blockedAt ?? '')}</Mono>
              </span>
            </div>
            <ol className="flex flex-col px-6 py-5">
              {u.attempts.map((a, i) => (
                <li key={a.at} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < u.attempts.length - 1 && <span className="absolute top-7 bottom-0 left-[13px] w-px bg-border" aria-hidden="true" />}
                  <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs', i === 0 ? 'bg-warning/15 text-warning' : 'bg-signal/15 text-signal')}>{i + 1}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-medium">Загружен не документ моряка: {a.detected.toLowerCase()}</span>
                    <span className="text-sm text-muted-foreground">
                      {a.where}, <Mono>{dt(a.at)}</Mono>
                    </span>
                    <span className="text-sm text-muted-foreground">{i === 0 ? 'Моряк увидел: «Ещё одна ошибка — и аккаунт будет заблокирован»' : 'Моряк увидел: «Аккаунт заблокирован. Для разблокировки свяжитесь с поддержкой»'}</span>
                  </div>
                </li>
              ))}
            </ol>
            <p className="border-t border-border px-6 py-3 text-sm text-muted-foreground">Сами файлы не сохраняются и здесь не показываются — только что распознал ИИ.</p>
          </section>
        )}
        {u.status !== 'active' && !autoBlocked && u.reason && (
          <Note tone="error" className="mb-8">
            {u.reason}
            {u.blockedAt && (
              <span className="text-muted-foreground">
                , <Mono>{dt(u.blockedAt)}</Mono>
              </span>
            )}
          </Note>
        )}
        {u.status === 'active' && u.wrongDocs === 1 && (
          <Note tone="warning" className="mb-8">
            Одна ошибка с документом: {u.attempts[0]?.detected.toLowerCase()}, <Mono>{dt(u.attempts[0]?.at ?? '')}</Mono>. Ещё одна подряд — и аккаунт заблокируется.
          </Note>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-10">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Аккаунт</h2>
            <Facts
              items={[
                ['Email', u.email],
                ['Регистрация', <Mono key="c">{dt(u.created)}</Mono>],
                ['Последний вход', /\d/.test(u.lastSeen) && u.lastSeen.includes('-') ? <Mono key="l">{dt(u.lastSeen)}</Mono> : u.lastSeen],
                ['Не те документы подряд', seafarer ? <Mono key="w">{u.wrongDocs} из 2</Mono> : '—'],
              ]}
            />
            {u.linked > 0 && (
              <button type="button" onClick={() => (setRegTab('linked'), go('a-registrations'))} className="mt-6 flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-left hover:bg-muted">
                <span className="flex flex-col">
                  <span className="text-[15px] font-medium">
                    Связанные аккаунты: <Mono>{u.linked}</Mono>
                  </span>
                  <span className="text-sm text-muted-foreground">Совпали устройство, имя или файл</span>
                </span>
                <span className="text-sm font-medium text-primary">Открыть</span>
              </button>
            )}
          </div>
          {seafarer && (
            <div>
              <SectionTitle className="mt-0 mb-4" aside={<span className="text-sm text-muted-foreground">только сведения, без фото</span>}>
                Документы
              </SectionTitle>
              <DataTable
                ignoreView
                rows={u.docs}
                rowKey={(d) => d.type}
                empty={{ icon: FileText, title: 'Документов нет', text: 'Моряк не добавил ни одного документа.' }}
                columns={[
                  { key: 't', header: 'Документ', width: '34%', cell: (d) => <span className="font-medium">{d.type}</span> },
                  { key: 'a', header: 'Добавлен', width: '20%', mono: true, cell: (d) => dt(d.added) },
                  { key: 'p', header: 'Стр.', width: '10%', align: 'right', mono: true, cell: (d) => d.pages },
                  { key: 's', header: 'Состояние', cell: (d) => <StatusDot tone={d.state === 'confirmed' ? 'success' : 'warning'}>{DOC_STATE_LABEL[d.state]}</StatusDot> },
                ]}
              />
            </div>
          )}
        </div>
      </ViewState>

      <SideSheet
        open={sheet === 'unblock'}
        onOpenChange={(v) => !v && setSheet(null)}
        title={`Разблокировать ${u.name}?`}
        description={seafarer ? 'Счётчик ошибок обнулится, моряк снова сможет загружать документы. Ему придёт уведомление.' : 'Рекрутер снова войдёт в кабинет. Ему придёт письмо.'}
        footer={
          <>
            <CancelButton onClick={() => setSheet(null)} />
            <Button onClick={() => (patch({ status: 'active', wrongDocs: 0, reason: undefined }, seafarer ? 'Аккаунт разблокирован, счётчик ошибок обнулён' : 'Аккаунт разблокирован'), setNote(''))}>Разблокировать</Button>
          </>
        }
      >
        {seafarer && (
          <Facts
            items={[
              ['Ошибок сейчас', <Mono key="n">{u.wrongDocs} из 2</Mono>],
              ['После разблокировки', <Mono key="z">0 из 2</Mono>],
            ]}
          />
        )}
        <WebField id="unblock-note" label="Комментарий для команды">
          <WebTextarea id="unblock-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={seafarer ? 'Как обратился в поддержку, что проверили' : 'Почему разблокировали'} />
        </WebField>
      </SideSheet>

      <SideSheet
        open={sheet === 'unban'}
        onOpenChange={(v) => !v && setSheet(null)}
        title={`Снять бан с ${u.name}?`}
        description="Отпечатки аккаунта уйдут из бан-листа. С этим документом снова можно будет зарегистрироваться."
        footer={
          <>
            <CancelButton onClick={() => setSheet(null)} />
            <Button onClick={() => patch({ status: 'active', reason: undefined }, 'Бан снят')}>Снять бан</Button>
          </>
        }
      />

      <SideSheet
        open={sheet === 'ban'}
        onOpenChange={(v) => !v && setSheet(null)}
        title={`Забанить ${u.name}?`}
        description="Аккаунт закроется, а его следы попадут в бан-лист. Бан-лист остаётся и после удаления аккаунта."
        footer={
          <>
            <CancelButton onClick={() => setSheet(null)} />
            <Button variant="destructive" disabled={!reason} onClick={() => patch({ status: 'banned', reason }, 'Пользователь забанен')}>
              Забанить
            </Button>
          </>
        }
      >
        <WebField id="ban-reason" label="Причина" required>
          <WebSelect id="ban-reason" value={reason} onChange={setReason} options={BAN_REASONS} />
        </WebField>
        <WebField id="ban-note" label="Комментарий для команды">
          <WebTextarea id="ban-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ссылка на жалобу, что проверили" />
        </WebField>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">В бан-лист попадут</span>
          <ul className="flex flex-col gap-1.5 text-[15px] text-muted-foreground">
            {(seafarer ? ['Отпечаток номера документа моряка', 'Имя и дата рождения', 'Устройство', 'Email'] : ['Email', 'Устройство']).map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </SideSheet>
    </AdminPage>
  )
}
