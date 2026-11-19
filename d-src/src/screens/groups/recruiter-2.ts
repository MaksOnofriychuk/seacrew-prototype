import { defineGroups } from '../types'
import { RApplications } from '../r2/r-applications'
import { RAssignment } from '../r2/r-assignment'
import { RFormEdit } from '../r2/r-form-edit'
import { RFormImport } from '../r2/r-form-import'
import { RForms } from '../r2/r-forms'
import { RJob } from '../r2/r-job'
import { RJobEdit } from '../r2/r-job-edit'
import { RJobs } from '../r2/r-jobs'
import { RChat, RMessages } from '../r2/r-messages'
import { ROrg } from '../r2/r-org'
import { RSettings } from '../r2/r-settings'

// Веб рекрутера, частина 2: вакансії, відгуки, повідомлення, форми, відповіді моряків, організація, налаштування.
// Екрани — у screens/r2, дані — у lib/data-recruiter-2.ts. id списків збігаються з пунктами навігації (RECRUITER_NAV).
export const groups = defineGroups('recruiter', [
  {
    title: 'Вакансии и отклики',
    screens: [
      { id: 'r-jobs', title: 'Вакансии', Component: RJobs, path: '/jobs' },
      { id: 'r-job', title: 'Вакансия', Component: RJob, path: '/jobs/j01' },
      { id: 'r-job-edit', title: 'Новая вакансия / редактирование', Component: RJobEdit, path: '/jobs/new' },
      { id: 'r-applications', title: 'Отклики', Component: RApplications, path: '/applications' },
    ],
  },
  {
    title: 'Сообщения',
    screens: [
      { id: 'r-messages', title: 'Сообщения', Component: RMessages, path: '/messages' },
      { id: 'r-chat', title: 'Диалог', Component: RChat, path: '/messages/ap01' },
    ],
  },
  {
    title: 'Анкеты',
    screens: [
      { id: 'r-forms', title: 'Анкеты', Component: RForms, path: '/forms' },
      { id: 'r-form-edit', title: 'Конструктор анкеты', Component: RFormEdit, path: '/forms/f01' },
      { id: 'r-form-import', title: 'Импорт анкеты', Component: RFormImport, path: '/forms/import' },
      { id: 'r-assignment', title: 'Ответ моряка', Component: RAssignment, path: '/assignments/as01' },
    ],
  },
  {
    title: 'Компания',
    screens: [
      { id: 'r-org', title: 'Организация', Component: ROrg, path: '/organization' },
      { id: 'r-settings', title: 'Настройки', Component: RSettings, path: '/settings' },
    ],
  },
])
