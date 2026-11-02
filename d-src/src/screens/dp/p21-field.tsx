import { useState } from 'react'
import { FileCheck, Info, Trash2 } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { FleetPicker, type FleetValue } from '@/components/app/fleet-picker'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { PROFILE_DOC, PROFILE_FIELDS, type ProfileField } from '@/lib/data-docs-profile'
import type { ScreenProps } from '../types'
import { maskDate, Note, SourceTag, TextInput, useDP, useHashParam, useProfile, validDate } from './_parts'

// p21 — «Изменить поле»: одне поле профілю (gaps №6; profile-edit/[field] у застосунку).
// Значення з документа можна змінити: тоді наступні документи його не перезапишуть, лише запропонують
// своє (той самий текст, що в застосунку). «Должность» — флот → департамент → посада (правки №2, №25).
// Поле — з p14 (bag dp.field) або з адреси: #p21?f=birth | last | first | cit | phone | email | rank.

type TextField = Exclude<ProfileField, 'rank'>

const ERR: Partial<Record<TextField, string>> = {
  birth: 'Введите существующую дату в формате ДД.ММ.ГГГГ.',
  phone: 'Введите номер с кодом страны, например +380 …',
  email: 'Введите email, например name@example.com.',
}

const valid = (k: TextField, v: string) => {
  if (!v) return true
  if (k === 'birth') return validDate(v)
  if (k === 'phone') return v.replace(/\D/g, '').length >= 9
  if (k === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  return true
}

export function P21Field({ go }: ScreenProps) {
  const { bag } = useDP()
  const fromHash = useHashParam('f')
  const field = (fromHash ?? bag<string>('dp.field', 'birth')) as ProfileField
  const isRank = field === 'rank'
  const def = PROFILE_FIELDS.find((f) => f.k === field)

  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={() => go('p14')} />
      <ViewState loading={{ kind: 'cards', rows: 1 }} error={{ title: 'Не удалось загрузить профиль' }} empty={isRank ? <RankEditor go={go} /> : def ? <TextEditor key={field} k={field as TextField} go={go} /> : null}>
        {isRank ? <RankEditor go={go} /> : def ? <TextEditor key={field} k={field as TextField} go={go} /> : <p className="px-6 py-10 text-[15px] text-muted-foreground">Такого поля в профиле нет.</p>}
      </ViewState>
    </div>
  )
}

function TextEditor({ k, go }: { k: TextField; go: ScreenProps['go'] }) {
  const { showToast } = useDP()
  const p = useProfile()
  const def = PROFILE_FIELDS.find((f) => f.k === k)!
  const current = p.value(k)
  const src = p.source(k)
  const [text, setText] = useState(current)
  const [tried, setTried] = useState(false)
  const bad = tried && !valid(k, text.trim())
  // Що було в документі — для поля, яке вже виправили.
  const fromDoc = def.src === 'doc'

  const save = (v: string) => {
    setTried(true)
    const next = v.trim()
    if (!valid(k, next)) return
    if (next !== current) {
      p.save(k, next)
      showToast(next ? 'Сохранено' : 'Поле очищено')
    }
    go('p14')
  }

  return (
    <>
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">{def.label}</h1>
        <div className="mt-5 flex flex-col gap-2">
          <TextInput
            id="p21-input"
            aria-label={def.label}
            autoFocus
            mono={def.mono}
            value={text}
            invalid={bad}
            placeholder={def.ph}
            inputMode={k === 'birth' ? 'numeric' : k === 'phone' ? 'tel' : k === 'email' ? 'email' : undefined}
            autoComplete={k === 'email' ? 'email' : k === 'phone' ? 'tel' : undefined}
            onChange={(e) => setText(k === 'birth' ? maskDate(e.target.value) : e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save(text)}
          />
          {bad && <p className="text-sm text-signal">{ERR[k]}</p>}
          {src && (
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <SourceTag kind={src} />
              {(src === 'doc' || (src === 'edited' && fromDoc)) && (
                <span className="flex items-center gap-1.5">
                  <FileCheck className="size-4 shrink-0 text-primary" />
                  {PROFILE_DOC}
                </span>
              )}
            </p>
          )}
        </div>

        {fromDoc && <Note icon={Info} className="mt-5">Это значение пришло из документа. Если вы его измените, следующие документы уже не перезапишут его — только предложат своё значение.</Note>}

        {current && (
          <button type="button" onClick={() => save('')} className="mt-8 flex items-center gap-2 px-1 text-[15px] font-medium text-signal">
            <Trash2 className="size-4" />
            Очистить
          </button>
        )}
      </div>
      <Footer className="border-t border-border pt-4">
        <Button size="lg" onClick={() => save(text)}>
          Сохранить
        </Button>
      </Footer>
    </>
  )
}

function RankEditor({ go }: { go: ScreenProps['go'] }) {
  const { showToast } = useDP()
  const p = useProfile()
  const [v, setV] = useState<FleetValue>(p.rank)
  const ok = v.positions.length > 0

  const save = () => {
    p.saveRank(v)
    showToast('Должность сохранена')
    go('p14')
  }

  return (
    <>
      <div className="screen-in min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="mb-6 text-[32px] leading-[1.1] font-semibold tracking-tight">Должность</h1>
        <FleetPicker value={v} onChange={setV} />
      </div>
      <Footer className="border-t border-border pt-4">
        <Button size="lg" disabled={!ok} onClick={save}>
          Сохранить
        </Button>
        <p className="min-h-5 text-center text-sm text-muted-foreground">{ok ? '' : 'Выберите флот, департамент и должность'}</p>
      </Footer>
    </>
  )
}
