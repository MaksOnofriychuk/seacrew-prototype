import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
export type View = 'normal' | 'empty' | 'loading' | 'error'
export type RoutePlatform = 'mobile' | 'recruiter' | 'admin'

export const VIEWS: { id: View; label: string }[] = [
  { id: 'normal', label: 'Обычное' },
  { id: 'empty', label: 'Пусто' },
  { id: 'loading', label: 'Загрузка' },
  { id: 'error', label: 'Ошибка' },
]

/** screen — id екрана; порожній, коли на вибраній платформі ще немає екранів (тоді важить platform). */
export type Route = { screen: string; theme: Theme; view: View; platform: RoutePlatform }

const isView = (v: string | null): v is View => VIEWS.some((x) => x.id === v)
const isPlatform = (p: string | null): p is RoutePlatform => p === 'mobile' || p === 'recruiter' || p === 'admin'

// Адреса: #p05?t=dark&v=empty — екран, тема, стан екрана (щоб поділитися посиланням).
// Порожня платформа: #?p=admin. Інші параметри адреси (напр. ?drawer=1) екрани читають самі.
export function parseHash(hash: string): Route {
  const [id, query = ''] = hash.replace(/^#/, '').split('?')
  const q = new URLSearchParams(query)
  const t = q.get('t')
  const v = q.get('v')
  const p = q.get('p')
  return { screen: id, theme: t === 'dark' ? 'dark' : 'light', view: isView(v) ? v : 'normal', platform: isPlatform(p) ? p : 'mobile' }
}

export function toHash(r: Route) {
  const q = new URLSearchParams()
  if (!r.screen && r.platform !== 'mobile') q.set('p', r.platform)
  if (r.theme === 'dark') q.set('t', 'dark')
  if (r.view !== 'normal') q.set('v', r.view)
  const s = q.toString()
  return '#' + r.screen + (s ? '?' + s : '')
}

export function useRoute() {
  const [route, setRoute] = useState(() => parseHash(location.hash))

  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const next = toHash(route)
    if (location.hash !== next) history.replaceState(null, '', next)
    document.documentElement.classList.toggle('dark', route.theme === 'dark')
  }, [route])

  return [route, setRoute] as const
}
