import type { ComponentType } from 'react'

export type Platform = 'mobile' | 'recruiter' | 'admin'

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'mobile', label: 'Мобилка' },
  { id: 'recruiter', label: 'Рекрутер (веб)' },
  { id: 'admin', label: 'Админ (веб)' },
]

export type ScreenProps = { go: (id: string) => void }

export type ScreenDef = {
  id: string
  title: string
  Component: ComponentType<ScreenProps>
  platform: Platform
  /** мобілка: екран займає й місце під рядком статусу */
  bleed?: boolean
  /** веб: шлях у рядку адреси браузера, напр. '/candidates' (без нього — '/' + id) */
  path?: string
}

export type ScreenGroup = { title: string; platform: Platform; screens: ScreenDef[] }

// Кожен файл групи оголошує свої групи для однієї платформи; платформа ставиться всім екранам.
export function defineGroups(platform: Platform, groups: { title: string; screens: Omit<ScreenDef, 'platform'>[] }[]): ScreenGroup[] {
  return groups.map((g) => ({ title: g.title, platform, screens: g.screens.map((s) => ({ ...s, platform })) }))
}
