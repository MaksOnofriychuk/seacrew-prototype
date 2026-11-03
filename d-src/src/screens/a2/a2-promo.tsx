import { useState } from 'react'
import { WebDatePick } from '@/components/web/web-pickers'
import { BOUNDS, isoToRu, ruToIso } from '@/lib/dates'

import { Gift, Plus, Ticket, Users } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/web/data-table'
import { WebCheckbox, WebField, WebInput, WebSelect } from '@/components/web/fields'
import { FilterBar } from '@/components/web/filter-bar'
import { PageHeader, PageTabs } from '@/components/web/page-header'
import { StatusDot, WebAvatar, type Tone } from '@/components/web/status-badge'
import { INVITERS, INVITE_RULE, INVITE_TOTALS, PROMOS, PROMO_STATE_LABEL, type Inviter, type Promo, type PromoState } from '@/lib/data-admin-2'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { AdminPage, CancelButton, Facts, Mono, Note, SideSheet, dt, useBagState } from '../a/_parts'
import { Sample, UsageBar } from './_parts'

const TONE: Record<PromoState, Tone> = { active: 'success', off: 'muted', expired: 'muted' }
const DAYS = [7, 14, 30]
const AUDIENCE = { new: 'Новые моряки', all: 'Все моряки' } as const
const EMPTY = { code: '', days: 7, limit: '100', unlimited: false, until: '2026-12-31', audience: 'new' as Promo['audience'], note: '' }

const daysText = (n: number) => (n === 7 ? 'Неделя' : n === 14 ? '2 недели' : n === 30 ? 'Месяц' : `${n} дн.`)
const promoState = (p: Promo): PromoState => (p.state === 'active' && p.limit !== null && p.used >= p.limit ? 'expired' : p.state)

type Tab = 'codes' | 'invites'

