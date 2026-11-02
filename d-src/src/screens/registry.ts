import { groups as admin } from './groups/admin'
import { groups as docsProfile } from './groups/docs-profile'
import { groups as feedJobs } from './groups/feed-jobs'
import { groups as messagesSettings } from './groups/messages-settings'
import { groups as onboarding } from './groups/onboarding'
import { groups as quick } from './groups/quick'
import { groups as recruiter1 } from './groups/recruiter-1'
import { groups as recruiter2 } from './groups/recruiter-2'
import { groups as stepper } from './groups/stepper'
import type { Platform, ScreenGroup } from './types'

export type { Platform, ScreenDef, ScreenGroup, ScreenProps } from './types'
export { PLATFORMS } from './types'

// Реєстр лише збирає групи з файлів groups/*. Порядок файлів = порядок у панелі.
// Свої екрани кожен додає у свій файл групи, сюди нічого не дописуємо.
export const GROUPS: ScreenGroup[] = [
  ...onboarding,
  ...quick,
  ...stepper,
  ...feedJobs,
  ...docsProfile,
  ...messagesSettings,
  ...recruiter1,
  ...recruiter2,
  ...admin,
].filter((g) => g.screens.length > 0)

export const SCREENS = GROUPS.flatMap((g) => g.screens)

export const groupsFor = (platform: Platform) => GROUPS.filter((g) => g.platform === platform)
export const screensFor = (platform: Platform) => groupsFor(platform).flatMap((g) => g.screens)
