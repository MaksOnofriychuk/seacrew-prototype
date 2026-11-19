import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WebSelect } from './fields'

export type LanguageLevel = { lang: string; level: string }

// Несколько языков, у каждого свой уровень владения.
export function LanguageLevelsField({ values, onChange, languages, levels }: { values: LanguageLevel[]; onChange: (v: LanguageLevel[]) => void; languages: string[]; levels: string[] }) {
  const free = languages.filter((l) => !values.some((v) => v.lang === l))
  const set = (i: number, p: Partial<LanguageLevel>) => onChange(values.map((v, k) => (k === i ? { ...v, ...p } : v)))
  return (
    <div className="flex flex-col gap-2">
      {values.map((v, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_40px] items-center gap-2">
          <WebSelect className="data-[size=default]:h-10" value={v.lang} onChange={(lang) => set(i, { lang })} options={[v.lang, ...free].filter(Boolean)} placeholder="Язык" />
          <WebSelect className="data-[size=default]:h-10" value={v.level} onChange={(level) => set(i, { level })} options={levels} placeholder="Уровень" />
          <Button type="button" variant="ghost" size="icon" aria-label="Убрать язык" onClick={() => onChange(values.filter((_, k) => k !== i))}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      {free.length > 0 && (
        <Button type="button" variant="outline" className="self-start" onClick={() => onChange([...values, { lang: free[0], level: '' }])}>
          <Plus className="size-4" /> Добавить язык
        </Button>
      )}
    </div>
  )
}
