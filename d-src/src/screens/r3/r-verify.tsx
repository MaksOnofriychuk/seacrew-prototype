import { useState } from 'react'
import { AlertTriangle, Check, CircleCheck, Clock, FileText, ShieldCheck, Upload } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { StatusDot, type Tone } from '@/components/web/status-badge'
import { useAttachment } from '@/components/web/web-viewer'
import { TODAY_R3, VERIFY_L1, VERIFY_L2, type VerifyDoc, type VerifyDocStatus } from '@/lib/data-recruiter-3'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { ExampleMark, ruDate } from './_parts'

const DOC_LABEL: Record<VerifyDocStatus, string> = { accepted: 'Принят', replace: 'Нужно заменить', uploaded: 'Загружен, ещё не отправлен', missing: 'Не загружен' }
const DOC_TONE: Record<VerifyDocStatus, Tone> = { accepted: 'success', replace: 'error', uploaded: 'primary', missing: 'muted' }

type AppStatus = 'returned' | 'review'

// r-verify — «Верификация компании», два рівні (відп. 139 — без відповіді, ПРИКЛАД; відп. 140: ім'я й фото моряка — лише для рівня 2, як приклад).
// Рівень 1 пройдено (компанія вже з позначкою перевірки — RECRUITER_ORG.verified). Заявку на рівень 2 повернули:
// один документ треба замінити → «Загрузить новый» → «Отправить повторно» → статус «На проверке».
// Сильний елемент — драбина з двох рівнів угорі. Документи заявки — як папір.
export function RVerify({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const status = bag<AppStatus>('r3.verifyStatus', 'returned')
  const docs = bag<VerifyDoc[]>('r3.verifyDocs', VERIFY_L2.docs)
  const [busy, setBusy] = useState<string | null>(null)
  const att = useAttachment()
  const ready = docs.every((d) => d.status === 'accepted' || d.status === 'uploaded')

  const upload = (id: string) => {
    setBusy(id)
    window.setTimeout(() => {
      setBag(
        'r3.verifyDocs',
        docs.map((d) => (d.id === id ? { ...d, file: 'bw-rps-licence-full.pdf', status: 'uploaded' as const, note: undefined } : d)),
      )
      setBusy(null)
      showToast('Файл загружен')
    }, 600)
  }

  const submit = () => {
    setBag('r3.verifyStatus', 'review')
    showToast('Заявка отправлена на проверку')
  }

  return (
    <WebShell variant="recruiter" active="r-org" go={go}>
      <PageHeader
        back={{ label: 'Организация', onClick: () => go('r-org') }}
        title={
          <span className="flex items-center gap-3">
            Верификация компании <ExampleMark />
          </span>
        }
        description="Проверяет команда Seafolio вручную. Что именно проверяется на каждом уровне, ещё согласуется — здесь пример."
      />

      <ViewState loading={{ kind: 'cards' }} error={{ title: 'Не удалось загрузить заявку', text: 'Проверьте подключение и попробуйте ещё раз.' }} empty={{ icon: ShieldCheck, title: 'Компания ещё не проверена', text: 'Начните с первого уровня: название, регистрационный номер и рабочая почта.', action: <Button onClick={() => go('r-verify')}>Пройти проверку</Button> }}>
        {/* драбина рівнів */}
        <ol className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-surface">
          <li className="flex flex-col gap-4 px-7 py-6">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-full bg-success text-primary-foreground">
                <Check className="size-5" strokeWidth={2.5} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm text-muted-foreground">Уровень 1</span>
                <span className="text-lg font-semibold">
                  Пройден <span className="font-mono text-base">{ruDate(VERIFY_L1.passed)}</span>
                </span>
              </div>
            </div>
            <Checks title="Что проверили" items={VERIFY_L1.checks} done />
            <Checks title="Что открыто" items={VERIFY_L1.unlocks} done />
          </li>
          <li className="flex flex-col gap-4 border-l border-border px-7 py-6">
            <div className="flex items-center gap-3">
              <span className={cn('flex size-9 items-center justify-center rounded-full border-2', status === 'review' ? 'border-primary text-primary' : 'border-signal text-signal')}>
                {status === 'review' ? <Clock className="size-4.5" /> : <AlertTriangle className="size-4.5" />}
              </span>
              <div className="flex flex-col leading-tight">
                <span className="text-sm text-muted-foreground">Уровень 2</span>
                <span className="text-lg font-semibold">{status === 'review' ? 'На проверке' : 'Нужно исправить заявку'}</span>
              </div>
            </div>
            <Checks title="Что проверяем" items={['Документы компании и лицензию агентства', 'Связь с судовладельцем', 'Адрес офиса']} />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Что откроется</span>
              <ul className="flex flex-col gap-1.5 text-sm">
                {VERIFY_L2.unlocks.map((u, i) => (
                  <li key={u} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-border" />
                    <span className="flex flex-wrap items-center gap-2">
                      {u}
                      {i === 1 && <ExampleMark>пример, ждёт решения</ExampleMark>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        </ol>

        <div className="mt-8 grid grid-cols-[1fr_320px] items-start gap-8">
          <Paper title="Заявка на уровень 2" className="[&>div:last-child]:p-0">
            {status === 'returned' ? (
              <p className="flex items-start gap-2.5 border-b border-border bg-signal/5 px-6 py-3.5 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />
                <span>
                  Заявку вернули <span className="font-mono">{ruDate(VERIFY_L2.returned)}</span>: один документ нужно заменить. Остальные приняты, загружать их снова не нужно.
                </span>
              </p>
            ) : (
              <p className="flex items-start gap-2.5 border-b border-border bg-primary/5 px-6 py-3.5 text-sm">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Заявка на проверке. Обычно отвечаем за 2–3 рабочих дня, решение придёт на почту и сюда.</span>
              </p>
            )}
            <ul>
              {docs.map((d) => (
                <li key={d.id} className="grid grid-cols-[1fr_auto] items-start gap-6 border-t border-border px-6 py-4 first:border-t-0">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-[15px] font-medium">{d.title}</span>
                    <span className="text-sm text-muted-foreground">{d.hint}</span>
                    {d.file && (
                      <button type="button" onClick={() => att.open(d.file!, 'file', d.title)} className="mt-1 flex items-center gap-1.5 self-start text-left text-sm hover:underline">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className={cn('truncate', d.status === 'replace' ? 'text-muted-foreground line-through' : 'text-primary')}>{d.file}</span>
                      </button>
                    )}
                    {d.note && <span className="text-sm text-signal">{d.note}</span>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusDot tone={status === 'review' && d.status === 'uploaded' ? 'warning' : DOC_TONE[d.status]}>{status === 'review' && d.status === 'uploaded' ? 'На проверке' : DOC_LABEL[d.status]}</StatusDot>
                    {(d.status === 'replace' || d.status === 'missing') && (
                      <Button size="sm" variant="outline" className="text-primary" disabled={busy === d.id} onClick={() => upload(d.id)}>
                        <Upload /> {busy === d.id ? 'Загружаем…' : 'Загрузить новый'}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {status === 'returned' && (
              <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-4">
                <span className="text-sm text-muted-foreground">{ready ? 'Всё готово к повторной проверке.' : 'Замените документ, чтобы отправить заявку.'}</span>
                <Button disabled={!ready} onClick={submit}>
                  Отправить повторно
                </Button>
              </div>
            )}
          </Paper>

          <aside className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">История заявки</h2>
            <ol className="flex flex-col">
              {[
                { d: VERIFY_L2.submitted, t: 'Заявка отправлена' },
                { d: VERIFY_L2.returned, t: 'Возвращена: заменить лицензию' },
                ...(status === 'review' ? [{ d: TODAY_R3, t: 'Отправлена повторно' }] : []),
              ].map((e, i, arr) => (
                <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < arr.length - 1 && <span className="absolute top-3 bottom-0 left-[5px] w-px bg-border" />}
                  <span className={cn('relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 bg-surface', i === arr.length - 1 ? 'border-primary' : 'border-border')} />
                  <span className="flex flex-col">
                    <span className="text-sm">{e.t}</span>
                    <span className="font-mono text-xs text-muted-foreground">{ruDate(e.d)}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <CircleCheck className="mt-0.5 size-4 shrink-0" />
              Документы видит только команда Seafolio. Моряки видят лишь отметку о проверке.
            </p>
            <button type="button" onClick={() => go('r-team')} className="self-start text-sm font-medium text-primary hover:underline">
              Кто в компании может отправлять документы
            </button>
          </aside>
        </div>
      </ViewState>
      {att.node}
    </WebShell>
  )
}

function Checks({ title, items, done = false }: { title: string; items: string[]; done?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{title}</span>
      <ul className="flex flex-col gap-1.5 text-sm">
        {items.map((x) => (
          <li key={x} className={cn('flex items-start gap-2', !done && 'text-muted-foreground')}>
            {done ? <Check className="mt-0.5 size-4 shrink-0 text-success" /> : <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-border" />}
            {x}
          </li>
        ))}
      </ul>
    </div>
  )
}
