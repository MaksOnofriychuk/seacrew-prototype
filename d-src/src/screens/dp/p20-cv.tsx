import { useState, type ReactNode } from 'react'
import { Download, FolderDown, LoaderCircle, Mail, MessageCircle, Send, Share2 } from 'lucide-react'
import { BottomSheet } from '@/components/app/bottom-sheet'
import { Footer, NavBar } from '@/components/app/chrome'
import { ViewState } from '@/components/app/states'
import { useAvailability } from '@/components/app/availability'
import { Button } from '@/components/ui/button'
import { CONTRACTS, CV_FILE, CV_UPDATED, EN_CIT, EN_COUNTRY, type Contract } from '@/lib/data-docs-profile'
import { ruDate } from '@/lib/data'
import type { ScreenProps } from '../types'
import { ActionRow, useBusy, useDP, useProfile } from './_parts'
import { useDocs } from './_docs'
import { cMonths, durEn } from './_contracts'

// p20 — «Моё CV · PDF» (відповіді 86–90, бриф S45): CV збирається з профілю, завжди англійською (89),
// без логотипів (87), поки безкоштовно (86). «Скачать PDF» — файл на телефон; «Поделиться» — куди
// завгодно (90). Прев'ю — справжній аркуш A4: білий і в темній темі, як PDF.
// Якщо в «Опыте работы» ввімкнено «Скрыть общий стаж» (№34) — у CV його теж немає.

const AVAIL_EN = { now: 'Available for Immediate Joining', from: 'Available from', not: 'Not looking for work' } as const

export function P20Cv({ go }: ScreenProps) {
  const { showToast } = useDP()
  const [share, setShare] = useState(false)
  const { busy, run } = useBusy()

  const download = () => run(() => showToast(`Сохранено в «Загрузки»: ${CV_FILE}`), 900)
  const shared = (where: string) => {
    setShare(false)
    showToast(`CV отправлено: ${where}`)
  }

  return (
    <div className="relative flex h-full flex-col">
      <NavBar onBack={() => go('p14')} />
      <ViewState
        loading={
          <div className="flex flex-1 flex-col items-start justify-center gap-2 px-6 pb-24" aria-busy="true">
            <LoaderCircle className="size-6 animate-spin text-primary" />
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight">Собираем CV</h1>
            <p className="text-base text-muted-foreground">Берём данные из профиля и документов.</p>
          </div>
        }
        error={{ title: 'Не удалось собрать CV', text: 'Проверьте подключение и попробуйте ещё раз.' }}
        empty={{
          title: 'CV пока не из чего собрать',
          text: 'Добавьте документ моряка и опыт работы — CV соберётся само.',
          action: (
            <Button size="lg" className="w-auto" onClick={() => go('p14')}>
              Заполнить профиль
            </Button>
          ),
        }}
      >
        <div className="screen-in min-h-0 flex-1 overflow-y-auto pb-6">
          <div className="px-6 pt-2">
            <h1 className="text-[32px] leading-[1.1] font-semibold tracking-tight">Моё CV</h1>
            <p className="mt-3 text-base text-muted-foreground">Собрано из профиля, на английском — так его читают агентства. Измените профиль, и CV обновится само.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              PDF, <span className="font-mono">2</span> страницы, обновлено <span className="font-mono">{CV_UPDATED}</span>
            </p>
          </div>
          <CvPreview />
        </div>
      </ViewState>
      <Footer className="border-t border-border bg-surface pt-4">
        <Button size="lg" disabled={busy} onClick={download}>
          {busy ? <LoaderCircle className="animate-spin" /> : <Download />}
          {busy ? 'Сохраняем…' : 'Скачать PDF'}
        </Button>
        <Button size="lg" variant="outline" className="text-primary" onClick={() => setShare(true)}>
          <Share2 /> Поделиться
        </Button>
      </Footer>
      <BottomSheet open={share} onClose={() => setShare(false)} title="Поделиться CV" description={CV_FILE}>
        <ActionRow icon={Mail} title="Почта" onClick={() => shared('почта')} />
        <ActionRow icon={MessageCircle} title="WhatsApp" onClick={() => shared('WhatsApp')} />
        <ActionRow icon={Send} title="Telegram" onClick={() => shared('Telegram')} />
        <ActionRow icon={FolderDown} title="Сохранить в «Файлы»" onClick={() => shared('«Файлы»')} />
      </BottomSheet>
    </div>
  )
}

/* ---------- аркуш CV ---------- */

// Кольори паперу задані прямо: PDF однаковий у світлій і темній темі.
const INK = '#0F172A'
const SOFT = '#5B6B7F'
const RULE = '#D5DCE5'

function Sheet({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[1/1.414] w-full overflow-hidden rounded-[4px] border border-border bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]" style={{ color: INK }}>
      <div className="flex h-full flex-col px-[7%] pt-[7%] pb-[5%] text-[7.5px] leading-[1.45]">{children}</div>
      <span className="absolute right-[7%] bottom-[3%] font-mono text-[6.5px]" style={{ color: SOFT }}>
        {n} / 2
      </span>
    </div>
  )
}

function H({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-[5%] mb-[2%] border-b pb-[1%] text-[8px] font-semibold" style={{ borderColor: RULE }}>
      {children}
    </h3>
  )
}

