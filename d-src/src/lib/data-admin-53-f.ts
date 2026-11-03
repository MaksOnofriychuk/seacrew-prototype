// Правка №53, агент F: додаткові вигадані рядки для модерації (щоб були 2–3 сторінки в списках).
// Дописуємо в кінець спільних масивів (повторно не додаємо), тому лічильники меню, «Организации»
// і екрани рахують з одних і тих самих даних. Реальних людей і компаній немає.
import { A_JOBS, A_POSTS, type AJob, type APost } from './data-admin'
import { MAILINGS, REPORTS, TEXTS, VERIFY_REQS, type Mailing, type Report, type TextItem, type VerifyDoc, type VerifyReq } from './data-admin-2'

function addOnce<T extends { id: string }>(target: T[], extra: T[]) {
  for (const x of extra) if (!target.some((t) => t.id === x.id)) target.push(x)
}

/* ---------- публикации ---------- */

type P = [string, string, string, string, number, string, number, string[], APost['state']]
const P_ROWS: P[] = [
  ['Daniel F.', 'DF', 'AB · Bulk Carrier', 'Ищу контракт на балкер, 4 года в море. Могу выйти через две недели, документы в порядке.', 0, '2026-10-29 21:10', 0, [], 'published'],
  ['Kofi A.', 'KA', 'Oiler · Tanker', 'Предлагаю оформить визу и контракт за 200 $, пишите в личные сообщения, гарантия места.', 0, '2026-10-29 18:44', 4, ['Оплата за трудоустройство', 'Спам'], 'complaint'],
  ['Анна Мельник', 'АМ', '3rd Officer · Container Ship', 'Подскажите, где в Гдыне быстро продлить медицинскую книжку? Нужно успеть до посадки.', 0, '2026-10-29 15:02', 0, [], 'published'],
  ['Sergio R.', 'SR', 'Cook · Cruise Ship', 'Вышел с круиза, всё отлично. Совет: берите с собой больше копий дипломов, на борту просят постоянно.', 1, '2026-10-29 11:30', 0, [], 'published'],
  ['Viktor B.', 'VB', 'Electrician · Offshore', 'Компания в Баку задерживает зарплату уже два месяца. Все, кто там работает, будьте осторожны!', 0, '2026-10-28 20:15', 3, ['Обвинения без доказательств'], 'complaint'],
  ['Lucas P.', 'LP', 'Fitter · Merchant', 'Продам рабочую одежду и ботинки 44 размера, почти новые, самовывоз из порта.', 2, '2026-10-28 17:48', 1, ['Не по теме'], 'complaint'],
  ['Игорь Савчук', 'ИС', 'Chief Engineer · Chemical Tanker', 'Коллеги, кто работал с судами этой серии? Интересует ротация и состояние машинного отделения.', 0, '2026-10-28 14:21', 0, [], 'published'],
  ['Hassan M.', 'HM', 'AB · Container Ship', 'Бесплатно раздаю чужие паспортные данные с проверкой, пишите — отправлю список.', 0, '2026-10-28 09:55', 6, ['Чужие личные данные', 'Спам'], 'hidden'],
  ['Natalia V.', 'NV', 'Purser · Cruise Ship', 'Открылся набор на круизные лайнеры в Средиземном море. Условия обсуждаем в чате компании.', 0, '2026-10-27 22:03', 0, [], 'published'],
  ['Pedro G.', 'PG', 'Bosun · Offshore', 'Сегодня на борту прошёл учебный выход шлюпки. Всё чётко, спасибо экипажу.', 3, '2026-10-27 16:40', 0, [], 'published'],
  ['Oleksandr D.', 'OD', '2nd Engineer · LPG Carrier', 'Закончил курс по газовозам, делюсь конспектом. Ссылка на файл в комментарии.', 0, '2026-10-27 13:12', 1, ['Спам'], 'complaint'],
  ['Rahul S.', 'RS', 'Oiler · Bulk Carrier', 'Агентство обещало место и взяло задаток 150 $. Теперь не отвечает.', 1, '2026-10-27 08:25', 2, ['Обвинения без доказательств', 'Оплата за трудоустройство'], 'complaint'],
  ['Мария Лисовская', 'МЛ', 'Doctor · Cruise Ship', 'Напоминаю: сертификат STCW нужно продлевать заранее. Записывайтесь на курсы за два месяца.', 0, '2026-10-26 19:30', 0, [], 'published'],
  ['Emre K.', 'EK', 'Deck Cadet · Tanker', 'Первый рейс на танкере. Страшно, но интересно. Какие советы дадите новичку?', 0, '2026-10-26 12:18', 0, [], 'published'],
  ['Tuan N.', 'TN', 'Welder · Offshore', 'Все вакансии на платформах — обман, нигде не берут нормально. Не тратьте время!', 0, '2026-10-26 07:50', 2, ['Оскорбления', 'Не по теме'], 'hidden'],
  ['Stefan W.', 'SW', 'Chief Officer · Ro-Ro', 'Сменили график вахт на судне: теперь 4 недели на 4 недели. Кто так работал, как вам?', 0, '2026-10-25 20:05', 0, [], 'published'],
  ['Joao M.', 'JM', 'Cook · Fishing', 'Нужны ребята на тунцелов, плата в конверте, без документов. Пишите быстро.', 0, '2026-10-25 15:36', 5, ['Поддельные документы', 'Оплата за трудоустройство'], 'complaint'],
  ['Катерина Лозовая', 'КЛ', '3rd Engineer · Bulk Carrier', 'Нашла работу через Seafolio за неделю! Спасибо, что здесь нет лишних посредников.', 0, '2026-10-25 11:11', 0, [], 'published'],
  ['Dmytro H.', 'DH', 'AB · Tanker', 'Как оформить рабочую визу в ОАЭ? Кто проходил в этом году, поделитесь опытом.', 0, '2026-10-24 18:20', 0, [], 'published'],
  ['Ali T.', 'AT', 'OS · Container Ship', 'Покупаю документы моряка, дорого. Звоните.', 0, '2026-10-24 10:02', 8, ['Поддельные документы', 'Спам'], 'hidden'],
  ['Olga R.', 'OR', 'Stewardess · Yacht', 'Яхта в Монако ищет стюардессу на сезон. Нужен английский и опыт от года.', 1, '2026-10-23 21:45', 1, ['Не по теме'], 'complaint'],
  ['Mateusz Z.', 'MZ', 'Master · Offshore', 'Мой прошлый экипаж за всё время ни разу не опоздал на смену. Горжусь ребятами.', 1, '2026-10-23 14:00', 0, [], 'published'],
]
export const EXTRA_POSTS: APost[] = P_ROWS.map(([author, initials, role, text, photos, date, complaints, reasons, state], i) => ({ id: `ap${i + 7}`, author, initials, role, text, photos, date, complaints, reasons, state }))

