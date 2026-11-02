import { defineGroups } from '../types'
import { RCandidate } from '../r1/r-candidate'
import { RCandidates } from '../r1/r-candidates'
import { RInvitations } from '../r1/r-invitations'
import { RLogin } from '../r1/r-login'
import { RNoOrg } from '../r1/r-no-org'
import { RRegister } from '../r1/r-register'
import { RSeafarer } from '../r1/r-seafarer'
import { RSearch } from '../r1/r-search'

// Веб рекрутера, частина 1: вхід, реєстрація, пошук моряків, профіль моряка, кандидати, запрошення.
export const groups = defineGroups('recruiter', [
  {
    title: 'Вход',
    screens: [
      { id: 'r-login', title: 'Вход', Component: RLogin, path: '/login' },
      { id: 'r-register', title: 'Регистрация компании', Component: RRegister, path: '/register' },
      { id: 'r-no-org', title: 'Нет организации', Component: RNoOrg, path: '/no-organization' },
    ],
  },
  {
    title: 'Моряки',
    screens: [
      { id: 'r-search', title: 'Поиск моряков', Component: RSearch, path: '/seafarers' },
      { id: 'r-seafarer', title: 'Профиль моряка', Component: RSeafarer, path: '/seafarers/andrii-k' },
      { id: 'r-candidates', title: 'Кандидаты', Component: RCandidates, path: '/candidates' },
      { id: 'r-candidate', title: 'Кандидат', Component: RCandidate, path: '/candidates/andrii-k' },
      { id: 'r-invitations', title: 'Приглашения', Component: RInvitations, path: '/invitations' },
    ],
  },
])
