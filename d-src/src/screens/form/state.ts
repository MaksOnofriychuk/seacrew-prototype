import { useProto } from '@/lib/proto-state'
import { plural } from '../s/_stepper'
import { PROFILE_CONTRACTS, rowMissing, type ContractRow, type Question, type Section } from './data'

// Стан анкети в bag (живе, поки відкрита вкладка прототипу):
// form.step — розділ (0…N-1), N — «Проверка», null — початок; form.done — пройдені / пропущені розділи;
// form.answers — відповіді з джерелом; form.rows — рядки таблиці; form.proof — прикріплені підтвердження;
// form.save — що моряк дозволив зберегти в профіль; form.sent / form.sentAt — надіслано (читає й чат).

/**
 * Відповідь: src — індекс джерела в question.sources, 'sugg' — прийнята збережена відповідь
 * («Использовать», далі вона «из профиля»), 'manual' — введено вручну; base — з якого джерела змінено.
 */
export type Answer = { v: string; src: number | 'sugg' | 'manual'; base?: number }
export type Proof = { name: string; size: string }
export type Rows = { list: ContractRow[]; edited: boolean } | null
export type SectionMark = 'done' | 'skip'

// Складені відповіді: документ — «номер, до ДД.ММ.ГГГГ», близька людина — «ім'я, родство, +380 …».
// Окремі частини вибираються й вводяться окремо (дата — лише вибір, телефон — лише вибір коду й номер).
export function splitComposite(kind: Question['kind'], v: string): { a: string; b: string } {
  const sep = kind === 'nok' ? ', +' : ', до '
  const i = v.lastIndexOf(sep)
  if (i < 0) return { a: v, b: '' }
  return { a: v.slice(0, i), b: v.slice(i + (kind === 'nok' ? 2 : sep.length)) }
}
export function joinComposite(kind: Question['kind'], a: string, b: string) {
  if (!b) return a
  return kind === 'nok' ? `${a}, ${b}` : `${a}, до ${b}`
}

export const uniqValues = (q: Question) => [...new Set(q.sources.map((s) => s.value))]
export const needsChoice = (q: Question, a?: Answer) => !a && uniqValues(q).length > 1

/** Підтвердження документом виконано: значення з підтвердженого документа без змін або прикріплено файл. */
export function proofOk(q: Question, a: Answer | undefined, proof: Record<string, Proof>) {
  if (!q.proof) return true
  if (proof[q.id]) return true
  if (!a || typeof a.src !== 'number') return false
  const s = q.sources[a.src]
  return s?.kind === 'doc' && !s.unproved
}

