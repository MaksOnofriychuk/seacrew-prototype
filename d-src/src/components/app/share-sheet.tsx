import { Link2, Mail, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { SourceSheet } from '@/components/app/source-sheet'
import { useProto } from '@/lib/proto-state'

// «Поделиться» (перевірка прототипу 03.11, №27): вікно знизу — копіювати посилання, месенджери, пошта,
// системне меню. Посилання поки умовні; справжні адреси налаштуємо разом з публічними сторінками.
export function ShareSheet({ open, onClose, title = 'Поделиться', description }: { open: boolean; onClose: () => void; title?: string; description?: string }) {
  const { showToast } = useProto()
  const done = (text: string) => {
    onClose()
    showToast(text)
  }
  return (
    <SourceSheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      items={[
        { icon: Link2, title: 'Скопировать ссылку', sub: 'Вставьте в любой чат', onClick: () => done('Ссылка скопирована (пример)') },
        { icon: Send, title: 'Telegram', onClick: () => done('Откроется Telegram (пример)') },
        { icon: MessageCircle, title: 'WhatsApp', onClick: () => done('Откроется WhatsApp (пример)') },
        { icon: Mail, title: 'Почта', onClick: () => done('Откроется письмо со ссылкой (пример)') },
        { icon: MoreHorizontal, title: 'Другое', sub: 'Системное меню телефона', onClick: () => done('Откроется меню «Поделиться» телефона (пример)') },
      ]}
    />
  )
}
