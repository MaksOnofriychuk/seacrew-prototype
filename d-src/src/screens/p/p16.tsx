import { Heart, MessageCircle, Newspaper, ShieldCheck } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { EmptyState, ViewState } from '@/components/app/states'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { durText } from '../q/_parts'
import { AUTHORS, authorByName, Avatar, hashParam, postsBy } from './_feed-parts'

// p16 — короткий профіль моряка: тап на автора в стрічці (p01) чи в публікації (p07).
// registration-c-redesign п. 16: фото, ім'я, «документ моряка проверен», посада, тип судна, загальний стаж, публікації.
// Не показуємо: «Написать» (моряки між собою не переписуються), документи, контакти, дату народження, статус, розбивку стажу.
// Загальний стаж іншим морякам видно завжди — «Скрыть общий стаж» (№34) ховає його лише від агентств.
// ?author=Ирина%20Бондарь — відкрити конкретного автора посиланням.
export function P16Author({ go }: ScreenProps) {
  const { bag, setBag } = useProto()
  const name = bag<string>('feed.author', hashParam('author') ?? AUTHORS[0].name)
  const back = bag<string>('feed.author.back', 'p01')
  const a = authorByName(name) ?? AUTHORS[0]
  const posts = postsBy(a.name)

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
