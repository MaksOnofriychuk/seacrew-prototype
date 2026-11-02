import { useState, type FormEvent } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { useView } from '@/components/app/states'
import { Paper } from '@/components/app/paper'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect } from '@/components/web/fields'
import type { ScreenProps } from '../types'
import { AuthLayout, Pitch } from './_parts'

// r-register — реєстрація рекрутера й організації (contract-recruiter-web §7: register-recruiter
// створює користувача, організацію без verifiedAt і членство «Владелец»). Після — «организация на проверке»:
// кабінет працює, а звати моряків можна лише після перевірки (ORGANIZATION_NOT_VERIFIED).

const COUNTRIES = ['Болгария', 'Великобритания', 'Греция', 'Кипр', 'Латвия', 'Мальта', 'Нидерланды', 'Норвегия', 'ОАЭ', 'Польша', 'Румыния', 'Сингапур', 'Украина', 'Филиппины']

type Form = { name: string; email: string; password: string; company: string; country: string; city: string; site: string }
const EMPTY: Form = { name: '', email: '', password: '', company: '', country: '', city: '', site: '' }

export function RRegister({ go }: ScreenProps) {
  const [f, setF] = useState<Form>(EMPTY)
  const [touched, setTouched] = useState(false)
  const [done, setDone] = useState(false)
  // Стан з панелі: «Ошибка» — email уже зайнятий, «Загрузка» — кнопка «Регистрируем…».
  const view = useView()
  const busy = view === 'loading'
  const set = (k: keyof Form) => (v: string) => setF((s) => ({ ...s, [k]: v }))

  const errors: Partial<Record<keyof Form, string>> = {}
  if (!f.name.trim()) errors.name = 'Укажите имя и фамилию'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'Введите рабочий email, например name@company.com'
  if (f.password.length < 8) errors.password = 'Не короче 8 символов'
  if (!f.company.trim()) errors.company = 'Укажите название компании'
  if (!f.country) errors.country = 'Выберите страну'
  const err = (k: keyof Form) => (touched ? errors[k] : undefined)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length === 0 && view === 'normal') setDone(true)
  }

  if (done) return <Pending company={f.company} country={f.country} email={f.email} go={go} />

  return (
    <AuthLayout aside={<Pitch />} go={go}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">Регистрация компании</h1>
          <p className="text-[15px] text-muted-foreground">Вы станете владельцем аккаунта компании.</p>
        </div>

        <Paper title="Вы">
          <div className="flex flex-col gap-4">
            <WebField id="reg-name" label="Имя и фамилия" required error={err('name')}>
              <WebInput id="reg-name" autoComplete="name" value={f.name} onChange={(e) => set('name')(e.target.value)} />
            </WebField>
            <WebField id="reg-email" label="Рабочий email" required error={err('email')}>
              <WebInput id="reg-email" type="email" autoComplete="email" placeholder="name@company.com" value={f.email} onChange={(e) => set('email')(e.target.value)} />
            </WebField>
            <WebField id="reg-pass" label="Пароль" required hint="Не короче 8 символов" error={err('password')}>
              <WebInput id="reg-pass" type="password" autoComplete="new-password" value={f.password} onChange={(e) => set('password')(e.target.value)} />
            </WebField>
          </div>
        </Paper>

        <Paper title="Компания">
          <div className="flex flex-col gap-4">
            <WebField id="reg-company" label="Название" required error={err('company')}>
              <WebInput id="reg-company" autoComplete="organization" value={f.company} onChange={(e) => set('company')(e.target.value)} />
            </WebField>
            <div className="grid grid-cols-2 gap-3">
              <WebField id="reg-country" label="Страна" required error={err('country')}>
                <WebSelect id="reg-country" value={f.country} onChange={set('country')} options={COUNTRIES} />
              </WebField>
              <WebField id="reg-city" label="Город">
                <WebInput id="reg-city" value={f.city} onChange={(e) => set('city')(e.target.value)} />
              </WebField>
            </div>
            <WebField id="reg-site" label="Сайт" hint="Необязательно. Поможет быстрее проверить компанию.">
              <WebInput id="reg-site" placeholder="company.com" value={f.site} onChange={(e) => set('site')(e.target.value)} />
            </WebField>
          </div>
        </Paper>

        {view === 'error' && (
          <p role="alert" className="flex items-start gap-2.5 rounded-md border border-signal/40 bg-signal/5 px-3.5 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-signal" />
            Этот email уже зарегистрирован. Войдите или попросите владельца компании добавить вас.
          </p>
        )}

        <Button type="submit" className="h-11 text-[15px]" disabled={busy}>
          {busy ? 'Регистрируем…' : 'Зарегистрировать компанию'}
        </Button>
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
