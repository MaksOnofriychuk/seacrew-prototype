import { defineGroups } from '../types'
import { P01Feed } from '../p/p01'
import { P05Jobs } from '../p/p05'
import { P06NewPost } from '../p/p06'
import { P07Post } from '../p/p07'
import { P08Job } from '../p/p08'
import { P09Saved } from '../p/p09'
import { P12Apply } from '../p/p12'
import { P13Filters } from '../p/p13'
import { P16Author } from '../p/p16'
import { P17Searches } from '../p/p17'

// Стрічка і вакансії (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Лента и вакансии',
    screens: [
      { id: 'p01', title: 'Лента', Component: P01Feed },
      { id: 'p07', title: 'Лента · Публикация', Component: P07Post },
      { id: 'p06', title: 'Лента · Новая публикация', Component: P06NewPost },
      { id: 'p16', title: 'Лента · Профиль моряка (короткий)', Component: P16Author },
      { id: 'p05', title: 'Вакансии', Component: P05Jobs },
      { id: 'p13', title: 'Вакансии · Фильтры', Component: P13Filters },
      { id: 'p17', title: 'Вакансии · Сохранённые подборки', Component: P17Searches },
      { id: 'p08', title: 'Вакансия', Component: P08Job },
      { id: 'p12', title: 'Вакансия · Отклик', Component: P12Apply },
      { id: 'p09', title: 'Профиль · Сохранённое', Component: P09Saved },
    ],
  },
])
