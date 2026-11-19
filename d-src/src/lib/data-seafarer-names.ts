// Полные фамилии моряков — вымышленные. Рекрутер видит их только после метча (отклик в статусе «Метч»);
// до этого в данных остаётся сокращение «Имя К.».
import type { ApplicationStatus, WebSeafarer } from './data-web'

const FULL: Record<string, string> = {
  sf01: 'Andrii Kovalenko', sf02: 'Giorgi Beridze', sf03: 'Mark Anthony Reyes', sf04: 'Rahul Sharma', sf05: 'Janis Ozols', sf06: 'Piotr Wisniewski',
  sf07: 'Mihai Dumitru', sf08: 'Elvin Hasanov', sf09: 'Nikola Tomic', sf10: 'Dmytro Savchenko', sf11: 'Ivan Petkov', sf12: 'Oleksandr Melnyk',
  sf13: 'Taras Lysenko', sf14: 'Ricardo Navarro', sf15: 'Sergei Vashadze', sf16: 'Aleksei Fedorov', sf17: 'Hamza Khalil', sf18: 'Stefan Marin',
  sf19: 'Arjun Patel', sf20: 'Luka Jurić', sf21: 'Pavlo Romanenko', sf22: 'Emre Demir', sf23: 'Kristaps Zvirbulis', sf24: 'Vasil Georgiev',
  sf25: 'Joao Tolentino', sf26: 'Maksym Havryliuk', sf27: 'Dario Cvitanović', sf28: 'Anton Bielski',
}

/** Имя моряка для рекрутера: после метча — полное, иначе сокращённое. */
export const seafarerShownName = (s: Pick<WebSeafarer, 'id' | 'name'>, status: ApplicationStatus) => (status === 'match' ? (FULL[s.id] ?? s.name) : s.name)
