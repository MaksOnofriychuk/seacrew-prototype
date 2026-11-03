import { useState } from 'react'
import { Download, FileText, ImageIcon, Share2 } from 'lucide-react'
import { WebShareDialog } from '@/components/web/web-viewer'
import { useProto } from '@/lib/proto-state'
import { Fold } from './sf-parts'

// Файлы от моряка (правка №52, п. 5): группы по типу, каждая раскрывается; просмотр на весь экран,
// у каждого файла «Скачать» и «Поделиться».

export type SfFile = { key: string; name: string; size?: string; kind: 'photo' | 'file'; from: string }

const GROUPS: { id: string; title: string; match: (f: SfFile) => boolean }[] = [
  { id: 'photo', title: 'Фото', match: (f) => f.kind === 'photo' },
  { id: 'pdf', title: 'Документы PDF', match: (f) => f.kind === 'file' && /\.pdf$/i.test(f.name) },
  { id: 'other', title: 'Другие файлы', match: (f) => f.kind === 'file' && !/\.pdf$/i.test(f.name) },
]

export function FilesPanel({ files, open }: { files: SfFile[]; open: (name: string, kind: 'photo' | 'file', subtitle?: string) => void }) {
  const { showToast } = useProto()
  const [share, setShare] = useState<SfFile | null>(null)
  if (files.length === 0) return <p className="rounded-xl border border-border bg-surface px-5 py-4 text-sm text-muted-foreground">Моряк пока не прислал файлов. Копии приходят из анкет и из переписки.</p>
  return (
    <div className="flex flex-col gap-3">
      <p className="px-1 text-sm text-muted-foreground">
        Всего файлов: <span className="font-mono text-foreground">{files.length}</span>. Моряк присылает копии сам, в анкете или в переписке.
      </p>
      {GROUPS.map((g) => {
        const list = files.filter(g.match)
        if (!list.length) return null
        return (
          <Fold key={g.id} title={g.title} aside={<span className="font-mono">{list.length}</span>} flush>
            <ul>
              {list.map((f) => (
                <li key={f.key} className="flex items-center gap-1 border-t border-border first:border-t-0">
                  <button type="button" onClick={() => open(f.name, f.kind, f.from)} className="flex min-w-0 flex-1 items-center gap-3 px-5 py-2.5 text-left hover:bg-muted">
                    {f.kind === 'photo' ? <ImageIcon className="size-4.5 shrink-0 text-primary" /> : <FileText className="size-4.5 shrink-0 text-primary" />}
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-[15px]">{f.name}</span>
                      <span className="truncate text-[13px] text-muted-foreground">{f.from}</span>
                    </span>
                    {f.size && <span className="shrink-0 font-mono text-sm text-muted-foreground">{f.size}</span>}
                  </button>
                  <button type="button" onClick={() => setShare(f)} className="flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-primary hover:bg-muted">
                    <Share2 className="size-4" /> Поделиться
                  </button>
                  <button type="button" onClick={() => showToast(`Файл скачан: ${f.name}`)} className="mr-3 flex h-9 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-primary hover:bg-muted">
                    <Download className="size-4" /> Скачать
                  </button>
                </li>
              ))}
            </ul>
          </Fold>
        )
      })}
      <WebShareDialog open={!!share} onClose={() => setShare(null)} title={share?.kind === 'photo' ? 'Поделиться фото' : 'Поделиться файлом'} description={share?.name} />
    </div>
  )
}
