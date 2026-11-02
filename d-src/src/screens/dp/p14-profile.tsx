import { useState } from 'react'
import { Bookmark, Briefcase, Check, Download, FileText, Globe, Moon, ShieldCheck, Ship } from 'lucide-react'
import { AvailabilityButton, AvailabilitySheet } from '@/components/app/availability'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { ProfileFillCard } from '@/components/app/profile-fill'
import { ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { Button } from '@/components/ui/button'
import { CONTRACTS, PROFILE_FIELDS, type Contract } from '@/lib/data-docs-profile'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { Dur, ListGroup, MenuRow, Note, TabHeader, useDP, useHashParam, useProfile } from './_parts'
import { byStart, cMonths } from './_contracts'

// p14 — профіль у застосунку. Правка №16: «Уведомления» і «Входящие» тут більше немає — дзвіночок у
// верхній панелі, повідомлення — вкладка «Сообщения». Правка №21: «Профиль заполнен на N %».
// Статус — спільні AvailabilityButton / AvailabilitySheet (правки №1, №15, №19, №20).
// Особисті дані — по рядку на поле, тап → p21 «Изменить поле» (gaps №6). «Опыт работы» → p22,
// «Моё CV» → p20. ?full=1 — профіль заповнено на 100 %.

const LANGS = ['Русский', 'Українська', 'English']

export function P14Profile({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useDP()
  const p = useProfile()
  const [availOpen, setAvailOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const full = useHashParam('full') === '1'
  const lang = bag<string>('dp.lang', 'Русский')
  const dark = document.documentElement.classList.contains('dark')

  // Медичні, введені на кроці s5, теж рахуються — тоді профіль заповнено на 100 %.
  const pct = full || bag<unknown[]>('s5.docs', []).length > 0 ? 100 : 80
  const savedN = bag<number[]>('saved.jobs', [0, 3]).length + bag<string[]>('saved.posts', []).length
  const contracts = bag<Contract[]>('dp.contracts', CONTRACTS)
  const total = contracts.reduce((s, c) => s + cMonths(c), 0)
  const latest = [...contracts].sort(byStart)[0]

  const edit = (f: string) => {
    setBag('dp.field', f)
    go('p21')
  }
  // Тема в D живе в адресі (#p14?t=dark) — перемикаємо її так само, як панель.
  const toggleTheme = () => {
    const id = location.hash.replace(/^#/, '').split('?')[0] || 'p14'
    location.hash = dark ? `#${id}` : `#${id}?t=dark`
  }

  // «Пусто» з панелі для профілю сенсу не має — показуємо звичайний вигляд.
  const content = (
    <div className="screen-in">
      <div className="mt-5 flex items-center gap-4">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xl font-semibold text-primary">{p.initials}</span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="flex items-center gap-1.5 text-[26px] leading-tight font-semibold tracking-tight">
            <span className="truncate">{p.name}</span>
            <ShieldCheck className="size-5 shrink-0 text-primary" aria-label="Документ моряка проверен" />
          </h1>
          <span className="text-[15px]">{[p.position, latest?.type].filter(Boolean).join(', ')}</span>
          <span className="truncate text-sm text-muted-foreground">{p.value('email')}</span>
        </div>
      </div>
      <AvailabilityButton onClick={() => setAvailOpen(true)} className="mt-4" />

      <ProfileFillCard pct={pct} className="mt-6">
        {pct === 100 ? (
          <Note icon={ShieldCheck} className="bg-muted">
            <span className="font-medium text-foreground">Профиль заполнен.</span> Данные готовы для анкет агентств.
          </Note>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Считаем только данные, которые чаще всего нужны агентствам в анкетах.</p>
            <Button variant="outline" className="mt-1 h-11 text-[15px] text-primary" onClick={() => go('s5')}>
              Дополнить профиль
            </Button>
          </>
        )}
      </ProfileFillCard>

      <ListGroup title="Личные данные">
        {PROFILE_FIELDS.map((f) => (
          <MenuRow
            key={f.k}
            title={<span className="text-muted-foreground">{f.label}</span>}
            value={<span className={cn('text-foreground', f.mono && 'font-mono')}>{p.value(f.k as Exclude<typeof f.k, 'rank'>) || '—'}</span>}
            onClick={() => edit(f.k)}
          />
        ))}
      </ListGroup>

      <ListGroup title="Работа">
        <MenuRow icon={Briefcase} title="Должность" value={p.position || 'Не указана'} onClick={() => edit('rank')} />
        <MenuRow icon={Ship} title="Опыт работы" value={<Dur m={total} />} onClick={() => go('p22')} />
        <MenuRow icon={FileText} title="Моё CV" value="PDF" onClick={() => go('p20')} />
        <MenuRow icon={Bookmark} title="Сохранённое" value={<span className="font-mono">{savedN}</span>} onClick={() => go('p09')} />
      </ListGroup>

      <ListGroup title="Настройки">
        <MenuRow icon={Globe} title="Язык" value={lang} onClick={() => setLangOpen(true)} />
        <MenuRow icon={Moon} title="Тема" value={dark ? 'Тёмная' : 'Светлая'} onClick={toggleTheme} />
        <MenuRow icon={ShieldCheck} title="Согласия" onClick={() => go('q10')} />
        <MenuRow icon={Download} title="Скачать мои данные" onClick={() => showToast('Копию данных отправим на ваш email')} />
      </ListGroup>
    </div>
  )

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <TabHeader go={go} />
        <div className="px-6">
          <ViewState loading={<Skeleton />} error={{ title: 'Не удалось загрузить профиль', className: 'px-0' }} empty={content}>
            {content}
          </ViewState>
        </div>
      </div>
      <TabBar active="profile" go={go} />
      <AvailabilitySheet open={availOpen} onClose={() => setAvailOpen(false)} />
      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title="Язык">
        <div role="radiogroup" aria-label="Язык" className="flex flex-col">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={l === lang}
              onClick={() => {
                setBag('dp.lang', l)
                setLangOpen(false)
              }}
              className="flex min-h-13 items-center gap-3 border-t border-border py-3 text-left first:border-t-0"
            >
              <span className="flex-1 text-base">{l}</span>
              {l === lang && <Check className="size-5 text-primary" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

// Заглушка, поки профіль вантажиться. Статична, без мерехтіння.
function Skeleton() {
  const bar = 'block rounded-full border border-border bg-surface'
  return (
    <div className="mt-5 flex flex-col gap-4" aria-busy="true" aria-label="Загружаем профиль">
      <div className="flex items-center gap-4">
        <span className="size-16 rounded-full border border-border bg-surface" />
        <div className="flex flex-1 flex-col gap-2">
          <span className={cn(bar, 'h-5 w-3/5')} />
          <span className={cn(bar, 'h-3.5 w-2/5')} />
        </div>
      </div>
      <span className="h-36 rounded-xl border border-border bg-surface" />
      <span className="h-72 rounded-xl border border-border bg-surface" />
    </div>
  )
}
