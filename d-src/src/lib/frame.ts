import { createContext, useContext } from 'react'

// У якій рамці зараз екран: телефон чи вікно браузера. Спільні компоненти (стани, тости) підлаштовують розміри.
export type FrameKind = 'mobile' | 'web'

export const FrameKindContext = createContext<FrameKind>('mobile')

export const useFrameKind = () => useContext(FrameKindContext)
