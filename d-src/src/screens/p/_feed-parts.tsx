import type { ReactNode } from 'react'
import { Bookmark } from 'lucide-react'
import { POSTS, type Post } from '@/lib/data'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import { FORM_DEFAULTS, useQ, type QForm } from '../q/_parts'

// Спільне для стрічки (p01, p04, p06, p07): дані, стан у bag і дрібні елементи.
// Ключі bag: saved.posts (спільний з «Сохранённым»), feed.liked, feed.mine, feed.post, post.mine.

export type UserPost = Extract<Post, { kind: 'user' }>
export type NewsPost = Extract<Post, { kind: 'news' }>

/* ---------- автори (правка п. 16: короткий профіль моряка) ---------- */

// Вигадані дані для короткого профілю: посада, тип судна, загальний стаж у місяцях.
export type Author = { av: string; name: string; rank: string; ship: string; months: number }

export const AUTHORS: Author[] = [
  { av: 'МП', name: 'Марко Петров', rank: 'Chief Officer', ship: 'Bulk Carrier', months: 112 },
  { av: 'ИБ', name: 'Ирина Бондарь', rank: '2nd Officer', ship: 'Container Ship', months: 62 },
  { av: 'ОК', name: 'Олег Коваленко', rank: 'Master', ship: 'Chemical Tanker', months: 254 },
  { av: 'ДС', name: 'Денис Савчук', rank: 'Bosun', ship: 'General Cargo', months: 41 },
]

export const authorByName = (name: string) => AUTHORS.find((a) => a.name === name)
export const postsBy = (name: string) => POSTS.filter((p): p is UserPost => p.kind === 'user' && p.name === name)

// У даних посада записана як «Chief Officer · Bulk Carrier» — показуємо через кому.
export const roleText = (role: string) => role.replace(/\s*·\s*/g, ', ')

/* ---------- коментарі (C: COMMENTS) ---------- */

export const COMMENTS: [string, string, string, string][] = [
  ['ИБ', 'Ирина Бондарь', '1 ч', 'Как со сменами — по графику?'],
  ['МП', 'Марко Петров', '40 мин', 'Да, сменщик прибыл в Роттердам точно в дату контракта.'],
  ['ДС', 'Денис Савчук', '12 мин', 'Какой был состав экипажа?'],
]

/* ---------- стан ---------- */

// Хто я: ім'я й ініціали з даних реєстрації (як S.first/S.last у C).
export function useMe() {
  const { bag } = useQ()
  const form = bag<{ v: QForm } | null>('q.form', null)?.v ?? FORM_DEFAULTS
  const first = String(form.first || '')
  const last = String(form.last || '')
  return {
    name: `${first} ${last}`.trim() || 'Без имени',
    initials: ((first[0] ?? '?') + (last[0] ?? '')).toUpperCase(),
  }
}

// Закладки: масив id публікацій у bag 'saved.posts' — його читає екран «Сохранённое».
export function useSaved() {
  const { bag, setBag, showToast } = useProto()
  const saved = bag<string[]>('saved.posts', [])
  const toggle = (id: string) => {
    const on = saved.includes(id)
    setBag('saved.posts', on ? saved.filter((x) => x !== id) : [...saved, id])
    showToast(on ? 'Убрано из сохранённых' : 'Сохранено. Найдёте в профиле, в «Сохранённом»')
  }
  return { isSaved: (id: string) => saved.includes(id), toggle }
}

// «Нравится» (C: like:id) — перемикач, лічильник +1.
export function useLikes() {
  const { bag, setBag } = useProto()
  const liked = bag<Record<string, boolean>>('feed.liked', {})
  return {
    isLiked: (id: string) => !!liked[id],
    toggle: (id: string) => setBag('feed.liked', { ...liked, [id]: !liked[id] }),
  }
}

// Власні публікації, що чекають модератора (з’являються після «Опубликовать» на p06).
export type MyPost = { id: string; text: string; photo: boolean; vessel: string | null }
export function useMyPosts() {
  const { bag, setBag } = useProto()
  const mine = bag<MyPost[]>('feed.mine', [])
  return { mine, add: (p: MyPost) => setBag('feed.mine', [p, ...mine]) }
}

// Параметри в адресі (#p01?s=search&q=…) — щоб відкривати стан екрана посиланням і для скріншотів.
export function hashParam(key: string) {
  return new URLSearchParams(location.hash.split('?')[1] ?? '').get(key)
}

/* ---------- дрібні елементи ---------- */

export function Avatar({ children, size = 'md', className }: { children: ReactNode; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground',
        size === 'sm' && 'size-8 text-xs',
        size === 'md' && 'size-10 text-sm',
        size === 'lg' && 'size-16 text-xl font-semibold text-primary',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SaveButton({ id, className }: { id: string; className?: string }) {
  const { isSaved, toggle } = useSaved()
  const on = isSaved(id)
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={on ? 'Убрать из сохранённых' : 'Сохранить'}
      className={cn('flex size-9 shrink-0 items-center justify-center rounded-md transition-colors active:scale-95', on ? 'text-primary' : 'text-muted-foreground', className)}
    >
      <Bookmark className={cn('size-5', on && 'fill-current')} />
    </button>
  )
}

// Підсвітка знайдених слів у тексті (пошук у стрічці).
export function Hl({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const parts = text.split(new RegExp(`(${esc.join('|')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded-sm bg-primary/15 text-foreground dark:bg-primary/30">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
