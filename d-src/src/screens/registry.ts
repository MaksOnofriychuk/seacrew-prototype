import type { ComponentType } from 'react'
import { G01GuestFeed } from './g01-guest-feed'
import { G02GuestJobs, G03GuestGate } from './g02-guest-jobs'
import { G04GuestJob } from './g04-guest-job'
import { O01Slides } from './o01-slides'
import { O02Choice } from './o02-choice'
import { O03Quick } from './o03-quick'
import { O04StepIntro } from './o04-step-intro'
import { E01NotRead } from './e/e01'
import { E02NotSeafarer } from './e/e02'
import { E03Offline } from './e/e03'
import { E04RateLimit } from './e/e04'
import { E05Banned } from './e/e05'
import { E06DocTaken } from './e/e06'
import { E07Manual } from './e/e07'
import { S1Account } from './s/s1'
import { S1cCode } from './s/s1c'
import { S2Personal } from './s/s2'
import { S3SeafarerDoc } from './s/s3'
import { S4Diplomas } from './s/s4'
import { S5Medical } from './s/s5'
import { S6SeaService } from './s/s6'
import { SxCoreDone } from './s/sx'
import { S7Review } from './s/s7'
import { S8ExtraCerts } from './s/s8'
import { S9FlagDocs } from './s/s9'
import { S10Education } from './s/s10'
import { S11About } from './s/s11'
import { S12Extra } from './s/s12'
import { S13Notes } from './s/s13'
import { C08Resume } from './s/c08'
import { Q02Consent } from './q/q02'
import { Q03Upload } from './q/q03'
import { Q04Reading } from './q/q04'
import { Q05Check } from './q/q05'
import { Q06Account } from './q/q06'
import { Q07Code } from './q/q07'
import { Q08Done } from './q/q08'
import { Q09Profile } from './q/q09'
import { Q10Consents } from './q/q10'
import { Q11Resume } from './q/q11'

export type ScreenProps = { go: (id: string) => void }

export type ScreenDef = {
  id: string
  title: string
  Component: ComponentType<ScreenProps>
  /** екран займає й місце під рядком статусу */
  bleed?: boolean
}

// Ті самі групи, назви й порядок, що у вкладці C. Екрани додаються етапами.
export const GROUPS: { title: string; screens: ScreenDef[] }[] = [
  {
    title: 'Онбординг и гость',
    screens: [
      { id: 'o01', title: '1. Слайды', Component: O01Slides, bleed: true },
      { id: 'o02', title: '2. Выбор способа', Component: O02Choice, bleed: true },
      { id: 'o03', title: '3. Что понадобится (быстро)', Component: O03Quick },
      { id: 'o04', title: '4. Что понадобится (пошагово)', Component: O04StepIntro },
      { id: 'g01', title: 'Гость · Лента', Component: G01GuestFeed },
      { id: 'g02', title: 'Гость · Вакансии', Component: G02GuestJobs },
      { id: 'g04', title: 'Гость · Вакансия', Component: G04GuestJob },
      { id: 'g03', title: 'Гость · «Зарегистрируйтесь, чтобы…»', Component: G03GuestGate },
    ],
  },
  {
    title: 'Быстрая регистрация',
    screens: [
      { id: 'q02', title: '1. Согласие', Component: Q02Consent },
      { id: 'q03', title: '2. CV и документ моряка', Component: Q03Upload },
      { id: 'q04', title: '3. Читаем документы', Component: Q04Reading },
      { id: 'q05', title: '4. Проверьте данные из документов', Component: Q05Check },
      { id: 'q06', title: '5. Аккаунт', Component: Q06Account },
      { id: 'q07', title: '6. Код из письма', Component: Q07Code },
      { id: 'q08', title: '7. Аккаунт создан', Component: Q08Done },
      { id: 'q09', title: '8. Профиль', Component: Q09Profile },
      { id: 'q10', title: 'Профиль · Согласия', Component: Q10Consents },
      { id: 'q11', title: 'Незаконченная регистрация', Component: Q11Resume },
      { id: 'e01', title: 'Ошибка: документ не прочитан', Component: E01NotRead },
      { id: 'e02', title: 'Ошибка: это не документ моряка', Component: E02NotSeafarer },
      { id: 'e07', title: 'Ввести данные вручную', Component: E07Manual },
      { id: 'e06', title: 'Ошибка: документ уже зарегистрирован', Component: E06DocTaken },
      { id: 'e03', title: 'Ошибка: нет интернета', Component: E03Offline },
      { id: 'e04', title: 'Ошибка: слишком много попыток', Component: E04RateLimit },
      { id: 'e05', title: 'Регистрация невозможна (бан)', Component: E05Banned },
    ],
  },
  {
    title: 'Пошаговая регистрация',
    screens: [
      { id: 's1', title: 'Шаг 1 · Аккаунт', Component: S1Account },
      { id: 's1c', title: 'Шаг 1 · Код из письма', Component: S1cCode },
      { id: 's2', title: 'Шаг 2 · Личные данные', Component: S2Personal },
      { id: 's3', title: 'Шаг 3 · Документ моряка', Component: S3SeafarerDoc },
      { id: 's4', title: 'Шаг 4 · Дипломы и сертификаты', Component: S4Diplomas },
      { id: 's5', title: 'Шаг 5 · Медицинские', Component: S5Medical },
      { id: 's6', title: 'Шаг 6 · Морской стаж', Component: S6SeaService },
      { id: 'sx', title: 'Основное заполнено', Component: SxCoreDone },
      { id: 's8', title: 'Доп. · Сертификаты', Component: S8ExtraCerts },
      { id: 's9', title: 'Доп. · Флаговые документы', Component: S9FlagDocs },
      { id: 's10', title: 'Доп. · Образование', Component: S10Education },
      { id: 's11', title: 'Доп. · О себе', Component: S11About },
      { id: 's12', title: 'Доп. · Дополнительная информация', Component: S12Extra },
      { id: 's13', title: 'Доп. · Заметки', Component: S13Notes },
      { id: 's7', title: 'Проверка', Component: S7Review },
      { id: 'c08', title: 'Продолжить регистрацию', Component: C08Resume },
    ],
  },
]

export const SCREENS = GROUPS.flatMap((g) => g.screens)
