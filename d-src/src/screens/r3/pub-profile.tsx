import { useState } from 'react'
import { EyeOff, Lock, UserRoundX } from 'lucide-react'
import { Paper } from '@/components/app/paper'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebAvatar } from '@/components/web/status-badge'
import { PUB_PROFILE as P } from '@/lib/data-recruiter-3'
import type { ScreenProps } from '../types'
import { ExampleMark, GetAppDialog, PublicLayout, QrCode, StoreButtons } from './_parts'

// pub-profile — профіль моряка за публічним посиланням (відп. 51, правка №30).
// Ззовні видно лише ім'я з першою літерою прізвища й посаду; без прізвища, фото, контактів і документів (№30).
// Незареєстрований більше нічого не бачить — профіль відкривається в застосунку (відп. 51, 20: вебу для моряків немає).
// Праворуч — як посилання виглядає в мессенджері (превью з відп. 51, фото замінено ініціалами за №30).
export function PubProfile({ go }: ScreenProps) {
  const [app, setApp] = useState(false)

  return (
    <PublicLayout here="pub-profile" go={go} onGetApp={() => setApp(true)}>
      <div className="mx-auto max-w-[1120px] px-10 py-12">
        <ViewState
          loading={{ kind: 'cards' }}
          empty={{
            icon: UserRoundX,
            title: 'Профиль недоступен',
            text: 'Моряк скрыл профиль или удалил аккаунт.',
            action: (
              <Button variant="outline" className="h-10 text-primary" onClick={() => go('pub-landing')}>
                На главную
              </Button>
            ),
          }}
          error={{ title: 'Не удалось открыть профиль', text: 'Проверьте подключение и попробуйте ещё раз.' }}
        >
          <div className="grid grid-cols-[1fr_340px] items-start gap-16">
            <div className="flex min-w-0 flex-col gap-8">
              <div className="flex items-center gap-5">
                <WebAvatar initials={P.initials} size="lg" className="size-20 border border-border bg-surface text-2xl" />
                <div className="flex flex-col gap-1">
                  <h1 className="text-[40px] leading-tight font-semibold tracking-tight">{P.name}</h1>
                  <p className="text-lg text-muted-foreground">
                    {P.position}, {P.fleet}
                  </p>
                </div>
              </div>

              <Paper title="Профиль моряка в Seafolio" className="[&>div:last-child]:p-0">
                <div className="flex flex-col gap-1.5 px-6 pt-5 pb-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <Lock className="size-4.5 text-muted-foreground" /> Профиль открывается в приложении
                  </h2>
                  <p className="max-w-[560px] text-[15px] text-muted-foreground">Войдите в Seafolio, чтобы увидеть то же, что видят другие моряки. Агентства смотрят профиль в своём кабинете.</p>
                </div>
                <ul className="border-t border-border">
                  {P.closed.map((c) => (
                    <li key={c} className="flex items-center justify-between gap-4 border-t border-border px-6 py-3 first:border-t-0">
                      <span className="text-[15px]">{c}</span>
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Lock className="size-3.5" /> после входа
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-6 border-t border-border px-6 py-5">
                  <QrCode seed={P.slug} size={96} />
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">Ещё нет приложения? Наведите камеру на код или скачайте:</p>
                    <StoreButtons />
                  </div>
                </div>
              </Paper>

              <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <EyeOff className="mt-0.5 size-4 shrink-0" />
                Фамилию, фото, контакты и документы моряка по ссылке не видно никому.
              </p>
            </div>

            <aside className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                  Так ссылка выглядит в мессенджере <ExampleMark />
                </span>
                <div className="rounded-xl border border-border bg-surface p-3">
                  <div className="rounded-lg bg-muted px-3.5 py-3">
                    <span className="text-sm text-primary">
                      crew.app<span className="text-muted-foreground">{P.slug}</span>
                    </span>
                    <div className="mt-2 flex items-start gap-3 border-l-2 border-primary pl-3">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-xs font-semibold text-primary">Seafolio</span>
                        <span className="text-sm font-semibold">
                          {P.name}, {P.position}
                        </span>
                        <span className="text-sm text-muted-foreground">Профиль моряка в Seafolio</span>
                      </div>
                      <WebAvatar initials={P.initials} className="size-12 bg-surface" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-border pt-6">
                <span className="text-[15px] font-semibold">Вы из агентства?</span>
                <p className="text-sm text-muted-foreground">Профиль моряка с опытом и документами открыт в кабинете агентства.</p>
                <Button variant="outline" className="mt-1 h-10 self-start text-primary" onClick={() => go('r-login')}>
                  Войти в кабинет
                </Button>
              </div>
            </aside>
          </div>
        </ViewState>
      </div>

      <GetAppDialog
        open={app}
        onClose={() => setApp(false)}
        seed={P.slug}
        title="Скачайте Seafolio"
        text={`После установки профиль ${P.name} откроется сам.`}
      />
    </PublicLayout>
  )
}
