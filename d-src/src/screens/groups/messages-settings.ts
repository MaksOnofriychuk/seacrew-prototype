import { defineGroups } from '../types'
import { P03Inbox } from '../p/p03'
import { P04Drawer } from '../p/p04'
import { P10Notifications } from '../p/p10'

// Повідомлення, сповіщення, бокове меню, налаштування (мобілка).
export const groups = defineGroups('mobile', [
  {
    title: 'Сообщения, уведомления, меню',
    screens: [
      { id: 'p10', title: 'Уведомления', Component: P10Notifications },
      { id: 'p03', title: 'Входящие', Component: P03Inbox },
      { id: 'p04', title: 'Боковое меню', Component: P04Drawer },
    ],
  },
])
