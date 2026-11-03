import { useState } from 'react'
import { Banknote, Bookmark, Briefcase, Check, ChartColumn, Download, FileText, Globe, HeartPulse, ShieldCheck, Ship, UsersRound } from 'lucide-react'
import { AvailabilityButton, AvailabilitySheet } from '@/components/app/availability'
import { ThemeRow } from '@/components/app/theme-select'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { ProfileFillCard } from '@/components/app/profile-fill'
import { ViewState } from '@/components/app/states'
import { TabBar } from '@/components/app/tab-bar'
import { Button } from '@/components/ui/button'
import { PROFILE_FIELDS } from '@/lib/data-docs-profile'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { readiness } from '../q/_parts'
import { Dur, ListGroup, MenuRow, Note, SalaryText, TabHeader, useDP, useHashParam, useProfile, type TextField } from './_parts'
import { ExpandRow, FieldEditor, RankEditor, SalaryEditor, type EditKey } from './_inline-edit'
import { byStart, cMonths, useContracts } from './_contracts'
import { daysLeft, DEMO_MED, expiry, useDocs } from './_docs'
import { useAppCounts } from '../m/_parts'

// p14 — профіль у застосунку. Правка №16: «Уведомления» і «Входящие» тут більше немає — дзвіночок у
// верхній панелі, повідомлення — вкладка «Сообщения». Правка №21: «Профиль заполнен на N %».
// Статус — спільні AvailabilityButton / AvailabilitySheet (правки №1, №15, №19, №20).
// Особисті дані — по рядку на поле, тап → p21 «Изменить поле» (gaps №6). «Опыт работы» → p22,
// «Моё CV» → p20. «Медосмотр действителен до …» (ТЗ §8), «Желаемая зарплата» і «Семейное положение»
// (відповіді 46, 134) → p21. Стаж і відсоток — ті самі, що в реєстрації (s6, q09). ?full=1 — 100 %.

const LANGS = ['Русский', 'Українська', 'English']

export function P14Profile({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useDP()
  const p = useProfile()
  // Премиум-екрани: «Назад» там повертає сюди (back.<id>).
  const goBack = (id: string) => {
    setBag('back.' + id, 'p14')
    go(id)
  }
  const [availOpen, setAvailOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const full = useHashParam('full') === '1'
  const lang = bag<string>('dp.lang', 'Русский')

  const { docs } = useDocs()
  const counts = useAppCounts()
  // Медосмотр (ТЗ §8): найближчий строк серед медичних; ?full=1 — демо-медосмотр.
  const med = docs.filter((d) => d.group === 'med').sort((a, b) => (daysLeft(a.exp ?? '') ?? 1e9) - (daysLeft(b.exp ?? '') ?? 1e9))[0] ?? (full ? { id: `med-${DEMO_MED.id}`, exp: DEMO_MED.d.exp } : null)
  // Відсоток — та сама функція, що в q09 і боковому меню: медичні додано → 100 %.
  const pct = readiness(!!med, docs.some((d) => d.group === 'passport')).pct
  const savedN = bag<number[]>('saved.jobs', [0, 3]).length + bag<string[]>('saved.posts', []).length
  // Стаж — з тих самих контрактів, що крок s6 і q09.
  const { contracts } = useContracts()
  const total = contracts.reduce((s, c) => s + cMonths(c), 0)
  const latest = [...contracts].sort(byStart)[0]

  const openMed = () => {
    if (!med) return go('s5')
    if (med.id === `med-${DEMO_MED.id}`) setBag('docs.demoMed', true)
    setBag('doc.sel', med.id)
    go('p11')
  }
  const medSoon = med?.exp ? expiry(med.exp) : null

  // Редактирование под строкой (правка №19д): открыт один блок, второй тап по строке закрывает.
  const [editing, setEditing] = useState<EditKey | null>(null)
  const toggle = (k: EditKey) => setEditing((e) => (e === k ? null : k))
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
        {PROFILE_FIELDS.map((f) => {
          const k = f.k as TextField
          const val = p.value(k)
          return (
            <ExpandRow
              key={f.k}
              title={<span className="text-muted-foreground">{f.label}</span>}
              value={val ? <span className={cn('text-foreground', f.mono && 'font-mono')}>{val}</span> : 'Не указано'}
              open={editing === f.k}
              onToggle={() => toggle(f.k)}
            >
              <FieldEditor k={k} open={editing === f.k} onClose={() => setEditing(null)} />
            </ExpandRow>
          )
        })}
      </ListGroup>

      <ListGroup title="Работа">
        <ExpandRow icon={Briefcase} title="Должность" value={p.position || 'Не указана'} open={editing === 'rank'} onToggle={() => toggle('rank')}>
          <RankEditor open={editing === 'rank'} onClose={() => setEditing(null)} />
        </ExpandRow>
        <MenuRow icon={Ship} title="Опыт работы" value={<Dur m={total} />} onClick={() => go('p22')} />
        <ExpandRow icon={Banknote} title="Желаемая зарплата" value={p.salary?.amount ? <SalaryText s={p.salary} /> : 'Не указана'} open={editing === 'salary'} onToggle={() => toggle('salary')}>
          <SalaryEditor open={editing === 'salary'} onClose={() => setEditing(null)} />
        </ExpandRow>
        <MenuRow
          icon={HeartPulse}
          title={
            med?.exp ? (
              <>
                Медосмотр действителен до <span className={cn('font-mono', medSoon && medSoon.variant !== 'success' && 'text-warning')}>{med.exp}</span>
              </>
            ) : (
              'Медосмотр'
            )
          }
          value={med ? undefined : 'Не добавлен'}
          onClick={openMed}
        />
        <MenuRow icon={FileText} title="Моё CV" value="PDF" onClick={() => go('p20')} />
        <MenuRow icon={Bookmark} title="Сохранённое" value={<span className="font-mono">{savedN}</span>} onClick={() => go('p09')} />
        <MenuRow icon={UsersRound} title="Подписки" onClick={() => goBack('pr-following')} />
        <MenuRow icon={ChartColumn} title="Моя зарплата" onClick={() => goBack('pr-salary')} />
      </ListGroup>

      <ListGroup title="Настройки">
        <MenuRow icon={Globe} title="Язык" value={lang} onClick={() => setLangOpen(true)} />
        <ThemeRow open={editing === 'theme'} onToggle={() => toggle('theme')} />
        <MenuRow icon={ShieldCheck} title="Согласия" onClick={() => go('q10')} />
        <MenuRow icon={Download} title="Скачать мои данные" onClick={() => showToast('Копию данных отправим на ваш email')} />
      </ListGroup>
    </div>
  )

  return (
    <div className="relative flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <TabHeader go={go} here="p14" />
        <div className="px-6">
          <ViewState loading={<Skeleton />} error={{ title: 'Не удалось загрузить профиль', className: 'px-0' }} empty={content}>
            {content}
          </ViewState>
        </div>
      </div>
      <TabBar active="profile" go={go} counts={{ msg: counts.messages }} />
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
