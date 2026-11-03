import { useState } from 'react'
import { BadgeCheck, Users } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { COMPANIES, FOLLOWING_COMPANIES_DEFAULT, FOLLOWING_DEFAULT } from '@/lib/data-premium'
import type { ScreenProps } from '../types'
import { useToast } from '../q/_parts'
import { authorByName } from '../p/_feed-parts'
import { plural } from '../p/_app-parts'
import { Segmented } from '../m/_parts'
import { Initials, useBack, usePr } from './_parts'

// pr-follow — той самий екран, що p16 (короткий профіль моряка з «Подписаться»; бриф S29, відповідь 126).
// pr-following — «Подписки»: моряки й компанії, відписатися з відміною.
// Ключі bag: pr.follow (імена моряків), pr.followCo (id компаній), feed.author (чий профіль відкрито).

function useFollow() {
  const { bag, setBag } = usePr()
  const people = bag<string[]>('pr.follow', FOLLOWING_DEFAULT)
  const companies = bag<string[]>('pr.followCo', FOLLOWING_COMPANIES_DEFAULT)
  return {
    people,
    companies,
    setPeople: (v: string[]) => setBag('pr.follow', v),
    setCompanies: (v: string[]) => setBag('pr.followCo', v),
  }
}

/* pr-follow — тот же экран, что p16 (см. p/p16.tsx). */
export { P16Author as PrFollow } from '../p/p16'

/* ================= pr-following ================= */

export function PrFollowing({ go }: ScreenProps) {
  const { setBag, showToast } = usePr()
  const back = useBack('pr-following', 'p14')
  const { people, companies, setPeople, setCompanies } = useFollow()
  const { toast, toastNode } = useToast()
  const [tab, setTab] = useState<'people' | 'co'>('people')

  const openPerson = (name: string) => {
    setBag('feed.author', name)
    setBag('feed.author.back', 'pr-following')
    go('pr-follow')
  }
  const dropPerson = (name: string) => {
    setPeople(people.filter((x) => x !== name))
    toast(`Вы отписались от ${name}`, () => setPeople(people))
  }
  const dropCo = (id: string, name: string) => {
    setCompanies(companies.filter((x) => x !== id))
    toast(`Вы отписались от ${name}`, () => setCompanies(companies))
  }
  const list = tab === 'people' ? people.map((n) => authorByName(n)).filter((a) => !!a) : COMPANIES.filter((c) => companies.includes(c.id))

  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Подписки" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-6">
        <Segmented
          label="Подписки"
          value={tab}
          onChange={setTab}
          items={[
            { id: 'people', label: 'Моряки', n: people.length },
            { id: 'co', label: 'Компании', n: companies.length },
          ]}
        />
        <ViewState
          loading={{ kind: 'list', rows: 3 }}
          empty={{
            icon: Users,
            title: 'Вы ни на кого не подписаны',
            text: 'Подписывайтесь на моряков и агентства — их публикации и вакансии появятся в ленте.',
            action: (
              <Button variant="outline" className="h-11 text-[15px] text-primary" onClick={() => go('p01')}>
                В ленту
              </Button>
            ),
          }}
        >
          {list.length === 0 ? (
            <EmptyState
              icon={Users}
              title={tab === 'people' ? 'Нет подписок на моряков' : 'Нет подписок на компании'}
              text={tab === 'people' ? 'Откройте профиль автора в ленте и нажмите «Подписаться».' : 'Подпишитесь на агентство на странице вакансии — пришлём его новые вакансии.'}
            />
          ) : (
            <ul className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
              {tab === 'people'
                ? people.map((n) => {
                    const a = authorByName(n)
                    if (!a) return null
                    return (
                      <li key={n} className="flex items-center gap-3 border-t border-border py-3 pr-3 pl-4 first:border-t-0">
                        <button type="button" onClick={() => openPerson(n)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                          <Initials>{a.av}</Initials>
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="text-[15px] font-medium">{a.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {a.rank}, {a.ship}
                            </span>
                          </span>
                        </button>
                        <Button variant="outline" size="sm" className="h-9 text-sm text-muted-foreground" onClick={() => dropPerson(n)}>
                          Отписаться
                        </Button>
                      </li>
                    )
                  })
                : COMPANIES.filter((c) => companies.includes(c.id)).map((c) => (
                    <li key={c.id} className="flex items-center gap-3 border-t border-border py-3 pr-3 pl-4 first:border-t-0">
                      <button type="button" onClick={() => showToast('Страница компании (пример)')} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <Initials square>{c.lg}</Initials>
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 text-[15px] font-medium">
                            <span className="truncate">{c.name}</span>
                            {c.verified && <BadgeCheck className="size-4 shrink-0 text-primary" aria-label="Проверенная компания" />}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            <span className="font-mono">{c.jobs}</span> {plural(c.jobs, 'вакансия', 'вакансии', 'вакансий')}
                          </span>
                        </span>
                      </button>
                      <Button variant="outline" size="sm" className="h-9 text-sm text-muted-foreground" onClick={() => dropCo(c.id, c.name)}>
                        Отписаться
                      </Button>
                    </li>
                  ))}
            </ul>
          )}
        </ViewState>
      </div>
      {toastNode}
    </div>
  )
}
