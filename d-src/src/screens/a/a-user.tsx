import { useState } from 'react'
import { Ban, FileText, History, Lock, LockOpen, UserX } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/web/data-table'
import { WebField, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { StatusDot, WebAvatar } from '@/components/web/status-badge'
import { DOC_STATE_LABEL, USTATUS_LABEL } from '@/lib/data-admin'
import { aUser53, userLog } from '@/lib/data-admin-53-e'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { USTATUS_TONE, useUserOverrides } from './a-users'
import { AdminPage, CancelButton, Facts, Mono, Note, SideSheet, dt, useBagState } from './_parts'
import { Fold } from './e-fold'

const BLOCK_REASONS = ['Жалоба на поведение', 'Подозрение на чужой аккаунт', 'Просьба самого пользователя', 'Другое']
const BAN_REASONS = ['Жалоба рекрутера: чужой документ', 'Поддельный документ', 'Спам в публикациях', 'Оплата за трудоустройство', 'Другое']

export function AUserScreen({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [id] = useBagState('a.user', 'u02')
  const [over, setOver] = useUserOverrides()
  const [, setRegTab] = useBagState('a.regTab', 'attempts')
  const u = { ...aUser53(id), ...over[id] }
  const log = userLog(u.id)
  const [sheet, setSheet] = useState<'unblock' | 'block' | 'ban' | 'unban' | null>(null)
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
            {u.status === 'active' && (
              <Button variant="outline" onClick={() => (setReason(''), setNote(''), setSheet('block'))}>
                <Lock /> Заблокировать
              </Button>
            )}
            {u.status === 'banned' ? (
              <Button variant="outline" onClick={() => setSheet('unban')}>
                Снять бан
              </Button>
            ) : (
              <Button variant="outline" className="text-signal" onClick={() => (setReason(''), setNote(''), setSheet('ban'))}>
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
        {u.status !== 'active' && !autoBlocked && u.reason && (
          <Note tone="error" className="mb-4">
            {u.reason}
            {u.blockedAt && (
              <span className="text-muted-foreground">
                , <Mono>{dt(u.blockedAt)}</Mono>
              </span>
            )}
          </Note>
        )}
        {u.status === 'active' && u.wrongDocs === 1 && (
          <Note tone="warning" className="mb-4">
            Одна ошибка с документом: {u.attempts[0]?.detected.toLowerCase()}, <Mono>{dt(u.attempts[0]?.at ?? '')}</Mono>. Ещё одна подряд — и аккаунт заблокируется.
          </Note>
        )}

        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-4">
            <Fold title="Аккаунт" summary={u.email}>
              <Facts
                items={[
                  ['Email', u.email],
                  ['Регистрация', <Mono key="c">{dt(u.created)}</Mono>],
                  ['Последний вход', /\d/.test(u.lastSeen) && u.lastSeen.includes('-') ? <Mono key="l">{dt(u.lastSeen)}</Mono> : u.lastSeen],
                  ['Не те документы подряд', seafarer ? <Mono key="w">{u.wrongDocs} из 2</Mono> : '—'],
                ]}
              />
              {u.linked > 0 && (
                <button type="button" onClick={() => (setRegTab('linked'), go('a-registrations'))} className="mt-4 flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 text-left hover:bg-muted">
                  <span className="flex flex-col">
                    <span className="text-[15px] font-medium">
                      Связанные аккаунты: <Mono>{u.linked}</Mono>
                    </span>
                    <span className="text-sm text-muted-foreground">Совпали устройство, имя или файл</span>
                  </span>
                  <span className="text-sm font-medium text-primary">Открыть</span>
                </button>
              )}
            </Fold>
            {seafarer && (
              <Fold title="Документы" summary={`${u.docs.length} · только сведения, без фото`} flush>
                <DataTable
                  ignoreView
                  className="rounded-none border-0"
                  rows={u.docs}
                  rowKey={(d) => d.type}
                  pageSizes={u.docs.length > 5 ? [10, 20, 50] : undefined}
                  empty={{ icon: FileText, title: 'Документов нет', text: 'Моряк не добавил ни одного документа.' }}
                  columns={[
                    { key: 't', header: 'Документ', width: '30%', sortValue: (d) => d.type, cell: (d) => <span className="font-medium">{d.type}</span> },
                    { key: 'a', header: 'Добавлен', width: '26%', mono: true, sortValue: (d) => d.added, cell: (d) => dt(d.added) },
                    { key: 'p', header: 'Стр.', width: '10%', align: 'right', mono: true, sortValue: (d) => d.pages, cell: (d) => d.pages },
                    { key: 's', header: 'Состояние', sortValue: (d) => d.state, cell: (d) => <StatusDot tone={d.state === 'confirmed' ? 'success' : 'warning'}>{DOC_STATE_LABEL[d.state]}</StatusDot> },
                  ]}
                />
              </Fold>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            {autoBlocked && (
              <Fold title="Заблокирован автоматически" summary={<Mono>{dt(u.blockedAt ?? '')}</Mono>}>
                <ol className="flex flex-col">
                  {u.attempts.map((a, i) => (
                    <li key={a.at} className="relative flex gap-4 pb-5 last:pb-0">
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
                <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">Сами файлы не сохраняются и здесь не показываются — только что распознал ИИ.</p>
              </Fold>
            )}
            <Fold title="Журнал входов и действий" summary={`${log.length} записей`} flush defaultOpen>
              <DataTable
                ignoreView
                className="rounded-none border-0"
                rows={log}
                rowKey={(r) => r.id}
                initialSort={{ key: 'at', dir: 'desc' }}
                pageSizes={[10, 20, 50]}
                sortOptions={[
                  { key: 'at', dir: 'desc', label: 'Дата: сначала новые' },
                  { key: 'at', dir: 'asc', label: 'Дата: сначала старые' },
                  { key: 'what', dir: 'asc', label: 'Действие: А — Я' },
                ]}
                empty={{ icon: History, title: 'Записей нет', text: 'Действия пользователя появятся здесь.' }}
                columns={[
                  { key: 'at', header: 'Когда', width: '34%', mono: true, sortValue: (r) => r.at, cell: (r) => dt(r.at) },
                  { key: 'what', header: 'Действие', width: '36%', sortValue: (r) => r.what, cell: (r) => r.what },
                  { key: 'where', header: 'Откуда', sortValue: (r) => r.where, cell: (r) => <span title={r.where} className="text-muted-foreground">{r.where}</span> },
                ]}
              />
            </Fold>
          </div>
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
        <WebField id="unblock-note" label="Комментарий для команды" hint="Видно только команде.">
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
        open={sheet === 'block'}
        onOpenChange={(v) => !v && setSheet(null)}
        title={`Заблокировать ${u.name}?`}
        description="Вход закроется, пока вы не разблокируете. В бан-лист ничего не попадёт: с этими данными можно зарегистрироваться снова."
        footer={
          <>
            <CancelButton onClick={() => setSheet(null)} />
            <Button variant="destructive" disabled={!reason} onClick={() => patch({ status: 'blocked', reason }, 'Пользователь заблокирован')}>
              Заблокировать
            </Button>
          </>
        }
      >
        <WebField id="block-reason" label="Причина" required hint="Пользователь увидит её в письме.">
          <WebSelect id="block-reason" value={reason} onChange={setReason} options={BLOCK_REASONS} />
        </WebField>
        <WebField id="block-note" label="Комментарий для команды" hint="Видно только команде.">
          <WebTextarea id="block-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ссылка на жалобу, что проверили" />
        </WebField>
      </SideSheet>

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
        <WebField id="ban-reason" label="Причина" required hint="Попадёт в бан-лист вместе со следами.">
          <WebSelect id="ban-reason" value={reason} onChange={setReason} options={BAN_REASONS} />
        </WebField>
        <WebField id="ban-note" label="Комментарий для команды" hint="Видно только команде.">
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
