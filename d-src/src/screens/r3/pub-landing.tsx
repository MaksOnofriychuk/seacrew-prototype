import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ScreenProps } from '../types'
import { GetAppDialog, PublicLayout, QrCode, StoreButtons } from './_parts'

// pub-landing — «Seafolio — главная», мінімально: морякам — застосунок (вебу для моряків немає, відп. 20),
// агентствам — «Войти в кабинет» і реєстрація компанії. Без сітки й координат (вони лише в онбордингу).
export function PubLanding({ go }: ScreenProps) {
  const [app, setApp] = useState(false)

  return (
    <PublicLayout go={go} onGetApp={() => setApp(true)}>
      <div className="mx-auto flex max-w-[1120px] flex-col px-10 pt-24 pb-20">
        <h1 className="max-w-[820px] text-[56px] leading-[1.04] font-semibold tracking-tight">Документы, стаж и работа в море — в одном приложении</h1>
        <p className="mt-6 max-w-[600px] text-lg text-muted-foreground">
          Моряк сфотографировал документы — профиль заполнен. Агентства находят его по флоту, должности и дате готовности и зовут на работу.
        </p>

        <div className="mt-20 grid grid-cols-2 border-t border-border">
          <section className="flex flex-col gap-5 py-10 pr-12">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Морякам</h2>
              <p className="max-w-[420px] text-[15px] text-muted-foreground">Профиль, документы со сроками, вакансии и переписка с агентствами. Основное бесплатно, на iPhone и Android.</p>
            </div>
            <div className="flex items-center gap-6">
              <QrCode seed="seafolio-app" size={96} />
              <StoreButtons vertical />
            </div>
          </section>
          <section className="flex flex-col gap-5 border-l border-border py-10 pl-12">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">Агентствам</h2>
              <p className="max-w-[420px] text-[15px] text-muted-foreground">Кабинет в браузере: поиск моряков, вакансии, отклики, анкеты и чат. Звать моряков на работу можно после проверки компании.</p>
            </div>
            <div className="flex gap-2">
              <Button className="h-11 px-5 text-[15px]" onClick={() => go('r-login')}>
                Войти в кабинет
              </Button>
              <Button variant="outline" className="h-11 px-5 text-[15px] text-primary" onClick={() => go('r-register')}>
                Зарегистрировать компанию
              </Button>
            </div>
          </section>
        </div>
      </div>

      <GetAppDialog open={app} onClose={() => setApp(false)} seed="seafolio-app" title="Скачайте Seafolio" text="Приложение для моряков: iPhone на iOS 16 и новее, Android 8 и новее." />
    </PublicLayout>
  )
}
