import { createContext, useContext } from 'react'

// Вікна знизу відкриваються всередині телефона, а не на всю сторінку прототипу.
export const PhonePortalContext = createContext<HTMLElement | null>(null)

export const usePhonePortal = () => useContext(PhonePortalContext)
