import { Heart, MessageSquareText, Plus, Send } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { MonoNums } from '@/components/app/mono-nums'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { REPLIES, TOPICS } from '@/lib/data-premium'
import type { ScreenProps } from '../types'
import { plural } from '../p/_app-parts'
import { Initials, useBack, usePr } from './_parts'

// pr-groups — «Обсуждения» (відповідь 113: «в будущем возможно, в далёком»). Простий список тем
// і pr-group — тема з відповідями. Позначка «скоро»: писати й відповідати поки не можна — тост.

const SOON = 'Обсуждения появятся позже — пока можно только посмотреть'

function Soon() {
  return <span className="rounded-full border border-border px-2.5 py-0.5 text-sm font-medium text-muted-foreground">скоро</span>
}

export function PrGroups({ go }: ScreenProps) {
  const { setBag, showToast } = usePr()
  const back = useBack('pr-groups', 'p04')
  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={() => go(back)} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="px-6 pt-1">
          <div className="flex items-center gap-3">
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Обсуждения</h1>
            <Soon />
          </div>
          <p className="mt-2 text-[15px] text-muted-foreground">Вопросы о портах, документах и работе — отвечают другие моряки.</p>
        </div>
        <ViewState loading={{ kind: 'list', rows: 4 }} empty={{ icon: MessageSquareText, title: 'Тем пока нет', text: 'Здесь появятся вопросы моряков и ответы на них.' }}>
          <ul className="mx-4 mt-5 overflow-hidden rounded-xl border border-border bg-surface">
            {TOPICS.map((t) => (
              <li key={t.id} className="border-t border-border first:border-t-0">
                <button
                  type="button"
                  onClick={() => {
                    setBag('pr.topic', t.id)
                    go('pr-group')
                  }}
                  className="flex w-full flex-col gap-1.5 px-5 py-4 text-left"
                >
                  <span className="text-sm text-muted-foreground">{t.tag}</span>
                  <span className="text-[17px] leading-snug font-semibold">{t.title}</span>
                  <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    <span>{t.author}</span>
                    <span>
                      <span className="font-mono">{t.replies}</span> {plural(t.replies, 'ответ', 'ответа', 'ответов')}
                    </span>
                    <span>
                      <MonoNums text={t.last} />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ViewState>
      </div>
      <Footer className="border-t border-border bg-background">
        <Button size="lg" variant="outline" className="text-primary" onClick={() => showToast(SOON)}>
          <Plus /> Новая тема
        </Button>
      </Footer>
    </div>
  )
}

/* ================= pr-group — тема ================= */

export function PrGroup({ go }: ScreenProps) {
  const { bag, showToast } = usePr()
  const t = TOPICS.find((x) => x.id === bag<string>('pr.topic', 't1')) ?? TOPICS[0]
  return (
    <div className="relative flex h-full flex-col">
      <NavBar title="Тема" onBack={() => go('pr-groups')} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        <ViewState loading={{ kind: 'cards', rows: 3 }} empty={{ icon: MessageSquareText, title: 'Ответов пока нет', text: 'Станьте первым, кто ответит, когда раздел запустится.' }}>
          <article className="px-6 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t.tag}</span>
              <Soon />
            </div>
            <h1 className="mt-2 text-[24px] leading-tight font-semibold tracking-tight">{t.title}</h1>
            <div className="mt-3 flex items-center gap-3">
              <Initials className="size-8 text-xs">{t.av}</Initials>
              <span className="text-[15px] font-medium">{t.author}</span>
            </div>
            <p className="mt-3 text-[15px] leading-relaxed">{t.text}</p>
          </article>

          <h2 className="mt-7 mb-2 px-6 text-base font-semibold">
            <span className="font-mono">{t.replies}</span> {plural(t.replies, 'ответ', 'ответа', 'ответов')}
          </h2>
          <ul className="mx-4 overflow-hidden rounded-xl border border-border bg-surface">
            {(REPLIES[t.id] ?? []).map((r) => (
              <li key={r.name + r.time} className="flex gap-3 border-t border-border px-4 py-4 first:border-t-0">
                <Initials className="size-9 text-xs">{r.av}</Initials>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-[15px] font-medium">{r.name}</span>
                    <span className="shrink-0 text-sm text-muted-foreground">
                      <MonoNums text={r.time} />
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">{r.rank}</span>
                  <p className="mt-1 text-[15px] leading-relaxed">{r.text}</p>
                  <button type="button" onClick={() => showToast(SOON)} className="mt-1 flex items-center gap-1 self-start text-sm text-muted-foreground" aria-label="Нравится">
                    <Heart className="size-4" /> <span className="font-mono">{r.likes}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {t.replies > (REPLIES[t.id]?.length ?? 0) && (
            <button type="button" onClick={() => showToast(SOON)} className="mx-6 mt-3 text-sm font-medium text-primary">
              Показать ещё <span className="font-mono">{t.replies - (REPLIES[t.id]?.length ?? 0)}</span>
            </button>
          )}
        </ViewState>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-background px-4 pt-3 pb-4">
        <button type="button" onClick={() => showToast(SOON)} className="flex h-11 flex-1 items-center rounded-full border border-border bg-surface px-4 text-left text-[15px] text-muted-foreground">
          Ответить
        </button>
        <button type="button" aria-label="Отправить" onClick={() => showToast(SOON)} className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Send className="size-5" />
        </button>
      </div>
    </div>
  )
}
