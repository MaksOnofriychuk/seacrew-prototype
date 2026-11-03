import { useState } from 'react'
import { WebCountrySelect } from '@/components/web/web-pickers'
import { BadgeCheck, ChevronRight, CreditCard, ShieldCheck, Users } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { TEAM, type TeamMember } from '@/lib/data-recruiter-3'
import { ME_RECRUITER, RECRUITER_ORG } from '@/lib/data-web'
import { useProto } from '@/lib/proto-state'
import type { ScreenProps } from '../registry'
import { ruDate, useR2 } from './_parts'

// r-org — организация: профиль компании и ссылки на то, что с ней связано (команда, проверка, тариф).
// Участники и роли живут в одном месте — на странице «Команда» (r-team); здесь их не дублируем (перевірка 03.11, №19).
// Сильный элемент — шапка компании с отметкой проверки.
export function ROrg({ go }: ScreenProps) {
  const r = useR2()
  const { bag } = useProto()
  const [org, setOrg] = useState({ name: RECRUITER_ORG.name, country: RECRUITER_ORG.country, city: RECRUITER_ORG.city, site: RECRUITER_ORG.site, about: 'Набираем офицеров и рядовой состав на танкеры, балкеры и суда снабжения. Работаем с судовладельцами из ЕС и Азии.' })
  const iAmOwner = bag<TeamMember[]>('r3.team', TEAM).find((m) => m.id === ME_RECRUITER.id)?.role === 'owner'

  return (
    <WebShell variant="recruiter" active="r-org" go={go}>
      <PageHeader title="Организация" />
      <ViewState loading={{ kind: 'cards' }} empty={{ icon: Users, title: 'Вы не состоите в организации', text: 'Попросите владельца вашей организации снова добавить вас.' }}>
        <div className="mb-8 flex items-center gap-5">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-semibold text-primary-foreground">{RECRUITER_ORG.short}</span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[22px] leading-tight font-semibold">{org.name}</span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {RECRUITER_ORG.verified && (
                <span className="flex items-center gap-1.5 text-success">
                  <BadgeCheck className="size-4" /> Проверена командой Seafolio
                </span>
              )}
              <span>
                {org.city}, {org.country}
              </span>
              <span>{org.site}</span>
              <span>
                В Seafolio с <span className="font-mono">{ruDate(RECRUITER_ORG.created)}</span>
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,720px)_320px] items-start gap-12">
          <div className="flex flex-col gap-5">
            <h2 className="border-b border-border pb-2 text-base font-semibold">Профиль компании</h2>
            <div className="grid grid-cols-2 gap-4">
              <WebField id="org-name" label="Название" className="col-span-2" hint={undefined}>
                <WebInput id="org-name" value={org.name} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </WebField>
              <WebField id="org-country" label="Страна" hint={undefined}>
                <WebCountrySelect id="org-country" value={org.country} disabled={!iAmOwner} onChange={(country) => setOrg({ ...org, country })} />
              </WebField>
              <WebField id="org-city" label="Город" hint={undefined}>
                <WebInput id="org-city" value={org.city} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, city: e.target.value })} />
              </WebField>
              <WebField id="org-site" label="Сайт" className="col-span-2" hint={undefined}>
                <WebInput id="org-site" value={org.site} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, site: e.target.value })} />
              </WebField>
              <WebField id="org-about" label="О компании" hint="Моряки видят это на вакансиях агентства" className="col-span-2">
                <WebTextarea id="org-about" value={org.about} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, about: e.target.value })} className="min-h-28" />
              </WebField>
            </div>
            {iAmOwner ? (
              <Button className="self-start" onClick={() => r.showToast('Профиль компании сохранён')}>
                Сохранить
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">Изменить профиль может только владелец.</p>
            )}
          </div>

          <aside className="flex flex-col gap-3">
            <h2 className="border-b border-border pb-2 text-base font-semibold">Связанное</h2>
            <ul className="overflow-hidden rounded-xl border border-border bg-surface">
              {(
                [
                  ['r-team', Users, 'Команда', 'Рекрутеры, роли и приглашения'],
                  ['r-verify', ShieldCheck, 'Верификация', 'Уровни проверки компании'],
                  ['r-billing', CreditCard, 'Тариф и оплата', 'План, места и способ оплаты'],
                ] as const
              ).map(([id, Icon, title, sub]) => (
                <li key={id} className="border-t border-border first:border-t-0">
                  <button type="button" onClick={() => go(id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
                    <Icon className="size-5 shrink-0 text-primary" />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-[15px] font-medium">{title}</span>
                      <span className="text-[13px] text-muted-foreground">{sub}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </ViewState>
    </WebShell>
  )
}