export function A2Promo({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [tab, setTab] = useBagState<Tab>('a2.promoTab', 'codes')
  const [promos, setPromos] = useBagState<Promo[]>('a2.promos', PROMOS)
  const [inviters, setInviters] = useBagState<Inviter[]>('a2.inviters', INVITERS)
  const [rule, setRule] = useBagState('a2.inviteRule', INVITE_RULE)
  const [, setUser] = useBagState('a.user', 'u02')
  const [, setRegTab] = useBagState('a.regTab', 'attempts')
  const [q, setQ] = useState('')
  const [openCode, setOpenCode] = useState<string | null>(null)
  const [openInv, setOpenInv] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editRule, setEditRule] = useState(false)
  const [ruleDraft, setRuleDraft] = useState({ daysEach: String(rule.daysEach), max: String(rule.maxWeeksPerYear) })
  const [f, setF] = useState(EMPTY)
  const code = promos.find((p) => p.id === openCode)
  const inv = inviters.find((i) => i.id === openInv)

  const codeClean = f.code.trim().toUpperCase()
  const codeErr = codeClean && !/^[A-Z0-9-]{4,20}$/.test(codeClean) ? 'Латиница, цифры и дефис, от 4 до 20 знаков' : promos.some((p) => p.code === codeClean) ? 'Такой код уже есть' : undefined
  const limitNum = Number(f.limit)
  const canCreate = !!codeClean && !codeErr && (f.unlimited || (Number.isInteger(limitNum) && limitNum > 0))

  const create = () => {
    const p: Promo = { id: 'pc' + Date.now(), code: codeClean, days: f.days, limit: f.unlimited ? null : limitNum, used: 0, until: f.until || null, audience: f.audience, state: 'active', created: '2026-11-02', note: f.note.trim() || 'Без описания' }
    setPromos([p, ...promos])
    showToast(`Код ${p.code} создан`)
    setCreating(false)
    setF(EMPTY)
  }

  const toggle = (p: Promo) => {
    const next: PromoState = p.state === 'active' ? 'off' : 'active'
    setPromos(promos.map((x) => (x.id === p.id ? { ...x, state: next } : x)))
    showToast(next === 'off' ? `Код ${p.code} выключен` : `Код ${p.code} снова действует`)
    setOpenCode(null)
  }

  const codeRows = promos.filter((p) => !q || (p.code + p.note).toLowerCase().includes(q.toLowerCase()))
  const invRows = inviters.filter((i) => !q || i.name.toLowerCase().includes(q.toLowerCase()))

  const codeCols: Column<Promo>[] = [
    {
      key: 'code',
      header: 'Код',
      width: '26%',
      sortValue: (p) => p.code,
      cell: (p) => (
        <span className="flex min-w-0 flex-col leading-tight">
          <Mono className="font-medium">{p.code}</Mono>
          <span className="truncate text-sm text-muted-foreground">{p.note}</span>
        </span>
      ),
    },
    { key: 'days', header: 'Даёт премиум', width: '13%', sortValue: (p) => p.days, cell: (p) => daysText(p.days) },
    { key: 'aud', header: 'Для кого', width: '14%', cell: (p) => <span className="text-muted-foreground">{AUDIENCE[p.audience]}</span> },
    {
      key: 'used',
      header: 'Использовано',
      width: '18%',
      sortValue: (p) => p.used,
      cell: (p) => (
        <span className="flex flex-col gap-1.5 pr-4">
          <span className="text-sm">
            <Mono>{p.used.toLocaleString('ru')}</Mono>
            <span className="text-muted-foreground"> {p.limit === null ? 'без лимита' : <>из <Mono>{p.limit.toLocaleString('ru')}</Mono></>}</span>
          </span>
          {p.limit !== null && <UsageBar used={p.used} limit={p.limit} />}
        </span>
      ),
    },
    { key: 'until', header: 'До', width: '12%', mono: true, sortValue: (p) => p.until ?? '9999', cell: (p) => (p.until ? dt(p.until) : <span className="font-sans text-muted-foreground">бессрочно</span>) },
    {
      key: 'state',
      header: 'Статус',
      sortValue: (p) => promoState(p),
      cell: (p) => <StatusDot tone={TONE[promoState(p)]}>{p.state === 'active' && promoState(p) === 'expired' ? 'Лимит исчерпан' : PROMO_STATE_LABEL[p.state]}</StatusDot>,
    },
  ]

  const invCols: Column<Inviter>[] = [
    {
      key: 'name',
      header: 'Кто приглашает',
      width: '28%',
      sortValue: (i) => i.name,
      cell: (i) => (
        <span className="flex items-center gap-3">
          <WebAvatar initials={i.initials} />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-medium">{i.name}</span>
            <span className="truncate text-sm text-muted-foreground">{i.position}</span>
          </span>
        </span>
      ),
    },
    { key: 'opened', header: 'Открыли ссылку', width: '13%', align: 'right', mono: true, sortValue: (i) => i.opened, cell: (i) => i.opened },
    { key: 'joined', header: 'Пришли', width: '11%', align: 'right', mono: true, sortValue: (i) => i.joined, cell: (i) => i.joined },
    {
      key: 'weeks',
      header: 'Бонусных недель',
      width: '16%',
      align: 'right',
      sortValue: (i) => i.weeks,
      cell: (i) => (
        <Mono className={cn(i.weeks >= rule.maxWeeksPerYear && 'text-warning')}>
          {i.weeks} <span className="text-muted-foreground">/ {rule.maxWeeksPerYear}</span>
        </Mono>
      ),
    },
    { key: 'last', header: 'Последнее', width: '12%', mono: true, sortValue: (i) => i.last, cell: (i) => dt(i.last) },
    { key: 'flag', header: '', cell: (i) => (i.flag ? <StatusDot tone="warning">Проверить</StatusDot> : null) },
  ]

  return (
    <AdminPage active="a-users" go={go}>
      <PageHeader
        title="Промокоды и приглашения"
        description="Код даёт моряку дни премиума. Приглашение от моряка моряку по ссылке или коду дарит неделю премиума обоим."
        actions={
          tab === 'codes' && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Создать код
            </Button>
          )
        }
      />
      <PageTabs<Tab>
        tabs={[
          { id: 'codes', label: 'Промокоды', count: promos.filter((p) => promoState(p) === 'active').length },
          { id: 'invites', label: 'Приглашения' },
        ]}
        value={tab}
        onChange={(t) => (setTab(t), setQ(''))}
      />

      {tab === 'codes' ? (
        <>
          <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Код или описание' }} count={codeRows.length} />
          <DataTable
            columns={codeCols}
            rows={codeRows}
            rowKey={(p) => p.id}
            onRowClick={(p) => setOpenCode(p.id)}
            selectedKey={openCode ?? undefined}
            initialSort={{ key: 'state', dir: 'asc' }}
            empty={
              q
                ? { icon: Ticket, title: 'Код не найден', text: 'Проверьте написание.' }
                : { icon: Ticket, title: 'Промокодов пока нет', text: 'Создайте код для ярмарки, партнёра или бета-теста.', action: <Button onClick={() => setCreating(true)}><Plus /> Создать код</Button> }
            }
          />
        </>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-8">
            <Paper title="Правило приглашений">
              <Facts
                className="py-1 [&_dd]:whitespace-normal"
                items={[
                  ['Приглашённому', `${daysText(rule.daysEach).toLowerCase()} премиума`],
                  ['Пригласившему', `${daysText(rule.daysEach).toLowerCase()} за каждого`],
                  ['Когда начисляем', <span key="w" className="flex items-center gap-2">профиль друга заполнен на 70 % <Sample q="130" /></span>],
                  ['Предел в год', <span key="m" className="flex items-center gap-2"><Mono>{rule.maxWeeksPerYear}</Mono> недель <Sample q="130" /></span>],
                ]}
              />
              <div className="mt-4 flex justify-end border-t border-border pt-3">
                <Button variant="ghost" className="text-primary" onClick={() => (setRuleDraft({ daysEach: String(rule.daysEach), max: String(rule.maxWeeksPerYear) }), setEditRule(true))}>
                  Изменить правило
                </Button>
              </div>
            </Paper>
            <div className="flex flex-col gap-4 pt-1">
              <p className="text-[15px] leading-relaxed">
                За 30 дней ссылку открыли <Mono>{INVITE_TOTALS.links.toLocaleString('ru')}</Mono> раз, пришли <Mono>{INVITE_TOTALS.joined}</Mono> моряков, из них <Mono>{INVITE_TOTALS.premiumAfter}</Mono> потом купили премиум.
              </p>
              <Note tone="warning">Если приглашённый зарегистрировался с того же устройства, что и пригласивший, строка отмечена «Проверить»: возможно, человек приглашает сам себя ради бонусов.</Note>
            </div>
          </div>
          <FilterBar search={{ value: q, onChange: setQ, placeholder: 'Имя моряка' }} count={invRows.length} />
          <DataTable
            columns={invCols}
            rows={invRows}
            rowKey={(i) => i.id}
            onRowClick={(i) => setOpenInv(i.id)}
            selectedKey={openInv ?? undefined}
            initialSort={{ key: 'joined', dir: 'desc' }}
            empty={q ? { icon: Users, title: 'Никого не нашли', text: 'Проверьте имя.' } : { icon: Gift, title: 'Приглашений пока нет', text: 'Когда моряк поделится ссылкой, он появится здесь.' }}
          />
        </>
      )}

      {/* код: перегляд */}
      <SideSheet
        open={!!code}
        onOpenChange={(v) => !v && setOpenCode(null)}
        title={code ? <Mono>{code.code}</Mono> : ''}
        description={code?.note}
        footer={
          code && (
            <>
              <Button variant="ghost" className="mr-auto text-primary" onClick={() => showToast(`Код ${code.code} скопирован`)}>
                Скопировать код
              </Button>
              {code.state !== 'expired' && (
                <Button variant={code.state === 'active' ? 'outline' : 'default'} onClick={() => toggle(code)}>
                  {code.state === 'active' ? 'Выключить' : 'Включить'}
                </Button>
              )}
            </>
          )
        }
      >
        {code && (
          <>
            <Facts
              items={[
                ['Даёт премиум', daysText(code.days)],
                ['Для кого', AUDIENCE[code.audience]],
                ['Использовано', <span key="u"><Mono>{code.used}</Mono>{code.limit !== null && <> из <Mono>{code.limit}</Mono></>}</span>],
                ['Действует до', code.until ? <Mono key="t">{dt(code.until)}</Mono> : 'Бессрочно'],
                ['Создан', <Mono key="c">{dt(code.created)}</Mono>],
                ['Статус', <StatusDot key="s" tone={TONE[promoState(code)]}>{PROMO_STATE_LABEL[promoState(code)]}</StatusDot>],
              ]}
            />
            {code.limit !== null && <UsageBar used={code.used} limit={code.limit} />}
            <Note>Моряк вводит код в профиле или при выборе тарифа. Один код — один раз на аккаунт.</Note>
          </>
        )}
      </SideSheet>

      {/* код: створення */}
      <SideSheet
        open={creating}
        onOpenChange={setCreating}
        title="Новый промокод"
        description="Код сразу начнёт работать в приложении."
        footer={
          <>
            <CancelButton onClick={() => setCreating(false)} />
            <Button disabled={!canCreate} onClick={create}>
              Создать код
            </Button>
          </>
        }
      >
        <WebField id="pc-code" label="Код" required error={codeErr} hint="Латиница, цифры и дефис.">
          <div className="flex gap-2">
            <WebInput id="pc-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="PORT-2026" className="font-mono uppercase" />
            <Button variant="outline" className="h-10" onClick={() => setF({ ...f, code: 'SEA-' + Math.random().toString(36).slice(2, 7).toUpperCase() })}>
              Придумать
            </Button>
          </div>
        </WebField>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Сколько премиума</span>
          <div role="radiogroup" aria-label="Сколько премиума" className="grid grid-cols-3 gap-2">
            {DAYS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={f.days === d}
                onClick={() => setF({ ...f, days: d })}
                className={cn('h-10 rounded-md border text-sm font-medium transition-colors', f.days === d ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted')}
              >
                {daysText(d)}
              </button>
            ))}
          </div>
        </div>
        <WebField id="pc-limit" label="Сколько раз можно использовать" error={!f.unlimited && f.limit && !(Number.isInteger(limitNum) && limitNum > 0) ? 'Целое число больше нуля' : undefined}>
          <WebInput id="pc-limit" inputMode="numeric" disabled={f.unlimited} value={f.unlimited ? '' : f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} className="font-mono" />
        </WebField>
        <WebCheckbox id="pc-unl" checked={f.unlimited} onChange={(v) => setF({ ...f, unlimited: v })}>
          Без лимита
        </WebCheckbox>
        <WebField id="pc-until" label="Действует до" hint="Оставьте пустым — код будет бессрочным.">
          <WebDatePick id="pc-until" value={isoToRu(f.until)} onChange={(v) => setF({ ...f, until: ruToIso(v) })} {...BOUNDS.future} clearable className="w-48" />
        </WebField>
        <WebField id="pc-aud" label="Для кого">
          <WebSelect id="pc-aud" value={f.audience} onChange={(v) => setF({ ...f, audience: v as Promo['audience'] })} options={[{ value: 'new', label: AUDIENCE.new }, { value: 'all', label: AUDIENCE.all }]} />
        </WebField>
        <WebField id="pc-note" label="Для чего код" hint="Видно только команде.">
          <WebInput id="pc-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Например: стенд на ярмарке в Гданьске" />
        </WebField>
      </SideSheet>

      {/* правило запрошень */}
      <SideSheet
        open={editRule}
        onOpenChange={setEditRule}
        title="Правило приглашений"
        description="Новое правило действует для приглашений, отправленных после сохранения."
        footer={
          <>
            <CancelButton onClick={() => setEditRule(false)} />
            <Button
              disabled={!(Number(ruleDraft.daysEach) > 0 && Number(ruleDraft.max) > 0)}
              onClick={() => {
                setRule({ daysEach: Number(ruleDraft.daysEach), maxWeeksPerYear: Number(ruleDraft.max) })
                showToast('Правило приглашений сохранено')
                setEditRule(false)
              }}
            >
              Сохранить
            </Button>
          </>
        }
      >
        <WebField id="ir-days" label="Дней премиума каждому" hint="Обоим: и тому, кто пригласил, и тому, кто пришёл.">
          <WebInput id="ir-days" inputMode="numeric" value={ruleDraft.daysEach} onChange={(e) => setRuleDraft({ ...ruleDraft, daysEach: e.target.value })} className="font-mono" />
        </WebField>
        <WebField id="ir-max" label="Недель в год на одного пригласившего, не больше">
          <WebInput id="ir-max" inputMode="numeric" value={ruleDraft.max} onChange={(e) => setRuleDraft({ ...ruleDraft, max: e.target.value })} className="font-mono" />
        </WebField>
      </SideSheet>

      {/* запрошення: хто запрошує */}
      <SideSheet
        open={!!inv}
        onOpenChange={(v) => !v && setOpenInv(null)}
        title={inv?.name}
        description={inv?.position}
        footer={
          inv && (
            <>
              {inv.userId && (
                <Button variant="ghost" className="mr-auto text-primary" onClick={() => (setUser(inv.userId!), go('a-user'))}>
                  Профиль моряка
                </Button>
              )}
              {inv.flag && inv.weeks > 0 && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setInviters(inviters.map((x) => (x.id === inv.id ? { ...x, weeks: 0, flag: undefined } : x)))
                    showToast('Бонусные недели сняты')
                    setOpenInv(null)
                  }}
                >
                  Снять бонусы
                </Button>
              )}
            </>
          )
        }
      >
        {inv && (
          <>
            <Facts
              items={[
                ['Открыли ссылку', <Mono key="o">{inv.opened}</Mono>],
                ['Пришли', <Mono key="j">{inv.joined}</Mono>],
                ['Бонусных недель', <Mono key="w">{inv.weeks} из {rule.maxWeeksPerYear}</Mono>],
                ['Последнее приглашение', <Mono key="l">{dt(inv.last)}</Mono>],
              ]}
            />
            {inv.flag && (
              <>
                <Note tone="warning">{inv.flag}. Посмотрите связанные аккаунты и решите, оставить бонусы или снять.</Note>
                <Button variant="outline" className="self-start" onClick={() => (setRegTab('linked'), go('a-registrations'))}>
                  Связанные аккаунты
                </Button>
              </>
            )}
          </>
        )}
      </SideSheet>
    </AdminPage>
  )
}