export function useFormState(sections: Section[]) {
  const { bag, setBag, showToast } = useProto()
  const all = sections.flatMap((s) => s.questions)
  const answers = bag<Record<string, Answer>>('form.answers', {})
  const rows = bag<Rows>('form.rows', null)
  const proof = bag<Record<string, Proof>>('form.proof', {})
  const done = bag<Record<string, SectionMark>>('form.done', {})
  const save = bag<string[]>('form.save', [])
  const step = bag<number | null>('form.step', null)
  const sent = bag<boolean>('form.sent', false)
  const sentAt = bag<string>('form.sentAt', '')
  const filled = bag<boolean>('form.filled', false)

  const setAnswer = (id: string, a: Answer | null) => {
    const next = { ...answers }
    if (a) next[id] = a
    else delete next[id]
    setBag('form.answers', next)
  }

  // Ручне введення: якщо значення було з джерела — стає «изменено» (base лишається), інакше «вручную».
  const type = (q: Question, v: string) => {
    const a = answers[q.id]
    const same = q.sources.findIndex((s) => s.value === v)
    if (same >= 0 && v) return setAnswer(q.id, { v, src: same })
    const base = a ? (typeof a.src === 'number' ? a.src : a.base) : undefined
    setAnswer(q.id, v || base !== undefined ? { v, src: 'manual', base } : null)
  }

  /** «Заполнить из профиля» — будь-коли (крок 2.3a): ручні правки лишаються, різні значення — на вибір. */
  const autofill = () => {
    const next = { ...answers }
    let n = 0
    let kept = 0
    let choose = 0
    for (const q of all) {
      if (q.kind === 'table' || !q.sources.length) continue
      const a = next[q.id]
      if (a && (a.src === 'manual' || a.src === 'sugg') && a.v.trim()) {
        kept++
        continue
      }
      if (uniqValues(q).length > 1) {
        if (!a) choose++
        continue
      }
      if (a?.src === 0) continue
      next[q.id] = { v: q.sources[0].value, src: 0 }
      n++
    }
    setBag('form.answers', next)
    const table = all.find((q) => q.kind === 'table')
    if (table?.sources.length) {
      if (rows?.edited) kept++
      else if (!rows) {
        setBag('form.rows', { list: PROFILE_CONTRACTS, edited: false })
        n++
      }
    }
    setBag('form.filled', true)
    const parts: string[] = []
    if (n) parts.push(`${n} ${plural(n, 'поле заполнено', 'поля заполнено', 'полей заполнено')} из профиля.`)
    if (kept) parts.push(kept === 1 ? 'Ваш ответ в 1 поле сохранён.' : `Ваши ответы в ${kept} полях сохранены.`)
    if (choose) parts.push(`Выберите значение в ${choose} ${plural(choose, 'поле', 'полях', 'полях')}.`)
    showToast(parts.length ? parts.join(' ') : 'В профиле нет нового для этой формы.')
    return { n, kept, choose }
  }

  const has = (q: Question) => {
    if (q.kind === 'table') return !!rows?.list.length
    if (q.kind === 'signature') return !!(answers[q.id]?.v.trim() && answers[q.id + '.ok'])
    return !!answers[q.id]?.v.trim()
  }

  /** Помилка питання; incomplete — рахувати неповні рядки таблиці (лише при надсиланні). */
  const issue = (q: Question, incomplete = false): string | null => {
    const a = answers[q.id]
    if (needsChoice(q, a)) return 'Выберите значение'
    if (q.kind === 'signature' && answers[q.id]?.v.trim() && !answers[q.id + '.ok']) return 'Подтвердите подпись'
    // В анкеті рекрутера обов'язкові всі поля: з даних або вручну (перевірка 03.11, №47).
    if (!has(q)) return q.kind === 'table' ? 'Добавьте хотя бы одну запись' : q.kind === 'consent' ? 'Без согласия анкету не отправить' : 'Обязательное поле'
    if ((q.kind === 'doc' || q.kind === 'nok') && has(q) && !splitComposite(q.kind, answers[q.id]!.v).a.trim()) return q.kind === 'doc' ? 'Укажите данные документа' : 'Укажите имя'
    if (q.kind === 'doc' && has(q) && !splitComposite('doc', answers[q.id]!.v).b) return 'Укажите, до какого числа действует'
    if (q.kind === 'nok' && has(q) && !splitComposite('nok', answers[q.id]!.v).b) return 'Укажите телефон'
    if (q.proof && has(q) && !proofOk(q, a, proof)) return 'Прикрепите фото или файл, который это подтверждает'
    if (incomplete && q.kind === 'table' && rows?.list.some((r) => rowMissing(r).length)) return 'Дополните неполную запись'
    return null
  }

  /** Знімок відповіді на час розгортання рядка: «Отмена» повертає його (рядок, підпис, підтвердження, таблиця). */
  const snapshot = (q: Question) => ({ a: answers[q.id], ok: answers[q.id + '.ok'], proof: proof[q.id], rows })
  const restore = (q: Question, snap: ReturnType<typeof snapshot>) => {
    const next = { ...answers }
    for (const [k, v] of [[q.id, snap.a], [q.id + '.ok', snap.ok]] as const) {
      if (v) next[k] = v
      else delete next[k]
    }
    setBag('form.answers', next)
    const pr = { ...proof }
    if (snap.proof) pr[q.id] = snap.proof
    else delete pr[q.id]
    setBag('form.proof', pr)
    if (q.kind === 'table') setBag('form.rows', snap.rows)
  }

  const sectionIssues = (s: Section, incomplete = false) => s.questions.filter((q) => issue(q, incomplete))
  const incompleteRows = rows?.list.filter((r) => rowMissing(r).length) ?? []

  // Нове чи змінене — кандидат у профіль (ADR-051: лише за згодою, документи не пишуться).
  const saveCandidates = all.filter((q) => {
    if (!q.savable) return false
    if (q.kind === 'table') return !!rows?.edited
    const a = answers[q.id]
    return !!a && a.src === 'manual' && !!a.v.trim()
  })

  const total = all.length
  const answered = all.filter(has).length
  const pct = Math.round((answered / total) * 100)

  return {
    all,
    answers,
    rows,
    proof,
    done,
    save,
    step,
    sent,
    sentAt,
    filled,
    pct,
    setAnswer,
    type,
    autofill,
    issue,
    snapshot,
    restore,
    sectionIssues,
    incompleteRows,
    saveCandidates,
    setStep: (n: number | null) => setBag('form.step', n),
    setRows: (list: ContractRow[]) => setBag('form.rows', { list, edited: true }),
    setProof: (id: string, p: Proof | null) => {
      const next = { ...proof }
      if (p) next[id] = p
      else delete next[id]
      setBag('form.proof', next)
    },
    mark: (id: string, m: SectionMark | null) => {
      const next = { ...done }
      if (m) next[id] = m
      else delete next[id]
      setBag('form.done', next)
    },
    setSave: (ids: string[]) => setBag('form.save', ids),
    send: () => {
      setBag('form.sent', true)
      setBag('form.sentAt', new Date().toTimeString().slice(0, 5))
    },
  }
}

export type FormState = ReturnType<typeof useFormState>

/** Поле на екрані: прокрутити до нього й коротко підсвітити (як «Показать» у реєстрації). */
export function flash(id: string) {
  window.setTimeout(() => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const hl = ['outline-2', 'outline-offset-4', 'outline-warning', 'rounded-md']
    el.classList.add(...hl)
    window.setTimeout(() => el.classList.remove(...hl), 1600)
  }, 260)
}
