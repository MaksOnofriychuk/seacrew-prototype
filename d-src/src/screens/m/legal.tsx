import { NavBar } from '@/components/app/chrome'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'

// m-legal — текст «Условия сервиса» або «Политика конфиденциальности» (перевірка 03.11, №41).
// Який саме — bag 'legal.doc'; звідки прийшли — 'back.m-legal'. Текст — приклад структури:
// справжній дасть замовник (юрист), тут лише розділи, щоб було видно, як це читається з телефона.

export type LegalDoc = 'terms' | 'privacy'

const DOCS: Record<LegalDoc, { title: string; updated: string; sections: [string, string][] }> = {
  terms: {
    title: 'Условия сервиса',
    updated: '25.10.2026',
    sections: [
      ['1. Что такое Seafolio', 'Приложение для моряков: хранит документы, собирает профиль и помогает заполнять анкеты агентств. Пример текста — окончательный даст юрист.'],
      ['2. Аккаунт', 'Один аккаунт на одного моряка. Вы отвечаете за точность данных и за то, кому отправляете анкеты.'],
      ['3. Документы и данные', 'Фото документов хранятся зашифрованными. Агентства видят только то, что вы отправили в анкете.'],
      ['4. Премиум', 'Платные функции описаны в разделе «Премиум». Подписку можно отменить в любой момент.'],
      ['5. Что запрещено', 'Чужие документы, ложные данные, спам и реклама в ленте.'],
      ['6. Изменения условий', 'О существенных изменениях предупредим заранее в приложении и по email.'],
    ],
  },
  privacy: {
    title: 'Политика конфиденциальности',
    updated: '25.10.2026',
    sections: [
      ['1. Какие данные собираем', 'Данные профиля, документы, которые вы загрузили, ответы в анкетах. Пример текста — окончательный даст юрист.'],
      ['2. Зачем', 'Чтобы заполнять профиль и анкеты агентств. Данные не продаём.'],
      ['3. Кто видит', 'Агентство — только то, что вы ему отправили. Медицинские данные — только с вашего отдельного согласия.'],
      ['4. Хранение', 'Файлы документов зашифрованы. Переписка хранится полгода.'],
      ['5. Ваши права', 'Скачать свои данные и удалить аккаунт — в «Настройках».'],
      ['6. Контакты', 'Вопросы — через «Поддержку» в приложении.'],
    ],
  },
}

export function MLegal({ go }: ScreenProps) {
  const { bag } = useProto()
  const doc = DOCS[bag<LegalDoc>('legal.doc', 'terms')]
  const back = bag<string>('back.m-legal', 'm-settings')
  return (
    <div className="relative flex h-full flex-col">
      <NavBar title={doc.title} onBack={() => go(back)} />
      <article className="min-h-0 flex-1 overflow-y-auto px-6 pt-3 pb-10">
        <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Действует с <span className="font-mono">{doc.updated}</span>
        </p>
        <div className="mt-6 flex flex-col gap-6">
          {doc.sections.map(([h, t]) => (
            <section key={h}>
              <h2 className="text-base font-semibold">{h}</h2>
              <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground">{t}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}

/** Відкрити текст і запам'ятати, куди повернутися. */
export function useOpenLegal(go: (id: string) => void, from: string) {
  const { setBag } = useProto()
  return (doc: LegalDoc) => {
    setBag('legal.doc', doc)
    setBag('back.m-legal', from)
    go('m-legal')
  }
}
