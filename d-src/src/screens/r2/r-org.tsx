import { useState } from 'react'
import { WebCountrySelect, WebMultiSelect } from '@/components/web/web-pickers'
import { BadgeCheck, ChevronRight, CreditCard, ShieldCheck, Users } from 'lucide-react'
import { ViewState } from '@/components/app/states'
import { Button } from '@/components/ui/button'
import { WebField, WebInput, WebSelect, WebTextarea } from '@/components/web/fields'
import { PageHeader } from '@/components/web/page-header'
import { WebShell } from '@/components/web/shell'
import { TEAM, type TeamMember } from '@/lib/data-recruiter-3'
import { FLEETS } from '@/lib/data'
import { ORG_CITIES, ORG_FOUNDED, ORG_LANGUAGES, ORG_SIZES, ORG_TYPES, OTHER_CITY } from '@/lib/data-recruiter-sf'
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
  const [org, setOrg] = useState({ name: RECRUITER_ORG.name, country: RECRUITER_ORG.country, city: RECRUITER_ORG.city, site: RECRUITER_ORG.site, type: ORG_TYPES[0], size: ORG_SIZES[1], founded: '2012', languages: ['Русский', 'Английский'], fleets: ['Merchant', 'Offshore'], publicEmail: 'crewing@bluewave-crewing.example', telegram: '@bluewave_crewing', whatsapp: '+357 25 000 123', viber: '', linkedin: 'linkedin.com/company/bluewave-crewing', facebook: '', instagram: '', about: 'Набираем офицеров и рядовой состав на танкеры, балкеры и суда снабжения. Работаем с судовладельцами из ЕС и Азии.' })
  const cities = [...(ORG_CITIES[org.country] ?? []), OTHER_CITY]
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

        <div className="grid grid-cols-[minmax(0,880px)_300px] items-start gap-12">
          <div className="flex flex-col gap-5">
            <h2 className="border-b border-border pb-2 text-base font-semibold">Профиль компании</h2>
            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
              <WebField id="org-name" label="Название" className="col-span-2" hint={undefined}>
                <WebInput id="org-name" value={org.name} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, name: e.target.value })} />
              </WebField>
              <WebField id="org-size" label="Сотрудников" hint={undefined}>
                <WebSelect id="org-size" value={org.size} disabled={!iAmOwner} onChange={(size) => setOrg({ ...org, size })} options={ORG_SIZES} />
              </WebField>
              <WebField id="org-type" label="Тип компании" hint={undefined}>
                <WebSelect id="org-type" value={org.type} disabled={!iAmOwner} onChange={(type) => setOrg({ ...org, type })} options={ORG_TYPES} />
              </WebField>
              <WebField id="org-country" label="Страна" hint={undefined}>
                <WebCountrySelect id="org-country" value={org.country} disabled={!iAmOwner} onChange={(country) => setOrg({ ...org, country, city: (ORG_CITIES[country] ?? [])[0] ?? OTHER_CITY })} />
              </WebField>
              <WebField id="org-city" label="Город" hint={undefined}>
                <WebSelect id="org-city" value={org.city} disabled={!iAmOwner} onChange={(city) => setOrg({ ...org, city })} options={cities} searchable />
              </WebField>
              <WebField id="org-founded" label="Год основания" hint={undefined}>
                <WebSelect id="org-founded" value={org.founded} disabled={!iAmOwner} onChange={(founded) => setOrg({ ...org, founded })} options={ORG_FOUNDED} searchable />
              </WebField>
              <WebField id="org-lang" label="Языки работы" className="col-span-2" hint={undefined}>
                <WebMultiSelect id="org-lang" values={org.languages} disabled={!iAmOwner} onChange={(languages) => setOrg({ ...org, languages })} options={ORG_LANGUAGES} placeholder="Выберите языки" />
              </WebField>
              <WebField id="org-fleets" label="Флоты, с которыми работаете" className="col-span-3" hint={undefined}>
                <WebMultiSelect id="org-fleets" values={org.fleets} disabled={!iAmOwner} onChange={(fleets) => setOrg({ ...org, fleets })} options={[...FLEETS]} placeholder="Выберите флоты" />
              </WebField>
              <WebField id="org-site" label="Сайт" className="col-span-3" hint={undefined}>
                <WebInput id="org-site" value={org.site} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, site: e.target.value })} />
              </WebField>
              <WebField id="org-public-email" label="Публичный email для связи для кандидатов" className="col-span-3" hint={undefined}>
                <WebInput id="org-public-email" type="email" value={org.publicEmail} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, publicEmail: e.target.value })} placeholder="crewing@company.com" />
              </WebField>
              <h3 className="col-span-3 mt-3 text-sm font-medium">Мессенджеры</h3>
              <WebField id="org-telegram" label="Telegram" hint={undefined}>
                <WebInput id="org-telegram" value={org.telegram} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, telegram: e.target.value })} placeholder="@username" />
              </WebField>
              <WebField id="org-whatsapp" label="WhatsApp" hint={undefined}>
                <WebInput id="org-whatsapp" type="tel" value={org.whatsapp} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, whatsapp: e.target.value })} placeholder="+000 00 000 000" />
              </WebField>
              <WebField id="org-viber" label="Viber" hint={undefined}>
                <WebInput id="org-viber" type="tel" value={org.viber} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, viber: e.target.value })} placeholder="+000 00 000 000" />
              </WebField>
              <h3 className="col-span-3 mt-3 text-sm font-medium">Соцсети</h3>
              <WebField id="org-linkedin" label="LinkedIn" hint={undefined}>
                <WebInput id="org-linkedin" value={org.linkedin} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, linkedin: e.target.value })} placeholder="linkedin.com/company/…" />
              </WebField>
              <WebField id="org-facebook" label="Facebook" hint={undefined}>
                <WebInput id="org-facebook" value={org.facebook} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, facebook: e.target.value })} placeholder="facebook.com/…" />
              </WebField>
              <WebField id="org-instagram" label="Instagram" hint={undefined}>
                <WebInput id="org-instagram" value={org.instagram} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, instagram: e.target.value })} placeholder="instagram.com/…" />
              </WebField>
              <WebField id="org-about" label="О компании" hint="Моряки видят это на вакансиях агентства" className="col-span-3">
                <WebTextarea id="org-about" value={org.about} disabled={!iAmOwner} onChange={(e) => setOrg({ ...org, about: e.target.value })} className="min-h-24" />
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
