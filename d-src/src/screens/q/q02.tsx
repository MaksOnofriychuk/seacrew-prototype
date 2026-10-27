import { useState } from 'react'
import { Clock, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../registry'
import { CheckRow, FlowScreen, Footer, Hint, QSheet, Title, useQ } from './_parts'

// q02 — згода перед завантаженням файлів. Дві окремі галочки, заздалегідь не відмічені;
// потрібні обидві. «Подробнее о согласии» — вікно знизу з коротким текстом. Тексти з C.
const ITEMS = [
  { icon: Sparkles, title: 'ИИ прочитает CV и документы', text: 'Возьмём из них всё нужное для профиля' },
  { icon: Lock, title: 'Файлы шифруются', text: 'Видите их вы и те, кому откроете доступ' },
  { icon: ShieldCheck, title: 'Защита от повторных аккаунтов', text: 'Храним отпечаток номера документа, а не сам номер' },
  { icon: Clock, title: 'Не закончили — удалим', text: 'Через 30 дней файлы удаляются сами' },
]

const LEGAL: [string, string][] = [
  ['Что мы обрабатываем.', 'CV и документы, которые вы загрузите, а также email и данные, которые вы введёте сами.'],
  ['Зачем.', 'Чтобы создать ваш профиль моряка, помогать с работой и защищать платформу от повторных и поддельных аккаунтов.'],
  ['Как.', 'CV и документы читает ИИ целиком: личные данные, документы, диплом, морской стаж. ИИ-сервисы работают как наши подрядчики. Файлы шифруются.'],
  ['Кто видит.', 'Вы. Агентства — только то, к чему вы откроете доступ. Администратор — для поддержки и безопасности.'],
  ['Сколько храним.', 'Пока у вас есть аккаунт. Если регистрацию не закончить — файлы удаляются через 30 дней. После удаления аккаунта для безопасности платформы храним отпечаток номера документа, а не сам номер.'],
  ['Ваши права.', 'Отозвать согласие, удалить аккаунт и получить копию данных можно в профиле: «Отозвать согласие» и «Скачать мои данные».'],
]

export function Q02Consent({ go }: ScreenProps) {
  const { bag, setBag } = useQ()
  const c = bag('q.consent', { terms: false, data: false })
  const [more, setMore] = useState(false)
  const both = c.terms && c.data
  const link = 'text-primary underline underline-offset-4'

  return (
    <FlowScreen
      step={1}
      onBack={() => go('o03')}
      footer={
        <Footer className="border-t border-border pt-4">
          <CheckRow id="q02-terms" checked={c.terms} onChange={(v) => setBag('q.consent', { ...c, terms: v })}>
            Принимаю{' '}
            <a href="#" className={link} onClick={(e) => e.preventDefault()}>
              Условия сервиса
            </a>{' '}
            и{' '}
            <a href="#" className={link} onClick={(e) => e.preventDefault()}>
              Политику конфиденциальности
            </a>
          </CheckRow>
          <CheckRow id="q02-data" checked={c.data} onChange={(v) => setBag('q.consent', { ...c, data: v })}>
            Согласен на обработку документов, включая чтение ИИ
          </CheckRow>
          <Button size="lg" className="mt-1" disabled={!both} onClick={() => go('q03')}>
            Продолжить
          </Button>
          <Hint>{both ? '' : 'Отметьте оба пункта, чтобы продолжить'}</Hint>
        </Footer>
      }
      overlay={
        <QSheet open={more} onClose={() => setMore(false)} title="Согласие на обработку данных">
          <div className="flex flex-col gap-3 text-[15px] leading-relaxed">
            {LEGAL.map(([b, t]) => (
              <p key={b}>
                <span className="font-semibold">{b}</span> {t}
              </p>
            ))}
            <p className="text-sm text-muted-foreground">Черновик. Окончательный текст готовит юрист.</p>
          </div>
          <Button size="lg" className="mt-6" onClick={() => setMore(false)}>
            Понятно
          </Button>
        </QSheet>
      }
    >
      <Title sub="Чтобы создать аккаунт по документам, нужно ваше согласие.">Прежде чем начать</Title>
      <ul className="mt-5 rounded-xl border border-border bg-surface px-4">
        {ITEMS.map((x) => (
          <li key={x.title} className="flex items-start gap-4 border-t border-border py-2.5 first:border-t-0">
            <x.icon className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
            <span className="flex flex-col gap-0.5">
              <span className="text-[15px] font-medium">{x.title}</span>
              <span className="text-sm text-muted-foreground">{x.text}</span>
            </span>
          </li>
        ))}
      </ul>
      <button type="button" className="mt-3 text-[15px] font-medium text-primary" onClick={() => setMore(true)}>
        Подробнее о согласии
      </button>
    </FlowScreen>
  )
}
