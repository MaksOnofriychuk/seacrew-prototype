import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

export type Route = { screen: string; theme: Theme }

// Адреса: #o01?t=dark — екран і тема, щоб можна було поділитися посиланням.
export function parseHash(hash: string, fallback: string): Route {
  const [id, query = ''] = hash.replace(/^#/, '').split('?')
  const t = new URLSearchParams(query).get('t')
  return { screen: id || fallback, theme: t === 'dark' ? 'dark' : 'light' }
}

export function toHash(r: Route) {
  return '#' + r.screen + (r.theme === 'dark' ? '?t=dark' : '')
}

export function useRoute(fallback: string) {
  const [route, setRoute] = useState(() => parseHash(location.hash, fallback))

  useEffect(() => {
    const onHash = () => setRoute(parseHash(location.hash, fallback))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [fallback])

  useEffect(() => {
    const next = toHash(route)
    if (location.hash !== next) history.replaceState(null, '', next)
    document.documentElement.classList.toggle('dark', route.theme === 'dark')
  }, [route])

  return [route, setRoute] as const
}
