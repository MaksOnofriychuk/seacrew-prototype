import { useState, type FormEvent } from 'react'
import { WebCountrySelect, WebPhoneField } from '@/components/web/web-pickers'

import { AlertTriangle, Clock } from 'lucide-react'
import { useView } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebCheckbox, WebField, WebInput, WebSelect } from '@/components/web/fields'
import type { ScreenProps } from '../types'
import { useOpenLegal } from '../r3/pub-legal'
import { COMPANY_TYPES, CITIES } from '@/lib/data-cities'
import { AuthLayout, Pitch } from './_parts'
import { RegSteps } from './_stepper'

// r-register — реєстрація рекрутера й організації (contract-recruiter-web §7: register-recruiter
// створює користувача, організацію без verifiedAt і членство «Владелец»). Після — «организация на проверке»:
// кабінет працює, а звати моряків можна лише після перевірки (ORGANIZATION_NOT_VERIFIED).


type Form = { name: string; email: string; phone: string; password: string; company: string; kind: string; country: string; city: string; site: string }
const EMPTY: Form = { name: '', email: '', phone: '', password: '', company: '', kind: '', country: '', city: '', site: '' }
const STEPS = ['Вы', 'Компания', 'Подтверждение']

export function RRegister({ go }: ScreenProps) {
  const [f, setF] = useState<Form>(EMPTY)
  const [step, setStep] = useState(0)
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  const [agree, setAgree] = useState(false)
  const legal = useOpenLegal(go, 'r-register')
  // Стан з панелі: «Ошибка» — email уже зайнятий, «Загрузка» — кнопка «Регистрируем…».
  const view = useView()
  const busy = view === 'loading'
  const set = (k: keyof Form) => (v: string) => setF((s) => (k === 'country' ? { ...s, country: v, city: '' } : { ...s, [k]: v }))

  const errors: Partial<Record<keyof Form, string>> = {}
  if (!f.name.trim()) errors.name = 'Укажите имя и фамилию'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'Введите рабочий email'
  if (f.password.length < 8) errors.password = 'Не короче 8 символов'
  if (!f.company.trim()) errors.company = 'Укажите название компании'
  if (!f.kind) errors.kind = 'Выберите тип компании'
  if (!f.country) errors.country = 'Выберите страну'
  const stepKeys: (keyof Form)[][] = [['name', 'email', 'password'], ['company', 'kind', 'country'], []]
  const stepOk = (i: number) => stepKeys[i].every((k) => !errors[k])
  const err = (k: keyof Form) => (touched ? errors[k] : undefined)
  const cities = CITIES[f.country]

  const next = () => {
    setTouched(true)
    if (!stepOk(step)) return
    setTouched(false)
    setStep(step + 1)
  }
  const back = (i: number) => {
    setTouched(false)
    setStep(i)
  }
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (step < 2) return next()
    setTouched(true)
    if (agree && view === 'normal') setDone(true)
  }

  if (done) return <Pending company={f.company} country={f.country} email={f.email} go={go} />

  return (
    <AuthLayout aside={<Pitch />} go={go}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl leading-tight font-semibold tracking-tight">Регистрация компании</h1>
          <p className="text-sm text-muted-foreground">Вы станете владельцем аккаунта компании.</p>
        </div>

        <RegSteps steps={STEPS} current={step} onGo={back} />

        <div className="flex min-h-[318px] flex-col gap-1">
          {step === 0 && (
            <>
              <WebField id="reg-name" label="Имя и фамилия" required error={err('name')}>
                <WebInput id="reg-name" autoComplete="name" value={f.name} onChange={(e) => set('name')(e.target.value)} />
              </WebField>
              <WebField id="reg-email" label="Рабочий email" required error={err('email')}>
                <WebInput id="reg-email" type="email" autoComplete="email" placeholder="name@company.com" value={f.email} onChange={(e) => set('email')(e.target.value)} />
              </WebField>
              <WebField id="reg-phone" label="Телефон">
                <WebPhoneField id="reg-phone" value={f.phone} onChange={set('phone')} hint="По желанию. Позвоним, если нужно уточнить проверку." />
              </WebField>
              <WebField id="reg-pass" label="Пароль" required hint="Не короче 8 символов" error={err('password')}>
                <WebInput id="reg-pass" type="password" autoComplete="new-password" value={f.password} onChange={(e) => set('password')(e.target.value)} />
              </WebField>
            </>
          )}

          {step === 1 && (
            <>
              <WebField id="reg-company" label="Название компании" required error={err('company')}>
                <WebInput id="reg-company" autoComplete="organization" value={f.company} onChange={(e) => set('company')(e.target.value)} />
              </WebField>
              <WebField id="reg-kind" label="Тип компании" required error={err('kind')}>
                <WebSelect id="reg-kind" value={f.kind} onChange={set('kind')} options={COMPANY_TYPES} placeholder="Выберите тип" />
              </WebField>
              <div className="grid grid-cols-2 gap-3">
                <WebField id="reg-country" label="Страна" required error={err('country')}>
                  <WebCountrySelect id="reg-country" value={f.country} onChange={set('country')} />
                </WebField>
                <WebField id="reg-city" label="Город" hint={undefined}>
                  {cities ? (
                    <WebSelect id="reg-city" searchable value={f.city} onChange={set('city')} options={cities} placeholder="Выберите город" />
                  ) : (
                    <WebInput id="reg-city" disabled={!f.country} placeholder={f.country ? 'Город' : 'Сначала страна'} value={f.city} onChange={(e) => set('city')(e.target.value)} />
                  )}
                </WebField>
              </div>
              <WebField id="reg-site" label="Сайт" hint="По желанию. Поможет быстрее проверить компанию.">
                <WebInput id="reg-site" placeholder="company.com" value={f.site} onChange={(e) => set('site')(e.target.value)} />
              </WebField>
            </>
          )}

          {step === 2 && (
            <>
              <dl className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface text-sm">
                {(
                  [
                    ['Вы', f.name, 0],
                    ['Email', f.email, 0],
                    ['Телефон', f.phone || '—', 0],
                    ['Компания', f.company, 1],
                    ['Тип', f.kind, 1],
                    ['Страна, город', [f.country, f.city].filter(Boolean).join(', '), 1],
                    ['Сайт', f.site || '—', 1],
                  ] as const
                ).map(([l, v, st]) => (
                  <div key={l} className="flex items-center justify-between gap-4 px-4 py-2">
                    <dt className="text-muted-foreground">{l}</dt>
                    <dd className="flex min-w-0 items-center gap-3">
                      <span className="truncate font-medium">{v}</span>
                      <button type="button" onClick={() => back(st)} className="shrink-0 text-primary hover:underline">
                        Изменить
                      </button>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-col">
                <WebCheckbox id="reg-agree" checked={agree} onChange={setAgree}>
                  <span>
                    Принимаю{' '}
                    <button type="button" onClick={() => legal('terms')} className="text-primary hover:underline">
                      Условия сервиса
                    </button>{' '}
                    и{' '}
                    <button type="button" onClick={() => legal('privacy')} className="text-primary hover:underline">
                      Политику конфиденциальности
                    </button>
                  </span>
                </WebCheckbox>
                <p className="min-h-5 pt-1 pl-[26px] text-sm text-signal">{touched && !agree ? 'Без согласия зарегистрировать компанию нельзя' : null}</p>
              </div>
              {view === 'error' && (
                <p role="alert" className="flex items-start gap-2.5 rounded-md border border-signal/40 bg-signal/5 px-3.5 py-2.5 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />
                  Этот email уже зарегистрирован. Войдите или попросите владельца компании добавить вас.
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <Button type="button" variant="outline" className="h-10 px-4 text-primary" onClick={() => back(step - 1)}>
              Назад
            </Button>
          )}
          <Button type="submit" className="h-10 flex-1 text-[15px]" disabled={busy}>
            {step < 2 ? 'Далее' : busy ? 'Регистрируем…' : 'Зарегистрировать компанию'}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <button type="button" onClick={() => go('r-login')} className="font-medium text-primary hover:underline">
            Войти
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}

// Після реєстрації: організація чекає перевірки. Кабінет відкритий, «Позвать на работу» — після перевірки.
function Pending({ company, country, email, go }: { company: string; country: string; email: string; go: (id: string) => void }) {
  return (
    <AuthLayout aside={<Pitch />} go={go}>
      <div className="screen-in flex flex-col gap-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-warning/10 text-warning">
          <Clock className="size-5" />
        </span>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Организация на проверке</h1>
          <p className="text-[15px] text-muted-foreground">
            Кабинет уже открыт: можно искать моряков, создавать вакансии и формы. Звать моряков на работу можно будет после того, как команда Seafolio проверит компанию.
          </p>
        </div>
        <dl className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface text-sm">
          <div className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">Компания</dt>
            <dd className="text-right font-medium">{company}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">Страна</dt>
            <dd className="text-right">{country}</dd>
          </div>
          <div className="flex justify-between gap-4 px-5 py-3">
            <dt className="text-muted-foreground">Владелец</dt>
            <dd className="truncate text-right">{email}</dd>
          </div>
        </dl>
        <Button className="h-11 text-[15px]" onClick={() => go('r-search')}>
          Перейти в кабинет
        </Button>
      </div>
    </AuthLayout>
  )
}
