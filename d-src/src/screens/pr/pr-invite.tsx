import { useState } from 'react'
import { AlertCircle, Copy, Share2, Ticket, Users } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { Paper } from '@/components/app/paper'
import { ShareSheet } from '@/components/app/share-sheet'
import { useView, ViewState } from '@/components/app/states'
import { Status } from '@/components/app/status'
import { Button } from '@/components/ui/button'
import { INVITE_LINK, INVITES, MY_CODE, PLAN_ACTIVE, PROMO_BAD, TRIAL_DAYS } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Initials, Section, useBack, useGoFrom, usePlan, usePr } from './_parts'

// pr-invite — «Пригласить коллегу» (відповідь 130): моряк → моряк за посиланням або промокодом,
// бонус — тиждень премиуму обом. pr-promo — «Промокод»: ввести код коллеги чи акції.

export function PrInvite({ go }: ScreenProps) {
  const [shareOpen, setShareOpen] = useState(false)
  const { showToast } = usePr()
  const back = useBack('pr-invite', 'pr-status')
  const goFrom = useGoFrom(go, 'pr-invite')

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Пригласить коллегу" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-6">
        <Paper title="Приглашение в Seafolio">
          <p className="text-[15px] text-muted-foreground">Неделя премиума — вам и коллеге, когда он зарегистрируется.</p>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-border pt-4">
            <span className="flex flex-col gap-0.5">
              <span className="text-sm text-muted-foreground">Ваш код</span>
              <span className="font-mono text-[28px] leading-tight font-semibold tracking-wide">{MY_CODE}</span>
            </span>
            <Button variant="outline" size="icon-lg" aria-label="Скопировать код" className="text-primary" onClick={() => showToast('Код скопирован')}>
              <Copy className="size-5" />
            </Button>
          </div>
          <p className="mt-2 font-mono text-sm text-muted-foreground">{INVITE_LINK}</p>
        </Paper>

        <ol className="mt-6 flex flex-col gap-3 px-2">
          {['Отправьте коллеге ссылку или код', 'Коллега регистрируется в Seafolio и вводит код', `Вы оба получаете ${TRIAL_DAYS} дней премиума`].map((t, i) => (
            <li key={t} className="flex items-baseline gap-3 text-[15px]">
              <span className="w-4 shrink-0 font-mono text-sm text-muted-foreground">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>

        <Section title="Ваши приглашения" className="mt-8" aside={<span className="font-mono text-sm text-muted-foreground">{INVITES.length}</span>}>
          <ViewState
            loading={{ kind: 'list', rows: 2 }}
            empty={
              <p className="flex items-start gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-[15px] text-muted-foreground">
                <Users className="mt-0.5 size-5 shrink-0 text-primary" />
                Пока никого. Когда коллега зарегистрируется по вашей ссылке, он появится здесь.
              </p>
            }
          >
            <ul className="overflow-hidden rounded-xl border border-border bg-surface">
              {INVITES.map((v) => (
                <li key={v.name} className="flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0">
                  <Initials>{v.av}</Initials>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[15px] font-medium">{v.name}</span>
                    <span className="font-mono text-sm text-muted-foreground">{v.date}</span>
                  </span>
                  {v.status === 'joined' ? (
                    <Status kind="ok">
                      <span className="font-mono">+7</span> дней
                    </Status>
                  ) : (
                    <Status>ждём регистрации</Status>
                  )}
                </li>
              ))}
            </ul>
          </ViewState>
        </Section>

        <button type="button" onClick={() => goFrom('pr-promo')} className="mt-6 flex w-full items-center gap-3 px-2 text-left text-[15px] font-medium text-primary">
          <Ticket className="size-5" /> У меня есть промокод
        </button>
      </div>
      <Footer className="border-t border-border bg-background">
        <Button size="lg" onClick={() => setShareOpen(true)}>
          <Share2 /> Поделиться ссылкой
        </Button>
      </Footer>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} title="Пригласить коллегу" description="Ссылка-приглашение в Seafolio" />
    </div>
  )
}

/* ================= pr-promo ================= */

// Будь-який код від 6 символів приймаємо, крім PROMO_BAD — на ньому видно помилку (і в стані «Ошибка» з панелі).
export function PrPromo({ go }: ScreenProps) {
  const { showToast } = usePr()
  const { setPlan } = usePlan()
  const back = useBack('pr-promo', 'pr-status')
  // «Ошибка» з панелі — показуємо неправильний код
  const panelError = useView() === 'error'
  const [typed, setCode] = useState<string | null>(null)
  const [wrong, setError] = useState(false)
  const code = typed ?? (panelError ? PROMO_BAD : '')
  const error = wrong || (panelError && typed === null)
  const clean = code.trim().toUpperCase()

  const apply = () => {
    if (clean.length < 6 || clean === PROMO_BAD) return setError(true)
    setPlan({ kind: 'active', until: PLAN_ACTIVE.until })
    showToast(`Промокод применён: +${TRIAL_DAYS} дней премиума`)
    go('pr-status')
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Промокод" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Введите промокод</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Код от коллеги или из акции. Неделя премиума добавится к подписке.</p>
        <label className="mt-6 flex flex-col gap-1.5">
          <span className="text-sm font-medium">Промокод</span>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              setError(false)
            }}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
            placeholder="Например, SEA-4K7Q"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={error}
            className={cn(
              'h-12 rounded-md border bg-surface px-3 font-mono text-lg uppercase outline-none placeholder:font-sans placeholder:text-base placeholder:normal-case placeholder:text-muted-foreground focus:border-primary',
              error ? 'border-signal' : 'border-input',
            )}
          />
        </label>
        <div className="mt-2 min-h-5">
          {error && (
            <p role="alert" className="flex items-start gap-2 text-sm text-signal">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {clean.length < 6 ? 'В коде 8 символов, например SEA-4K7Q.' : 'Такого кода нет или он уже использован. Проверьте буквы и цифры.'}
            </p>
          )}
        </div>
      </div>
      <Footer className="border-t border-border bg-background">
        <Button size="lg" disabled={!clean} onClick={apply}>
          Применить
        </Button>
      </Footer>
    </div>
  )
}