/* ---------- вакансии ---------- */

type J = [string, string, string, string, string, string, boolean, string, string, string, string, AJob['state'], number, string, string?]
const J_ROWS: J[] = [
  ['2nd Engineer', 'Merchant', 'Engine', 'Bulk Carrier', 'BlueWave Crewing', '', false, '$6 800 / месяц', 'Европа', '2026-12-08', '4 мес.', 'review', 0, '2026-11-02', 'Первая вакансия от компании за 30 дней'],
  ['Chief Officer', 'Merchant', 'Deck', 'Oil Tanker', 'Nordline Ship Management', '', false, '€7 400 / месяц', 'Европа', '2026-12-12', '3 мес.', 'review', 0, '2026-11-02'],
  ['Bosun', 'Merchant', 'Deck', 'General Cargo', 'Meridian Crew', '', false, '$2 300 / месяц', 'Африка', '2026-11-28', '6 мес.', 'review', 1, '2026-11-01', 'Зарплата выше рынка в 2 раза'],
  ['Electrician', 'Offshore', 'Engine', 'AHTS', 'Atlas Marine Services', '', false, '€5 000 / месяц', 'Европа', '2026-12-03', '4 недели', 'review', 0, '2026-11-01', 'Организация ещё на проверке'],
  ['Messman', 'Merchant', 'Catering', 'Container Ship', 'Quick Crew Agency', '', false, '$700 / месяц', 'ОАЭ', '2026-11-12', '9 мес.', 'review', 2, '2026-10-31', 'Жалобы: оплата за трудоустройство'],
  ['Oiler', 'Merchant', 'Engine', 'LPG Carrier', 'BlueWave Crewing', '', false, '$2 100 / месяц', 'Европа', '2026-12-15', '6 мес.', 'review', 0, '2026-10-31'],
  ['Deck Cadet', 'Merchant', 'Deck', 'Chemical Tanker', 'Nordline Ship Management', '', false, '€900 / месяц', 'Европа', '2027-01-10', '6 мес.', 'review', 0, '2026-10-30'],
  ['Third Mate', 'Offshore', 'Deck', 'PSV', 'Nordline Ship Management', '', false, '€4 300 / месяц', 'Европа', '2026-12-02', '4 недели', 'published', 0, '2026-10-29'],
  ['Able Seaman', 'Merchant', 'Deck', 'Bulk Carrier', 'BlueWave Crewing', '', false, '$1 900 / месяц', 'Европа', '2026-11-30', '6 мес.', 'published', 0, '2026-10-29'],
  ['Cook', 'Merchant', 'Catering', 'Oil Tanker', 'Seafolio', '', true, '$2 000 / месяц', 'ОАЭ', '2026-12-05', '6 мес.', 'published', 0, '2026-10-28'],
  ['Hotel Manager', 'Passenger / Cruise', 'Hotel & Entertainment', 'Cruise Ship', 'Seafolio', '', true, '€4 800 / месяц', 'Европа', '2026-12-20', '6 мес.', 'published', 0, '2026-10-27'],
  ['Fitter', 'Merchant', 'Engine', 'Bulk Carrier', 'Nordline Ship Management', '', false, '$3 400 / месяц', 'Европа', '2026-11-22', '4 мес.', 'published', 1, '2026-10-26'],
  ['ETO', 'Offshore', 'Engine', 'AHTS', 'BlueWave Crewing', '', false, '€5 600 / месяц', 'Европа', '2026-12-18', '4 недели', 'published', 0, '2026-10-25'],
  ['Pumpman', 'Merchant', 'Engine', 'Chemical Tanker', 'BlueWave Crewing', '', false, '$3 100 / месяц', 'Европа', '2026-12-09', '5 мес.', 'published', 0, '2026-10-24'],
  ['2nd Cook', 'Passenger / Cruise', 'Catering', 'Cruise Ship', 'Seafolio', '', true, '€1 700 / месяц', 'Европа', '2026-11-18', '8 мес.', 'published', 0, '2026-10-23'],
  ['Master', 'Offshore', 'Deck', 'PSV', 'Nordline Ship Management', '', false, '€9 200 / месяц', 'Европа', '2026-12-28', '4 недели', 'published', 0, '2026-10-22'],
  ['Wiper', 'Merchant', 'Engine', 'Oil Tanker', 'Seahorse Manning', '', false, '$800 / месяц', 'Африка', '2026-10-28', '9 мес.', 'rejected', 0, '2026-10-11', 'Организация отклонена'],
  ['Deckhand', 'Fishing', 'Deck', 'Fishing Trawler', 'Quick Crew Agency', '', false, '$600 / месяц', 'Африка', '2026-11-03', '10 мес.', 'hidden', 5, '2026-10-06', 'Снята после жалоб'],
  ['Steward', 'Passenger / Cruise', 'Hotel & Entertainment', 'Ferry', 'Seafolio', '', true, '€1 500 / месяц', 'Европа', '2026-11-26', '6 мес.', 'hidden', 0, '2026-10-15', 'Снята по просьбе команды'],
  ['Chief Engineer', 'Merchant', 'Engine', 'LNG Carrier', 'Meridian Crew', '', false, '$14 000 / месяц', 'Европа', '2026-12-30', '3 мес.', 'rejected', 0, '2026-10-14', 'Нет подтверждения лицензии'],
  ['Cadet', 'Merchant', 'Engine', 'Ro-Ro', 'BlueWave Crewing', '', false, '$800 / месяц', 'Европа', '2027-01-15', '6 мес.', 'review', 0, '2026-10-29'],
  ['Rigger', 'Offshore', 'Deck', 'Drilling Rig', 'Atlas Marine Services', '', false, '€3 900 / месяц', 'Европа', '2026-12-22', '4 недели', 'review', 1, '2026-10-28', 'Организация ещё на проверке'],
]
export const EXTRA_JOBS: AJob[] = J_ROWS.map(([position, fleet, department, vesselType, org, , byTeam, salary, region, board, duration, state, complaints, created, note], i) => ({
  id: `aj${i + 9}`, position, fleet, department, vesselType, org, byTeam, salary, region, board, duration, state, complaints, created, note,
}))

