import { useState } from 'react'
import { PageTabs } from '@/components/web/page-header'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { GetAppDialog, PublicLayout } from './_parts'

// pub-legal — «Условия сервиса», «Политика конфиденциальности» и «Поддержка» текстом (перевірка 03.11, №16):
// посилання з реєстрації, входу, налаштувань і низу сайту ведуть сюди, а не тостом. Вкладки перемикають текст на місці.
// Текст — приклад структури: справжній дасть замовник (юрист).

export type LegalTab = 'terms' | 'privacy' | 'support'

const DOCS: Record<Exclude<LegalTab, 'support'>, { title: string; sections: [string, string][] }> = {
  terms: {
    title: 'Условия сервиса',
    sections: [
      ['1. Что такое Seafolio', 'Приложение для моряков и кабинет для агентств. Моряк хранит документы и профиль, агентство ищет моряков, публикует вакансии и отправляет анкеты. Пример текста — окончательный даст юрист.'],
      ['2. Аккаунт агентства', 'Компанию регистрирует владелец. Он отвечает за рекрутеров, которых добавил, и за вакансии, опубликованные от имени компании.'],
      ['3. Данные моряков', 'Агентство видит только то, что моряк сам показал или отправил в анкете. Фамилию, контакты и файлы документов моряк раскрывает сам.'],
      ['4. Вакансии и переписка', 'Вакансии должны быть настоящими. Спам, чужие данные и навязчивые предложения ведут к блокировке аккаунта компании.'],
      ['5. Тариф и оплата', 'Условия тарифа и счета — в разделе «Тариф и оплата». Подписку можно отменить в любой момент, она действует до конца оплаченного периода.'],
      ['6. Изменения условий', 'О существенных изменениях предупредим заранее по почте и в кабинете.'],
    ],
  },
  privacy: {
    title: 'Политика конфиденциальности',
    sections: [
      ['1. Какие данные собираем', 'Данные компании и рекрутеров, вакансии, переписку, ответы моряков на анкеты. Пример текста — окончательный даст юрист.'],
      ['2. Зачем', 'Чтобы кабинет работал: поиск моряков, отклики, анкеты, чат. Данные не продаём.'],
      ['3. Кто видит', 'Рекрутеры вашей компании. Моряк видит только то, что вы ему отправили. Команда Seafolio — для проверки компании и поддержки.'],
      ['4. Хранение', 'Файлы и переписка хранятся зашифрованными, пока работает аккаунт компании.'],
      ['5. Ваши права', 'Скачать данные компании и закрыть аккаунт можно через поддержку.'],
      ['6. Контакты', 'Вопросы о данных — через раздел «Поддержка».'],
    ],
  },
}

const TABS: { id: LegalTab; label: string }[] = [
  { id: 'terms', label: 'Условия сервиса' },
  { id: 'privacy', label: 'Политика конфиденциальности' },
  { id: 'support', label: 'Поддержка' },
]

export function PubLegal({ go }: ScreenProps) {
  const { bag, setBag } = useProto()
  const [app, setApp] = useState(false)
  const tab = bag<LegalTab>('legal.web', 'terms')
  const back = bag<string>('back.pub-legal', 'pub-landing')
  return (
    <PublicLayout here="pub-legal" go={go} onGetApp={() => setApp(true)}>
      <div className="mx-auto max-w-[760px] px-10 py-12">
        <button type="button" onClick={() => go(back)} className="mb-6 text-sm font-medium text-primary hover:underline">
          ← Назад
        </button>
        <PageTabs tabs={TABS} value={tab} onChange={(t) => setBag('legal.web', t)} />
        {tab === 'support' ? (
          <article className="flex flex-col gap-4">
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">Поддержка</h1>
            <p className="text-[15px] leading-relaxed text-muted-foreground">Вопрос по кабинету, оплате или проверке компании — напишите, ответим в рабочие дни. Для вопросов по конкретному моряку или вакансии приложите ссылку на страницу.</p>
            <dl className="mt-2 flex flex-col divide-y divide-border rounded-xl border border-border bg-surface text-[15px]">
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted-foreground">Почта</dt>
                <dd className="font-mono">support@seafolio.example</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted-foreground">Ответ</dt>
                <dd>в течение рабочего дня</dd>
              </div>
            </dl>
          </article>
        ) : (
          <article>
            <h1 className="text-[32px] leading-tight font-semibold tracking-tight">{DOCS[tab].title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Действует с <span className="font-mono">25.10.2026</span>
            </p>
            <div className="mt-8 flex flex-col gap-7">
              {DOCS[tab].sections.map(([h, t]) => (
                <section key={h}>
                  <h2 className="text-lg font-semibold">{h}</h2>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{t}</p>
                </section>
              ))}
            </div>
          </article>
        )}
      </div>
      <GetAppDialog open={app} onClose={() => setApp(false)} seed="seafolio-app" title="Скачайте Seafolio" text="Приложение для моряков: iPhone на iOS 16 и новее, Android 8 и новее." />
    </PublicLayout>
  )
}

/** Открыть текст и запомнить, куда вернуться. */
export function useOpenLegal(go: (id: string) => void, from: string) {
  const { setBag } = useProto()
  return (tab: LegalTab) => {
    setBag('legal.web', tab)
    setBag('back.pub-legal', from)
    go('pub-legal')
  }
}
