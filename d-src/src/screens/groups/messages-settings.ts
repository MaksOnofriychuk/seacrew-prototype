import { defineGroups } from '../types'
import { P04Drawer } from '../p/p04'
import { MChat, MChatApplied } from '../m/chat'
import { MDelete } from '../m/delete'
import { MForm, MFormReview, MFormSent } from '../m/form'
import { MNotifSettings } from '../m/notif-settings'
import { P10Notifications } from '../m/notifications'
import { P15Messages } from '../m/p15-messages'
import { MSettings } from '../m/settings'
import { MSupport } from '../m/support'

// Повідомлення, сповіщення, бокове меню, налаштування (мобілка, етап 6).
// p03 «Входящие» прибрано: його замінили вкладка «Сообщения» (p15) і дзвіночок «Уведомления» (p10) — правки №16, №22.
export const groups = defineGroups('mobile', [
  {
    title: 'Сообщения и уведомления',
    screens: [
      { id: 'p15', title: 'Сообщения', Component: P15Messages },
      { id: 'm-chat', title: 'Чат с рекрутером', Component: MChat },
      { id: 'm-chat-applied', title: 'Чат · после отклика', Component: MChatApplied },
      { id: 'm-form', title: 'Анкета от рекрутера', Component: MForm },
      { id: 'm-form-review', title: 'Анкета · проверка', Component: MFormReview },
      { id: 'm-form-sent', title: 'Анкета · отправлена', Component: MFormSent },
      { id: 'p10', title: 'Уведомления', Component: P10Notifications },
    ],
  },
  {
    title: 'Меню и настройки',
    screens: [
      { id: 'p04', title: 'Боковое меню', Component: P04Drawer },
      { id: 'm-settings', title: 'Настройки', Component: MSettings },
      { id: 'm-notif-settings', title: 'Уведомления · настройки', Component: MNotifSettings },
      { id: 'm-delete', title: 'Удаление аккаунта', Component: MDelete },
      { id: 'm-support', title: 'Поддержка', Component: MSupport },
    ],
  },
])
