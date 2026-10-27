import { useState } from 'react'
import { Camera, Image, Lock, Trash2 } from 'lucide-react'
import { Footer, NavBar } from '@/components/app/chrome'
import { FormField } from '@/components/app/form-field'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProto } from '@/lib/proto-state'
import { cn } from '@/lib/utils'
import type { ScreenProps } from '../registry'

// e07 — ввести дані документа вручну (eManual у C). Форма — як справжній папір:
// шапка з назвою вибраного документа, поля всередині; фото документа — окремо під папером.
// «Продолжить» неактивна, доки немає номера, обох дат і фото (manualValid у C);
// натискання на неактивну підсвічує, чого бракує (як 'blocked' у C).

const DOC_NAMES = ['Удостоверение личности моряка', 'Диплом моряка'] as const
const COUNTRIES = ['Украина', 'Филиппины', 'Индия', 'Польша']

type Form = { name: string; num: string; issue: string; exp: string; country: string; file: boolean }

const EMPTY: Form = { name: DOC_NAMES[0], num: '', issue: '', exp: '', country: 'Украина', file: false }

// ДД.ММ.ГГГГ: лише цифри, крапки ставимо самі.
function maskDate(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8)
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join('.')
}

export function E07Manual({ go }: ScreenProps) {
  const { bag, setBag, set } = useProto()
  const f = bag<Form>('e07.form', EMPTY)
  const [showMissing, setShowMissing] = useState(false)

  const patch = (p: Partial<Form>) => setBag('e07.form', { ...f, ...p })

  const bad = {
    num: !f.num.trim(),
    issue: !f.issue.trim(),
    exp: !f.exp.trim(),
    file: !f.file,
  }
  const valid = !bad.num && !bad.issue && !bad.exp && !bad.file
  const missing = [bad.num && 'номер', (bad.issue || bad.exp) && 'даты', bad.file && 'фото документа'].filter(Boolean)
  const mark = (k: keyof typeof bad) => showMissing && bad[k]

  const next = () => {
    if (!valid) {
      setShowMissing(true)
      // Input без forwardRef (React 18) — шукаємо поле за id.
      const first = document.getElementById(bad.num ? 'e07-num' : bad.issue ? 'e07-issue' : bad.exp ? 'e07-exp' : 'e07-file')
      first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      first?.focus({ preventScroll: true })
      return
    }
    setBag('q.manual', { name: f.name, num: f.num, issue: f.issue, exp: f.exp, country: f.country, file: f.file })
    set({ docType: f.name === 'Диплом моряка' ? 'diploma' : 'sid', scenario: 'ok' })
    go('q05')
  }

  return (
    <div className="flex h-full flex-col">
      <NavBar onBack={() => go('q03')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-6">
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Ввести данные вручную</h1>
        <p className="mt-3 text-base text-muted-foreground">Заполните данные документа и приложите его фото — администратор сверит их.</p>

        <Paper title={f.name} className="mt-6">
          <div className="flex flex-col gap-4">
            <FormField id="e07-name" label="Название документа">
              <Select value={f.name} onValueChange={(name) => patch({ name })}>
                <SelectTrigger id="e07-name" className="w-full text-base data-[size=default]:h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_NAMES.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="e07-num" label="Номер документа">
              <Input
                id="e07-num"
                value={f.num}
                onChange={(e) => patch({ num: e.target.value })}
                placeholder="Как в документе"
                autoComplete="off"
                aria-invalid={mark('num') || undefined}
                className="h-12 font-mono text-base placeholder:font-sans"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="e07-issue" label="Дата выдачи">
                <Input
                    id="e07-issue"
                  value={f.issue}
                  onChange={(e) => patch({ issue: maskDate(e.target.value) })}
                  placeholder="ДД.ММ.ГГГГ"
                  inputMode="numeric"
                  aria-invalid={mark('issue') || undefined}
                  className="h-12 font-mono text-base"
                />
              </FormField>
              <FormField id="e07-exp" label="Дата окончания">
                <Input
                    id="e07-exp"
                  value={f.exp}
                  onChange={(e) => patch({ exp: maskDate(e.target.value) })}
                  placeholder="ДД.ММ.ГГГГ"
                  inputMode="numeric"
                  aria-invalid={mark('exp') || undefined}
                  className="h-12 font-mono text-base"
                />
              </FormField>
            </div>

            <FormField id="e07-country" label="Страна выдачи">
              <Select value={f.country} onValueChange={(country) => patch({ country })}>
                <SelectTrigger id="e07-country" className="w-full text-base data-[size=default]:h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </Paper>

        <h2 className="mt-7 text-base font-semibold">Фото или файл документа</h2>
        {f.file ? (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
            <Image className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[15px] font-medium">Фото документа.jpg</span>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Lock className="size-3 text-success" aria-hidden="true" />
                JPG, <span className="font-mono">1,1 МБ</span>
              </span>
            </span>
            <Button variant="ghost" size="icon-lg" aria-label="Удалить" className="text-muted-foreground" onClick={() => patch({ file: false })}>
              <Trash2 className="size-5" />
            </Button>
          </div>
        ) : (
          <button
            id="e07-file"
            type="button"
            onClick={() => patch({ file: true })}
            className={cn(
              'mt-3 flex w-full items-center gap-4 rounded-xl border border-dashed bg-surface px-4 py-4 text-left transition-colors active:scale-[0.99]',
              mark('file') ? 'border-signal' : 'border-border',
            )}
          >
            <Camera className="size-6 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium">Прикрепить фото или файл</span>
              <span className="text-sm text-muted-foreground">Страница документа с данными</span>
            </span>
          </button>
        )}
      </div>
      <Footer className="border-t border-border">
        <Button size="lg" aria-disabled={!valid} className={cn(!valid && 'opacity-50')} onClick={next}>
          Продолжить
        </Button>
        <p className={cn('min-h-5 text-center text-sm', showMissing ? 'text-signal' : 'text-muted-foreground')} aria-live="polite">
          {missing.length ? 'Осталось: ' + missing.join(', ') : ''}
        </p>
      </Footer>
    </div>
  )
}
