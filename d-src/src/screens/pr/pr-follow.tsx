import { useState } from 'react'
import { BadgeCheck, Check, Heart, MessageCircle, Newspaper, ShieldCheck, UserPlus, Users } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { COMPANIES, FOLLOW_COUNTS, FOLLOWING_COMPANIES_DEFAULT, FOLLOWING_DEFAULT } from '@/lib/data-premium'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../types'
import { durText, useToast } from '../q/_parts'
import { AUTHORS, authorByName, Avatar, hashParam, postsBy } from '../p/_feed-parts'
import { plural } from '../p/_app-parts'
import { Segmented } from '../m/_parts'
import { Initials, useBack, usePr } from './_parts'

// pr-follow — короткий профіль моряка з «Подписаться» (власна копія p16; бриф S29, відповідь 126).
// Як у p16: без «Написать» (моряки між собою не листуються), без документів і контактів.
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

export function PrFollow({ go }: ScreenProps) {
  const { bag, setBag, showToast } = usePr()
  const back = useBack('pr-follow', 'p01')
  const name = bag<string>('feed.author', hashParam('author') ?? AUTHORS[0].name)
  const a = authorByName(name) ?? AUTHORS[0]
  const posts = postsBy(a.name)
  const { people, setPeople } = useFollow()
  const on = people.includes(a.name)
  const [followers, following] = FOLLOW_COUNTS[a.name] ?? [0, 0]

  const toggle = () => {
    setPeople(on ? people.filter((x) => x !== a.name) : [...people, a.name])
    showToast(on ? `Вы отписались от ${a.name}` : 'Вы подписаны. Публикации появятся в ленте')
  }

  const facts: [string, string, boolean][] = [
    ['Должность', a.rank, false],
    ['Тип судна', a.ship, false],
    ['Общий стаж', durText(a.months), true],
  ]

  return (
    <div className="flex h-full flex-col">
      <NavBar title="Профиль моряка" onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <ViewState loading={{ kind: 'cards', rows: 2 }} empty={{ icon: Newspaper, title: 'Профиль недоступен', text: 'Моряк скрыл профиль или удалил аккаунт.' }}>
          <div className="px-6 pt-4">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="size-20 bg-card text-2xl">
                {a.av}
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1.5">
                <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{a.name}</h1>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4 shrink-0 text-primary" /> Документ моряка проверен
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-5">
              <span className="flex flex-col">
                <span className="font-mono text-lg font-semibold">{followers + (on ? 1 : 0)}</span>
                <span className="text-sm text-muted-foreground">{plural(followers, 'подписчик', 'подписчика', 'подписчиков')}</span>
              </span>
              <span className="flex flex-col">
                <span className="font-mono text-lg font-semibold">{following}</span>
                <span className="text-sm text-muted-foreground">{plural(following, 'подписка', 'подписки', 'подписок')}</span>
              </span>
              <Button
                variant={on ? 'outline' : 'default'}
                aria-pressed={on}
                onClick={toggle}
                className={cn('ml-auto h-11 min-w-36 text-[15px]', on && 'text-foreground')}
              >
                {on ? <Check className="size-4 text-success" strokeWidth={2.5} /> : <UserPlus className="size-4" />}
                {on ? 'Вы подписаны' : 'Подписаться'}
              </Button>
            </div>

            <dl className="mt-6 flex flex-col border-y border-border">
              {facts.map(([l, v, mono]) => (
                <div key={l} className="flex items-baseline justify-between gap-4 border-t border-border py-3.5 first:border-t-0">
                  <dt className="text-[15px] text-muted-foreground">{l}</dt>
                  <dd className={mono ? 'text-right font-mono text-[15px] font-medium' : 'text-right text-[15px] font-medium'}>{v}</dd>
                </div>
              ))}
            </dl>

            <h2 className="mt-7 mb-2 flex items-baseline gap-2 text-lg font-semibold">
              Публикации <span className="font-mono text-sm font-normal text-muted-foreground">{posts.length}</span>
            </h2>
          </div>
          {posts.length ? (
            <ul className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
              {posts.map((p) => (
                <li key={p.id} className="border-t border-border first:border-t-0">
                  <button
                    type="button"
                    onClick={() => {
                      setBag('feed.post', p.id)
                      go('p07')
                    }}
                    className="flex w-full flex-col gap-2 px-5 py-4 text-left"
                  >
                    <span className="line-clamp-3 text-[15px] leading-relaxed">{p.text}</span>
                    <span className="flex items-center gap-4 text-sm text-muted-foreground">
                      {p.time}
                      <span className="flex items-center gap-1" aria-label="Нравится">
                        <Heart className="size-3.5" /> <span className="font-mono">{p.likes}</span>
                      </span>
                      <span className="flex items-center gap-1" aria-label="Комментарии">
                        <MessageCircle className="size-3.5" /> <span className="font-mono">{p.comments}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Newspaper} title="Публикаций пока нет" className="py-6" />
          )}
        </ViewState>
      </div>
    </div>
  )
}

/* ================= pr-following ================= */

export function PrFollowing({ go }: ScreenProps) {
  const { setBag, showToast } = usePr()
  const back = useBack('pr-following', 'p14')
  const { people, companies, setPeople, setCompanies } = useFollow()
  const { toast, toastNode } = useToast()
  const [tab, setTab] = useState<'people' | 'co'>('people')

  const openPerson = (name: string) => {
    setBag('feed.author', name)
    setBag('back.pr-follow', 'pr-following')
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