/* ---------- жалобы ---------- */

type R = [Report['target'], string, string, string, string, number, string, Report['state'], string?, string?, string?]
const R_ROWS: R[] = [
  ['job', 'Motorman, Oil Tanker', 'Seahorse Manning', 'Оплата за трудоустройство', 'Ahmed K.', 2, '2026-11-02 06:20', 'open', 'org-sh'],
  ['org', 'Quick Crew Agency', 'ОАЭ, заблокирована', 'Угрозы и давление', 'Pavlo D.', 2, '2026-11-01 22:10', 'open', 'org-qx'],
  ['message', 'Томас Вейль, BlueWave Crewing', 'Чат по вакансии 2nd Engineer', 'Просит личные данные до собеседования', 'Hanif R.', 1, '2026-11-01 19:02', 'open', 'org-bw'],
  ['job', 'Cook, Fishing Trawler', 'Quick Crew Agency', 'Вакансии не существует', 'Luis V.', 2, '2026-11-01 15:48', 'open', 'org-qx'],
  ['job', 'Chief Engineer, Bulk Carrier', 'Atlas Marine Services', 'Зарплата не совпадает с описанием', 'Taras M.', 1, '2026-10-31 20:30', 'open', 'org-am'],
  ['message', 'Павел Новак, Meridian Crew', 'Чат по вакансии Bosun', 'Грубость', 'Yusuf E.', 1, '2026-10-31 12:15', 'open', 'org-mc'],
  ['org', 'Meridian Crew', 'Польша, на проверке', 'Выдают себя за другую компанию', 'Andrea P.', 2, '2026-10-30 18:40', 'open', 'org-mc'],
  ['job', '3rd Engineer, Chemical Tanker', 'BlueWave Crewing', 'Вакансия уже закрыта', 'Kamal S.', 1, '2026-10-30 09:10', 'open', 'org-bw'],
  ['message', 'Омар Х., Quick Crew Agency', 'Чат по вакансии AB', 'Просит деньги за трудоустройство', 'Rey B.', 3, '2026-10-29 17:22', 'open', 'org-qx'],
  ['org', 'Seahorse Manning', 'Панама, отклонена', 'Оплата за трудоустройство', 'Peter G.', 3, '2026-10-29 10:05', 'open', 'org-sh'],
  ['job', 'AB (Able Seaman), Container Ship', 'Quick Crew Agency', 'Оплата за трудоустройство', 'Wei L.', 3, '2026-10-25 14:30', 'closed', 'org-qx', 'Вакансия снята'],
  ['message', 'Елена Маринова, BlueWave Crewing', 'Чат по вакансии 3rd Engineer', 'Грубость', 'Sami H.', 1, '2026-10-24 11:50', 'closed', 'org-bw', 'Жалоба отклонена: переписка вежливая'],
  ['org', 'Nordline Ship Management', 'Норвегия', 'Не отвечают на отклики', 'Alex N.', 1, '2026-10-23 16:45', 'closed', 'org-ns', 'Жалоба отклонена'],
  ['job', 'Chief Cook, Container Ship', 'Seafolio', 'Зарплата не совпадает с описанием', 'Nikola J.', 1, '2026-10-21 09:00', 'closed', 'org-ns', 'Жалоба отклонена: ставка указана верно'],
  ['message', 'Омар Х., Quick Crew Agency', 'Чат по вакансии Messman', 'Просит деньги за трудоустройство', 'Gabriel T.', 2, '2026-10-19 13:35', 'closed', 'org-qx', 'Рекрутер заблокирован'],
  ['job', 'Deckhand, Fishing Trawler', 'Quick Crew Agency', 'Вакансии не существует', 'Ivo K.', 4, '2026-10-17 08:20', 'closed', 'org-qx', 'Вакансия снята'],
  ['org', 'BlueWave Crewing', 'Кипр', 'Грубость', 'Rob D.', 1, '2026-10-14 19:10', 'closed', 'org-bw', 'Жалоба отклонена'],
  ['job', 'Wiper, Oil Tanker', 'Seahorse Manning', 'Оплата за трудоустройство', 'Mark O.', 2, '2026-10-12 12:25', 'closed', 'org-sh', 'Вакансия снята'],
]
export const EXTRA_REPORTS: Report[] = R_ROWS.map(([target, title, context, reason, reporter, count, at, state, orgId, outcome], i) => ({
  id: `rp-${59 + i}`, target, title, context, reason, reporter, count, at, state, orgId, outcome,
  ...(target === 'message' ? { userId: orgId === 'org-qx' ? 'u11' : orgId === 'org-mc' ? 'u10' : 'u04' } : {}),
}))

