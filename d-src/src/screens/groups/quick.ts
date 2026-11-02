import { defineGroups } from '../types'
import { E01NotRead } from '../e/e01'
import { E02NotSeafarer } from '../e/e02'
import { E03Offline } from '../e/e03'
import { E04RateLimit } from '../e/e04'
import { E05Banned } from '../e/e05'
import { E06DocTaken } from '../e/e06'
import { E07Manual } from '../e/e07'
import { E08Blocked } from '../e/e08'
import { E09Update } from '../e/e09'
import { Q02Consent } from '../q/q02'
import { Q03Upload } from '../q/q03'
import { Q04Reading } from '../q/q04'
import { Q05Check } from '../q/q05'
import { Q06Account } from '../q/q06'
import { Q07Code } from '../q/q07'
import { Q08Done } from '../q/q08'
import { Q09Profile } from '../q/q09'
import { Q10Consents } from '../q/q10'
import { Q11Resume } from '../q/q11'

// Швидка реєстрація і помилки (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Быстрая регистрация',
    screens: [
      { id: 'q02', title: '1. Согласие', Component: Q02Consent },
      { id: 'q03', title: '2. CV и документ моряка', Component: Q03Upload },
      { id: 'q04', title: 'Чтение документов (загрузка)', Component: Q04Reading },
      { id: 'q05', title: '3. Проверьте данные из документов', Component: Q05Check },
      { id: 'q06', title: '4. Аккаунт', Component: Q06Account },
      { id: 'q07', title: '5. Код из письма', Component: Q07Code },
      { id: 'q08', title: '6. Аккаунт создан', Component: Q08Done },
      { id: 'q09', title: '7. Профиль', Component: Q09Profile },
      { id: 'q10', title: 'Профиль · Согласия', Component: Q10Consents },
      { id: 'q11', title: 'Незаконченная регистрация', Component: Q11Resume },
      { id: 'e01', title: 'Ошибка: документ не прочитан', Component: E01NotRead },
      { id: 'e02', title: 'Ошибка: это не документ моряка', Component: E02NotSeafarer },
      { id: 'e07', title: 'Ввести данные вручную', Component: E07Manual },
      { id: 'e06', title: 'Ошибка: документ уже привязан к другому аккаунту', Component: E06DocTaken },
      { id: 'e03', title: 'Ошибка: нет интернета', Component: E03Offline },
      { id: 'e04', title: 'Ошибка: слишком много попыток', Component: E04RateLimit },
      { id: 'e05', title: 'Регистрация невозможна (бан)', Component: E05Banned },
      { id: 'e08', title: 'Аккаунт заблокирован', Component: E08Blocked },
      { id: 'e09', title: 'Обновите приложение', Component: E09Update },
    ],
  },
])
