import { Check, Heart, MessageCircle, Newspaper, ShieldCheck, UserPlus } from 'lucide-react'
import { NavBar } from '@/components/app/chrome'
import { MonoNums } from '@/components/app/mono-nums'
import { EmptyState, ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { FOLLOW_COUNTS, FOLLOWING_DEFAULT } from '@/lib/data-premium'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'
import { durText } from '../q/_parts'
import { AUTHORS, authorByName, Avatar, hashParam, postsBy } from './_feed-parts'
import { plural } from './_app-parts'

// p16 — короткий профіль моряка: тап на автора в стрічці (p01) чи в публікації (p07).
// registration-c-redesign п. 16: фото, ім'я, «документ моряка проверен», посада, тип судна, загальний стаж, публікації.
// Не показуємо: «Написать» (моряки між собою не переписуються), документи, контакти, дату народження, статус, розбивку стажу.
// Загальний стаж іншим морякам видно завжди — «Скрыть общий стаж» (№34) ховає його лише від агентств.
// «Подписаться» / «Вы подписаны» — логика бывшего pr-follow (id pr-follow в реестре показывает этот же экран).
// ?author=Ирина%20Бондарь — відкрити конкретного автора посиланням.
export function P16Author({ go }: ScreenProps) {
  const { bag, setBag, showToast } = useProto()
  const name = bag<string>('feed.author', hashParam('author') ?? AUTHORS[0].name)
  const back = bag<string>('feed.author.back', 'p01')
  const a = authorByName(name) ?? AUTHORS[0]
  const posts = postsBy(a.name)
  // Подписка на моряка (раздел «Подписки», pr-following): bag pr.follow — имена, те же, что в списке подписок.
  const follows = bag<string[]>('pr.follow', FOLLOWING_DEFAULT)
  const following = follows.includes(a.name)
  const [followers, followed] = FOLLOW_COUNTS[a.name] ?? [0, 0]
  const toggleFollow = () => {
    setBag('pr.follow', following ? follows.filter((x) => x !== a.name) : [...follows, a.name])
    showToast(following ? `Вы отписались от ${a.name}` : 'Вы подписаны. Публикации появятся в ленте')
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
                <span className="font-mono text-lg font-semibold">{followers + (following ? 1 : 0)}</span>
                <span className="text-sm text-muted-foreground">{plural(followers, 'подписчик', 'подписчика', 'подписчиков')}</span>
              </span>
              <span className="flex flex-col">
                <span className="font-mono text-lg font-semibold">{followed}</span>
                <span className="text-sm text-muted-foreground">{plural(followed, 'подписка', 'подписки', 'подписок')}</span>
              </span>
              <Button
                variant={following ? 'outline' : 'default'}
                aria-pressed={following}
                onClick={toggleFollow}
                className={cn('ml-auto h-11 min-w-36 text-[15px]', following && 'text-foreground')}
              >
                {following ? <Check className="size-4 text-success" strokeWidth={2.5} /> : <UserPlus className="size-4" />}
                {following ? 'Вы подписаны' : 'Подписаться'}
              </Button>
            </div>

            <dl className="mt-6 flex flex-col border-y border-border">
              {facts.map(([l, v, mono]) => (
                <div key={l} className="flex items-baseline justify-between gap-4 border-t border-border py-3.5 first:border-t-0">
                  <dt className="text-[15px] text-muted-foreground">{l}</dt>
                  <dd className="text-right text-[15px] font-medium">{mono ? <MonoNums text={v} /> : v}</dd>
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