/* ---------- тексты и рассылки ---------- */

type T = [TextItem['kind'], string, string, string, string, number, TextItem['state'], string]
const T_ROWS: T[] = [
  ['app', 'onboarding.slide2', 'Онбординг, слайд 2', 'Загрузите документы фото или файлом — остальное мы заполним сами', 'Upload documents as a photo or a file — we fill in the rest', 10, 'approved', '2026-10-27'],
  ['app', 'onboarding.slide3', 'Онбординг, слайд 3', 'Следите за сроками и получайте напоминания заранее', 'Track expiry dates and get reminders in advance', 8, 'approved', '2026-10-27'],
  ['app', 'profile.fill.hint', 'Подсказка про заполнение профиля', 'Чем полнее профиль, тем чаще вас находят рекрутеры', 'The fuller your profile, the more often recruiters find you', 4, 'review', '2026-11-01'],
  ['app', 'jobs.empty', 'Пустой список вакансий', 'Подходящих вакансий пока нет. Попробуйте убрать часть фильтров', 'No matching jobs yet. Try removing some filters', 6, 'approved', '2026-10-26'],
  ['app', 'docs.expiring', 'Документ скоро истекает', 'Документ скоро истекает — загрузите новый заранее', 'A document expires soon — upload a new one in advance', 3, 'draft', '2026-11-02'],
  ['app', 'chat.empty', 'Пустой список чатов', 'Здесь появятся чаты с рекрутерами, когда вам ответят', 'Chats with recruiters will appear here once they reply', 5, 'approved', '2026-10-25'],
  ['app', 'share.profile', 'Поделиться профилем', 'Отправьте ссылку на профиль рекрутеру — он увидит только то, что вы открыли', 'Send your profile link — the recruiter sees only what you opened', 2, 'review', '2026-10-31'],
  ['app', 'premium.alerts', 'Уведомления по подборкам', 'Подборки уведомят вас о новых вакансиях раньше остальных', 'Saved searches alert you about new jobs before everyone else', 2, 'draft', '2026-11-02'],
  ['app', 'settings.language', 'Выбор языка', 'Язык приложения можно поменять в любой момент', 'You can change the app language at any time', 9, 'approved', '2026-10-22'],
  ['app', 'error.network', 'Нет связи', 'Нет связи. Проверьте интернет и попробуйте ещё раз', 'No connection. Check your internet and try again', 10, 'approved', '2026-10-20'],
  ['faq', 'faq.premium.cancel', 'Как отменить премиум?', 'Откройте подписку в магазине приложений и выключите продление', 'Open your subscription in the app store and turn off renewal', 3, 'review', '2026-10-30'],
  ['faq', 'faq.docs.lost', 'Что делать, если потерял документ?', 'Скан останется в приложении, но срок и номер нужно подтвердить заново', 'The scan stays in the app, but the number and dates need to be confirmed again', 2, 'draft', '2026-11-01'],
  ['faq', 'faq.recruiter.contact', 'Как со мной свяжется рекрутер?', 'Только через чат в приложении. Телефон виден, если вы сами его открыли', 'Only through the in-app chat. Your phone is visible only if you share it', 5, 'approved', '2026-10-24'],
  ['faq', 'faq.verify.company', 'Что значит «компания проверена»?', 'Мы смотрели регистрацию и документы компании. Это не гарантия, но повод доверять больше', 'We checked the company registration and documents. It is not a guarantee', 4, 'review', '2026-10-28'],
  ['faq', 'faq.delete.account', 'Как удалить аккаунт?', 'В настройках выберите «Удалить аккаунт». Данные сотрутся через 30 дней', 'In settings choose “Delete account”. Data is erased after 30 days', 6, 'approved', '2026-10-19'],
  ['faq', 'faq.fees', 'Нужно ли платить за работу?', 'Нет. Честные компании не берут деньги за трудоустройство. Если просят — пожалуйтесь', 'No. Honest companies never charge for jobs. If asked, report it', 7, 'approved', '2026-10-18'],
  ['email', 'email.welcome', 'Письмо: добро пожаловать', 'Добро пожаловать в Seafolio. Загрузите первый документ — это займёт минуту', 'Welcome to Seafolio. Upload your first document — it takes a minute', 4, 'approved', '2026-10-17'],
  ['email', 'email.invite.accepted', 'Письмо: друг принял приглашение', 'Ваш друг присоединился. Неделя премиума уже у вас', 'Your friend joined. A week of Premium is yours', 2, 'draft', '2026-11-02'],
  ['email', 'email.premium.ended', 'Письмо: премиум закончился', 'Премиум закончился. Продлите, чтобы подборки снова работали', 'Your Premium has ended. Renew to keep your saved searches', 3, 'review', '2026-10-31'],
  ['email', 'email.org.rejected', 'Письмо: заявка компании отклонена', 'Заявка отклонена. Причину вы найдёте ниже, документы можно прислать снова', 'Your application was declined. See the reason below and resubmit documents', 2, 'approved', '2026-10-16'],
]
export const EXTRA_TEXTS: TextItem[] = T_ROWS.map(([kind, key, title, ru, en, translated, state, updated], i) => ({ id: `t${i + 9}`, kind, key, title, ru, en, translated, state, updated }))

