import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TECH_GROUPS, TECH_LEVELS, type TechLevel } from '@/lib/data-search-profile'
import { cn } from '@/lib/utils'

// Технический опыт: шесть разделов с галочками, у каждого «Выбрано: N»; ниже — чипы выбранного с минимальным уровнем.
export function TechFilter({ value, onChange }: { value: Record<string, TechLevel>; onChange: (v: Record<string, TechLevel>) => void }) {
  const [openName, setOpenName] = useState<string | null>(null)
  const chosen = Object.keys(value)
  const toggle = (item: string) => {
    const next = { ...value }
    if (item in next) delete next[item]
    else next[item] = 1
    onChange(next)
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">Технический опыт</span>
        <span className="text-muted-foreground">
          Выбрано: <span className="font-mono">{chosen.length}</span>
        </span>
        {chosen.length > 0 && (
          <button type="button" onClick={() => onChange({})} className="font-medium text-primary">
            Сбросить
          </button>
        )}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-2">
        {TECH_GROUPS.map((g) => {
          const n = g.items.filter((i) => i in value).length
          const open = openName === g.name
          return (
            <div key={g.name} className={cn('rounded-md border bg-surface', n > 0 ? 'border-primary' : 'border-border')}>
              <button type="button" aria-expanded={open} onClick={() => setOpenName(open ? null : g.name)} className="flex h-10 w-full items-center gap-2 px-3 text-left text-sm">
                <span className="flex-1 font-medium">{g.name}</span>
                {n > 0 && (
                  <span className="text-muted-foreground">
                    Выбрано: <span className="font-mono">{n}</span>
                  </span>
                )}
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none', open && 'rotate-180')} />
              </button>
              {open && (
                <ul className="flex flex-col gap-0.5 border-t border-border p-2">
                  {g.items.map((item) => (
                    <li key={item}>
                      <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted">
                        <Checkbox checked={item in value} onCheckedChange={() => toggle(item)} />
                        {item}
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
      {chosen.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Выбранное оборудование">
          {chosen.map((item) => (
            <li key={item} className="flex items-center gap-1.5 rounded-md bg-muted py-1 pr-1 pl-2.5 text-[13px]">
              <span>{item}</span>
              <Select value={String(value[item])} onValueChange={(v) => onChange({ ...value, [item]: Number(v) as TechLevel })}>
                <SelectTrigger aria-label={`Минимальный уровень: ${item}`} className="h-7 data-[size=default]:h-7 gap-1.5 border-0 bg-surface px-2 text-[13px] shadow-none">
                  <span className="text-muted-foreground">от</span>
                  <SelectValue>{TECH_LEVELS.find((x) => x.value === value[item])?.label}</SelectValue>
                </SelectTrigger>
                <SelectContent position="popper">
                  {TECH_LEVELS.map((x) => (
                    <SelectItem key={x.value} value={String(x.value)}>
                      {x.label} — {x.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button type="button" aria-label={`Убрать: ${item}`} onClick={() => toggle(item)} className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground">
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
