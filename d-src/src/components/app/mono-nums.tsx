// Числа й дати всередині тексту — IBM Plex Mono, слова — звичайним шрифтом (Inter).
// «3 г. 2 мес.», «Готов к контракту с 01.12.2026» → моноширинні лише цифри.
export function MonoNums({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\d[\d.,/]*)/).map((part, i) =>
        i % 2 ? (
          <span key={i} className="font-mono">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  )
}
