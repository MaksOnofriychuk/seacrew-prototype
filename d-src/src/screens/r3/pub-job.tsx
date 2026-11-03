import { useState, type ReactNode } from 'react'
import { BadgeCheck, Link2, Lock, Smartphone } from 'lucide-react'
import { MonoNums } from '@/components/app/mono-nums'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { PUB_JOB as J } from '@/lib/data-recruiter-3'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../types'
import { GetAppDialog, PublicLayout, QrCode, ruDate } from './_parts'

// pub-job — публічна сторінка вакансії для посилань «Поделиться» (відп. 102): опис,
// лише вітрина: моряку — «Скачать приложение» (відгук тільки в застосунку, вебу для моряків немає), без кнопки відгуку у вебі. Без кабінету.
// Стан «Пусто» — вакансію закрили (посилання живе далі); «Ошибка», «Загрузка» — звичайні.
export function PubJob({ go }: ScreenProps) {
  const { showToast } = useProto()
  const [app, setApp] = useState(false)

  return (
    <PublicLayout here="pub-job" go={go} onGetApp={() => setApp(true)}>
      <div className="mx-auto max-w-[1120px] px-10 py-12">
        <ViewState
          loading={{ kind: 'cards' }}
          empty={{
            icon: Lock,
            title: 'Вакансия закрыта',
            text: 'Агентство уже нашло моряка. Похожие вакансии — в приложении Seafolio.',
            action: (
              <Button className="h-10" onClick={() => setApp(true)}>
                Скачать приложение
              </Button>
            ),
          }}
          error={{ title: 'Не удалось открыть вакансию', text: 'Проверьте подключение и попробуйте ещё раз.' }}
        >
          <div className="grid grid-cols-[1fr_340px] items-start gap-16">
            <article className="flex min-w-0 flex-col">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">{J.companyShort}</span>
                <span className="flex flex-col leading-tight">
                  <span className="flex items-center gap-1.5 text-[15px] font-semibold">
                    {J.company}
                    <BadgeCheck className="size-4 text-success" aria-label="Агентство проверено" />
                  </span>
                  <span className="text-sm text-muted-foreground">Крюинговое агентство, {J.companyPlace}</span>
                </span>
              </div>

              <h1 className="mt-8 text-[44px] leading-[1.05] font-semibold tracking-tight">{J.position}</h1>
              <p className="mt-2 text-lg text-muted-foreground">
                {J.vesselType}, {J.vesselName}
              </p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="text-[30px] leading-none font-semibold tracking-tight text-primary tabular-nums">{J.salary}</span>
                <span className="text-[15px] text-muted-foreground">{J.period}</span>
              </p>

              <dl className="mt-8 grid grid-cols-4 border-y border-border">
                {J.facts.map(([l, v]) => (
                  <div key={l} className="flex flex-col gap-1 border-l border-border py-4 pl-5 first:border-l-0 first:pl-0">
                    <dt className="text-sm text-muted-foreground">{l}</dt>
                    <dd className="text-[15px] font-medium">
                      <MonoNums text={v} />
                    </dd>
                  </div>
                ))}
              </dl>

              <Block title="Требования">
                <ul className="flex flex-col">
                  {J.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-3 border-t border-border py-3 first:border-t-0 first:pt-0">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-[15px]">{r}</span>
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Судно">
                <dl className="grid grid-cols-2 gap-x-10">
                  {J.vessel.map(([l, v]) => (
                    <div key={l} className="flex justify-between gap-4 border-t border-border py-3">
                      <dt className="text-[15px] text-muted-foreground">{l}</dt>
                      <dd className="text-right text-[15px] font-medium">
                        <MonoNums text={v} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </Block>

              <Block title="О вакансии">
                <p className="max-w-[640px] text-[15px] leading-relaxed">{J.description}</p>
              </Block>

              <p className="mt-10 text-sm text-muted-foreground">
                Опубликовано <span className="font-mono">{ruDate(J.posted)}</span>, просмотров <span className="font-mono">{J.views}</span>
              </p>
            </article>

            <aside className="sticky top-0 flex flex-col gap-5 rounded-xl border border-border bg-surface p-6">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold">Вакансия в приложении</h2>
                <p className="text-sm text-muted-foreground">Откликнуться и написать агентству можно в приложении Seafolio. На сайте отклик недоступен.</p>
              </div>
              <Button className="h-12 text-[15px]" onClick={() => setApp(true)}>
                <Smartphone /> Скачать приложение
              </Button>
              <Button
                variant="outline"
                className="h-10 text-primary"
                onClick={() => showToast('Ссылка на вакансию скопирована')}
              >
                <Link2 /> Скопировать ссылку
              </Button>
              <div className="flex items-center gap-4 border-t border-border pt-5">
                <QrCode seed={J.slug} size={84} />
                <p className="text-sm text-muted-foreground">Откройте вакансию на телефоне: наведите камеру на код.</p>
              </div>
            </aside>
          </div>
        </ViewState>
      </div>

      <GetAppDialog
        open={app}
        onClose={() => setApp(false)}
        seed={J.slug}
        title="Скачайте Seafolio"
        text={`${J.position}, ${J.vesselName}. После установки вакансия откроется в приложении.`}
      />
    </PublicLayout>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}
