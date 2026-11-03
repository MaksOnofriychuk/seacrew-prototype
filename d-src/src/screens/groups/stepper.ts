import { defineGroups } from '../types'
import { C08Resume } from '../s/c08'
import { S1Account } from '../q/account'
import { S10Education } from '../s/s10'
import { S11About } from '../s/s11'
import { S12Extra } from '../s/s12'
import { S13Notes } from '../s/s13'
import { S14References } from '../s/s14'
import { S1cCode } from '../q/code'
import { S2Personal } from '../s/s2'
import { S3SeafarerDoc } from '../s/s3'
import { S3pPassport } from '../s/s3p'
import { S4Diplomas } from '../s/s4'
import { S5Medical } from '../s/s5'
import { S6SeaService } from '../s/s6'
import { S7Review } from '../s/s7'
import { S8ExtraCerts } from '../s/s8'
import { S9FlagDocs } from '../s/s9'
import { SxCoreDone } from '../s/sx'

// Покрокова реєстрація (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Пошаговая регистрация',
    screens: [
      { id: 's1', title: 'Шаг 1 · Аккаунт', Component: S1Account },
      { id: 's1c', title: 'Шаг 1 · Код из письма', Component: S1cCode },
      { id: 's2', title: 'Шаг 2 · Личные данные', Component: S2Personal },
      { id: 's3', title: 'Шаг 3 · Документ моряка', Component: S3SeafarerDoc },
      { id: 's3p', title: 'Шаг 4 · Загранпаспорт и визы', Component: S3pPassport },
      { id: 's4', title: 'Шаг 5 · Дипломы и сертификаты', Component: S4Diplomas },
      { id: 's5', title: 'Шаг 6 · Медицинские', Component: S5Medical },
      { id: 's6', title: 'Шаг 7 · Опыт работы', Component: S6SeaService },
      { id: 'sx', title: 'Вы почти у цели', Component: SxCoreDone },
      { id: 's8', title: 'Доп. · Сертификаты', Component: S8ExtraCerts },
      { id: 's9', title: 'Доп. · Подфлажные документы', Component: S9FlagDocs },
      { id: 's10', title: 'Доп. · Образование', Component: S10Education },
      { id: 's11', title: 'Доп. · О себе', Component: S11About },
      { id: 's12', title: 'Доп. · Дополнительная информация', Component: S12Extra },
      { id: 's13', title: 'Доп. · Заметки', Component: S13Notes },
      { id: 's14', title: 'Доп. · Характеристики, промоушены', Component: S14References },
      { id: 's7', title: 'Проверка', Component: S7Review },
      { id: 'c08', title: 'Продолжить регистрацию', Component: C08Resume },
    ],
  },
])