function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[38%_1fr] gap-x-2">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt style={{ color: SOFT }}>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

const M = ({ children }: { children: ReactNode }) => <span className="font-mono">{children}</span>

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr style={{ color: SOFT }}>
          {head.map((h) => (
            <th key={h} className="py-[2px] pr-1 font-normal">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t align-top" style={{ borderColor: RULE }}>
            {r.map((c, j) => (
              <td key={j} className="py-[2px] pr-1">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function CvPreview() {
  const { bag } = useDP()
  const p = useProfile()
  const { docs } = useDocs()
  const avail = useAvailability().value
  const contracts = bag<Contract[]>('dp.contracts', CONTRACTS)
  const hideTotal = bag<boolean>('dp.hideTotal', false)
  const total = contracts.reduce((s, c) => s + cMonths(c), 0)
  const en = (ru: string) => EN_COUNTRY[ru] ?? ru
  const fv = (d: (typeof docs)[number], k: string) => d.fields.find((f) => f.k === k)?.value ?? ''

  const sid = docs.find((d) => d.group === 'sid')
  const passport = docs.find((d) => d.group === 'passport')
  const visas = docs.filter((d) => d.group === 'visa')
  const certs = docs.filter((d) => d.group === 'dip' || d.group === 'flag')
  const meds = docs.filter((d) => d.group === 'med')
  const sorted = [...contracts].sort((a, b) => cMonthsKey(b) - cMonthsKey(a))

  const status = avail.kind === 'from' ? `${AVAIL_EN.from} ${ruDate(avail.date ?? '2026-12-01')}` : AVAIL_EN[avail.kind]

  return (
    <div className="mt-6 flex flex-col gap-4 bg-muted px-6 py-6">
      <Sheet n={1}>
        <header className="flex items-end justify-between gap-3 border-b-2 pb-[3%]" style={{ borderColor: INK }}>
          <div>
            <h2 className="text-[17px] leading-none font-semibold tracking-tight">{`${p.value('first')} ${p.value('last')}`.trim()}</h2>
            <p className="mt-[3px] text-[9px]">{p.position || 'Seafarer'}</p>
          </div>
          <p className="text-right" style={{ color: SOFT }}>
            {p.value('email')}
            <br />
            <M>{p.value('phone')}</M>
          </p>
        </header>
        <p className="mt-[3%]">
          <span className="font-semibold">Status:</span> {status}
        </p>

        <H>Personal details</H>
        <KV
          rows={[
            ['Date of birth', <M>{p.value('birth')}</M>],
            ['Nationality', EN_CIT[p.value('cit')] ?? en(p.value('cit'))],
            ['Rank', p.position],
            ...(hideTotal ? [] : ([['Total sea service', durEn(total)]] as [string, ReactNode][])),
          ]}
        />

        <H>Travel documents</H>
        <Table
          head={['Document', 'Number', 'Issued', 'Valid until']}
          rows={[
            ...(sid ? [["Seafarer's ID", <M>{fv(sid, 'num')}</M>, <M>{fv(sid, 'issue')}</M>, <M>{sid.exp ?? 'Unlimited'}</M>]] : []),
            ...(passport ? [['Passport', <M>{fv(passport, 'num')}</M>, <M>{fv(passport, 'issue')}</M>, <M>{passport.exp}</M>]] : []),
            ...visas.map((v) => [
              <>
                Visa
                <br />
                <span style={{ color: SOFT }}>
                  {en(fv(v, 'country'))}, {fv(v, 'type')}
                </span>
              </>,
              <M>{fv(v, 'num')}</M>, <M>{fv(v, 'issue')}</M>, <M>{v.exp}</M>]),
          ]}
        />

        <H>Certificates</H>
        <Table
          head={['Certificate', 'STCW', 'Number', 'Valid until']}
          rows={certs.map((c) => [c.paper ?? c.title, <M>{fv(c, 'stcw')}</M>, <M>{fv(c, 'num')}</M>, <M>{c.exp ?? 'Unlimited'}</M>])}
        />

        {meds.length > 0 && (
          <>
            <H>Medical</H>
            <Table head={['Certificate', 'Valid until']} rows={meds.map((m) => [m.title, <M>{m.exp ?? 'Unlimited'}</M>])} />
          </>
        )}
      </Sheet>

      <Sheet n={2}>
        <H>Sea service</H>
        <Table
          head={['Vessel', 'Type, DWT', 'Rank', 'Period']}
          rows={sorted.map((c) => [
            <>
              {c.vessel}
              <br />
              <span style={{ color: SOFT }}>{c.flag}</span>
            </>,
            <>
              {c.type}
              <br />
              <M>{c.dwt}</M>
            </>,
            c.position,
            <>
              <M>
                {c.from}–{c.to}
              </M>
              <br />
              <span style={{ color: SOFT }}>{durEn(cMonths(c))}</span>
            </>,
          ])}
        />
      </Sheet>
    </div>
  )
}

const cMonthsKey = (c: Contract) => {
  const m = c.from.match(/^(\d{2})\.(\d{4})$/)
  return m ? +m[2] * 12 + +m[1] : 0
}