type M = [string, Mailing['channel'], string, string, Mailing['state'], number]
const M_ROWS: M[] = [
  ['Добро пожаловать', 'Push и email', 'Сразу после регистрации', 'Новые моряки', 'on', 1_238],
  ['Загрузите первый документ', 'Push', 'Через сутки после регистрации', 'Новые моряки', 'on', 702],
  ['Заявка компании проверена', 'Email', 'Когда решение принято', 'Рекрутеры', 'on', 96],
  ['Новый отклик на вакансию', 'Push и email', 'Сразу, как пришёл отклик', 'Рекрутеры', 'on', 2_410],
  ['Итоги недели', 'Email', 'Раз в неделю, по понедельникам', 'Активные за 30 дней', 'off', 3_872],
  ['Вас приглашают на собеседование', 'Push', 'Сразу, как рекрутер пригласил', 'Все моряки', 'on', 640],
  ['Скоро закончится пробная неделя', 'Push и email', 'За день до окончания', 'Пробная неделя', 'on', 188],
  ['Новая функция: поделиться профилем', 'Push', 'Один раз, вручную', 'Все моряки', 'draft', 0],
  ['Опрос: чего не хватает в приложении', 'Email', 'Один раз, вручную', 'Активные за 30 дней', 'draft', 0],
  ['Напоминание о посадке', 'Push', 'За 3 дня до даты посадки', 'Все моряки', 'off', 77],
]
export const EXTRA_MAILS: Mailing[] = M_ROWS.map(([title, channel, trigger, audience, state, sent], i) => ({ id: `m${i + 6}`, title, channel, trigger, audience, state, sent }))

