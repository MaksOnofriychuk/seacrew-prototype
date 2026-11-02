import { AEngines } from '../a/a-engines'
import { AFields } from '../a/a-fields'
import { AJobs } from '../a/a-jobs'
import { ALab, ALabEffect, ALabRun } from '../a/a-lab'
import { AOrg } from '../a/a-org'
import { AOrgs } from '../a/a-orgs'
import { APosts } from '../a/a-posts'
import { ARefs } from '../a/a-refs'
import { ARegistrations } from '../a/a-registrations'
import { AUsage } from '../a/a-usage'
import { AUserScreen } from '../a/a-user'
import { AUsers } from '../a/a-users'
import { defineGroups } from '../types'

// Адмінка (етап 9). id пунктів навігації — як у ADMIN_NAV (a-orgs … a-lab).
export const groups = defineGroups('admin', [
  {
    title: 'Модерация',
    screens: [
      { id: 'a-orgs', title: 'Организации', Component: AOrgs, path: '/admin/organizations' },
      { id: 'a-org', title: 'Организация: проверка', Component: AOrg, path: '/admin/organizations/meridian-crew' },
      { id: 'a-users', title: 'Пользователи', Component: AUsers, path: '/admin/users' },
      { id: 'a-user', title: 'Пользователь: блокировка и бан', Component: AUserScreen, path: '/admin/users/u02' },
      { id: 'a-registrations', title: 'Незавершённые регистрации и связанные аккаунты', Component: ARegistrations, path: '/admin/registrations' },
      { id: 'a-jobs', title: 'Вакансии', Component: AJobs, path: '/admin/jobs' },
      { id: 'a-posts', title: 'Публикации', Component: APosts, path: '/admin/posts' },
    ],
  },
  {
    title: 'Данные',
    screens: [
      { id: 'a-refs', title: 'Справочники', Component: ARefs, path: '/admin/references' },
      { id: 'a-fields', title: 'Каталог полей', Component: AFields, path: '/admin/fields' },
    ],
  },
  {
    title: 'ИИ',
    screens: [
      { id: 'a-engines', title: 'Движки распознавания', Component: AEngines, path: '/admin/engines' },
      { id: 'a-usage', title: 'Расходы ИИ', Component: AUsage, path: '/admin/usage' },
      { id: 'a-lab', title: 'Лаборатория', Component: ALab, path: '/admin/lab' },
      { id: 'a-lab-run', title: 'Лаборатория: прогон', Component: ALabRun, path: '/admin/lab/ex-7f3a' },
      { id: 'a-lab-effect', title: 'Лаборатория: эффективность', Component: ALabEffect, path: '/admin/lab/effectiveness' },
    ],
  },
])