/* ---------- верификация ---------- */

const LICENCE: VerifyDoc = { name: 'licence.pdf', type: 'Лицензия крюинга', pages: 2, size: '690 КБ', uploaded: '' }
const EXTRACT: VerifyDoc = { name: 'registry-extract.pdf', type: 'Выписка из реестра', pages: 2, size: '380 КБ', uploaded: '' }
const LETTER: VerifyDoc = { name: 'owner-letter.pdf', type: 'Письмо судовладельца', pages: 1, size: '210 КБ', uploaded: '' }
const CERT: VerifyDoc = { name: 'certificate.jpg', type: 'Свидетельство о регистрации', pages: 1, size: '1,1 МБ', uploaded: '' }
const docsOf = (at: string, ...d: VerifyDoc[]) => d.map((x) => ({ ...x, uploaded: at }))

type V = [string, string, string, string, 1 | 2, 0 | 1 | 2, string, VerifyReq['state'], VerifyDoc[], string?, string?, string?]
const V_ROWS: V[] = [
  ['Orion Crew Solutions', 'Мальта', 'C 71 204', 'Мария Борг', 1, 0, '2026-11-02 08:12', 'pending', [EXTRACT]],
  ['Baltic Sea Manning', 'Эстония', 'EE 12 884 503', 'Март Тамм', 2, 1, '2026-11-02 07:30', 'pending', [LICENCE, LETTER], 'Позвоните после 12:00 по Таллину.'],
  ['Pacifica Maritime', 'Филиппины', 'SEC CS201 988', 'Хосе Рамос', 1, 0, '2026-11-01 23:05', 'pending', [EXTRACT, CERT]],
  ['Danube Shipping Agency', 'Румыния', 'J40 3321 2019', 'Раду Попеску', 1, 0, '2026-11-01 14:40', 'pending', [EXTRACT]],
  ['Fjord Offshore Crewing', 'Норвегия', 'NO 988 120 440', 'Ула Хансен', 2, 1, '2026-11-01 10:15', 'pending', [LICENCE, LETTER, CERT], 'Работаем с шестью судами на шельфе.'],
  ['Marlin Ship Services', 'Хорватия', 'HR 5521 033', 'Иван Югович', 1, 0, '2026-10-31 18:22', 'pending', [EXTRACT]],
  ['Cape Horn Crewing', 'Чили', 'RUT 76 551 220-4', 'Андрес Мунос', 1, 0, '2026-10-31 09:50', 'pending', [CERT]],
  ['Sunrise Marine HR', 'Индия', 'CIN U74 998 MH', 'Радж Мехта', 2, 1, '2026-10-30 15:08', 'pending', [LICENCE, LETTER]],
  ['Hellas Bunker Crew', 'Греция', 'GEMI 144 902 118 000', 'Элени Коста', 1, 0, '2026-10-30 11:44', 'pending', [EXTRACT]],
  ['Aegean Fleet Staffing', 'Греция', 'GEMI 160 004 771 000', 'Янис Георгиу', 2, 1, '2026-10-29 16:30', 'pending', [LICENCE, LETTER, CERT]],
  ['Tagus Crew Partners', 'Португалия', 'NIPC 514 220 889', 'Жуан Силва', 1, 0, '2026-10-29 10:02', 'pending', [EXTRACT]],
  ['Northern Lights Crewing', 'Финляндия', 'Y-tunnus 3140 221-9', 'Микко Вирта', 1, 0, '2026-10-28 13:18', 'pending', [EXTRACT, LETTER]],
  ['Vostok Maritime Group', 'Грузия', 'ID 405 221 903', 'Нино Беридзе', 2, 1, '2026-10-28 08:40', 'pending', [LICENCE]],
  ['Gulf Star Manning', 'ОАЭ', 'DMCC 108 220', 'Халид Аль-Мансури', 1, 0, '2026-10-26 17:00', 'approved', [EXTRACT], undefined, '2026-10-27 09:12'],
  ['Adriatic Crew Link', 'Хорватия', 'HR 2290 114', 'Петра Новак', 1, 0, '2026-10-25 12:45', 'approved', [EXTRACT], undefined, '2026-10-26 10:30'],
  ['Rhine Marine Staffing', 'Германия', 'HRB 221 094', 'Томас Кляйн', 2, 1, '2026-10-24 09:20', 'approved', [LICENCE, LETTER], undefined, '2026-10-27 14:05'],
  ['Corsair Crew Agency', 'Франция', 'RCS 884 220 109', 'Люк Мартен', 1, 0, '2026-10-22 16:10', 'approved', [EXTRACT], undefined, '2026-10-23 11:00'],
  ['Silver Wake Manning', 'Кипр', 'HE 390 114', 'Андреас Пеппас', 2, 1, '2026-10-21 10:40', 'approved', [LICENCE, LETTER], undefined, '2026-10-24 15:20'],
  ['Pearl Harbor Crewing', 'Сингапур', 'UEN 2019 4410 K', 'Лим Вэй', 1, 0, '2026-10-20 08:00', 'approved', [EXTRACT], undefined, '2026-10-21 09:40'],
  ['Kestrel Offshore HR', 'Великобритания', 'CRN 11 440 982', 'Оливер Хьюз', 2, 1, '2026-10-19 14:50', 'approved', [LICENCE, CERT], undefined, '2026-10-22 12:10'],
  ['Black Sea Staffing', 'Турция', 'MERSIS 0884 221', 'Эмре Айдын', 1, 0, '2026-10-18 11:25', 'approved', [EXTRACT], undefined, '2026-10-19 10:00'],
  ['Mistral Marine Crew', 'Италия', 'REA GE 441 002', 'Марко Феррари', 1, 0, '2026-10-16 15:35', 'approved', [EXTRACT], undefined, '2026-10-17 11:15'],
  ['Coral Reef Manning', 'Индонезия', 'NIB 8120 004 211', 'Дева Путра', 1, 0, '2026-10-15 09:10', 'approved', [EXTRACT], undefined, '2026-10-16 09:55'],
  ['Lighthouse Crew Co', 'Не указана', 'не указан', 'Без имени', 1, 0, '2026-10-17 21:30', 'rejected', [CERT], 'Номер не найден, название не совпадает с документом', '2026-10-18 10:20'],
  ['Eastern Wind Agency', 'Вьетнам', 'MST 0314 220', 'Нгуен Ван', 2, 1, '2026-10-15 13:05', 'rejected', [LETTER], 'Нет лицензии, письмо без печати', '2026-10-16 12:40'],
  ['Neptune Quick Hire', 'Не указана', 'не указан', 'Без имени', 1, 0, '2026-10-14 22:00', 'rejected', [CERT], 'Документ — фото чужого свидетельства', '2026-10-15 09:30'],
  ['Anchor Point Crewing', 'Польша', 'KRS 0000 771 904', 'Яцек Кович', 2, 1, '2026-10-10 10:00', 'rejected', [LICENCE], 'Лицензия просрочена', '2026-10-11 15:45'],
  ['Golden Sail Manning', 'Мальта', 'C 80 112', 'Карл Грима', 1, 0, '2026-10-08 12:30', 'rejected', [EXTRACT], 'Выписка старше 6 месяцев', '2026-10-09 10:10'],
  ['Zenith Crew Partners', 'Греция', 'GEMI 099 340 221 000', 'Никос Алексиу', 1, 0, '2026-10-06 09:15', 'rejected', [EXTRACT], 'Компания в списке недобросовестных', '2026-10-07 11:50'],
]
export const EXTRA_VERIFY: VerifyReq[] = V_ROWS.map(([org, country, regNumber, who, level, current, submitted, state, docs, commentOrReason, decidedAt], i) => ({
  id: `vr-x${i + 1}`,
  orgId: `org-x${i + 1}`,
  org,
  country,
  regNumber,
  level,
  current,
  submitted,
  state,
  contact: `${who}, +00 ••• ••${10 + i}`,
  docs: docsOf(submitted.slice(0, 15) + '0', ...docs),
  ...(state === 'rejected' ? { reason: commentOrReason, decidedAt } : state === 'approved' ? { decidedAt } : commentOrReason ? { comment: commentOrReason } : {}),
}))

addOnce(A_POSTS, EXTRA_POSTS)
addOnce(A_JOBS, EXTRA_JOBS)
addOnce(REPORTS, EXTRA_REPORTS)
addOnce(TEXTS, EXTRA_TEXTS)
addOnce(MAILINGS, EXTRA_MAILS)
addOnce(VERIFY_REQS, EXTRA_VERIFY)
