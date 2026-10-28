# Бриф: мобільний застосунок для моряків (dark theme first)

> Мета: побачити весь флоу застосунку моряка на екранах і в клікабельному прототипі, щоб перечитати, виправити і погодити його перед розробкою.
> Це чорновий UX-прототип для перевірки логіки. Фінальний візуальний стиль робить дизайнер проєкту.

---

## 1. Контекст продукту

Мобільний застосунок (iOS + Android) для моряків торгового, offshore, пасажирського та риболовного флоту. Це поєднання:
- **джоб-борду** (пошук вакансій, відгуки, збережені підбірки);
- **професійної соцмережі** на кшталт LinkedIn (стрічка, дописи, підписки на інших моряків);
- **цифрового портфеля документів** моряка, які заповнюються через фото з AI-розпізнаванням.

Рекрутери (крюїнгові компанії) працюють у вебкабінеті, його зараз **не малюємо**. У застосунку моряка рекрутер з'являється лише як співрозмовник у чаті та автор вакансій і офферів.

**Мова інтерфейсу в макетах — англійська** (продукт міжнародний). Довідники (посади, типи суден, країни) завжди англійською незалежно від мови інтерфейсу.

**Дані в макетах — лише вигадані.** Не використовуй імена, телефони, номери документів реальних людей. Приклади: моряк *Andrii Koval, 3rd Engineer*; компанії *BlueWave Crewing*, *Nordline Ship Management*; судна *MV Nordic Star*, *MT Aurora Spirit*.

---

## 2. Дизайн-напрям

**Платформа:** мобільний, кадр 390×844 (iPhone 15). Пізніше ті самі екрани адаптуються під Android.

**Тема:** спершу **темна**. Світлу зробимо пізніше, тож кольори одразу задавай токенами.

**Настрій:** спокійний, професійний, «морський» без кітчу: жодних якорів і штурвалів як декору. Дані мають читатися легко: моряк часто дивиться на телефон утомленим, з поганим інтернетом, на ходу.

**Орієнтири (не копіювати бренди):**
- **LinkedIn mobile:** стрічка, бічне меню по аватару, профіль іншої людини з кнопкою «Follow».
- **Kleinanzeigen (dark):** вкладки «Обране / Збережені пошуки» з перемикачем сповіщень і позначкою NEW; шапка «Мій профіль» (аватар, лічильники, кнопки «поділитися» і «налаштування»); список налаштувань з іконками і підписами.
- **Crewell / морські джоб-борди:** набір полів вакансії, деревоподібні фільтри «департамент → посада» і «флот → тип судна» з лічильниками.

**Пропоновані токени (можна скоригувати):**

| Токен | Значення | Використання |
|---|---|---|
| bg | #0B1117 | фон екранів |
| surface | #121A22 | картки, списки |
| surface-raised | #1A2430 | bottom sheets, модалки |
| border | #243242 | роздільники |
| text-primary | #E8EEF3 | основний текст |
| text-secondary | #9AA8B5 | підписи |
| accent | #2EC4B6 | основні кнопки, активні вкладки, посилання |
| success | #3FB950 | документ підтверджено, перевірена компанія |
| warning | #E3A008 | документ спливає, поле з низькою впевненістю AI |
| danger | #F05252 | документ прострочений, помилки |
| premium | #D4AF37 | бейджі і замки преміуму |

**Правила:**
- сітка 8pt, радіус карток 12–16;
- зона натискання не менше 44pt;
- контраст тексту не нижчий за WCAG AA;
- іконки контурні;
- шрифт системний (SF Pro / Roboto) або Inter.

**Стани, які треба показати там, де вони доречні:** завантаження (skeleton), порожній стан, помилка, немає інтернету (банер), «гість — потрібна реєстрація», «функція преміум» (замок + CTA).

---

## 3. Навігація

**Варіант A (основний, пропозиція):**
- **Нижня панель, 5 елементів:** Home · Jobs · **+** (по центру, акцентна) · Notifications · Messages.
- **Верхня панель:** ліворуч аватар, він відкриває бічне меню (як LinkedIn); по центру пошук; праворуч за потреби контекстна дія.
- **Бічне меню:**
  - шапка: аватар, ім'я, посада, % заповнення профілю;
  - розділи: My profile, My documents, Sea service, My applications, Favorites, Saved searches, My salary & rating, Analytics, Premium (бейдж), Settings, Help & support, Log out.

**Варіант B (для порівняння, один екран):** нижня панель у стилі Kleinanzeigen: Search · Favorites · + · Messages · Profile.

Намалюй обидва варіанти на екрані Home, щоб їх можна було порівняти.

---

## 4. Список екранів

Номери екранів використовуй у назвах фреймів, щоб на них було легко посилатися в правках.

### 4.1 Вхід і перший запуск

**S01 Splash.** Логотип-заглушка.

**S02 Welcome.**
- Короткий заголовок про цінність: вакансії, документи в одному місці, спільнота моряків.
- Кнопки: **Create account**, **Log in**, текстове посилання **Browse jobs without account**.

**S03 Sign up.**
- Email + password; Continue with Google; Continue with Apple (варіант, питання відкрите); Sign up with passkey.
- Посилання на Terms і Privacy.

**S04 Log in.** Email + password, passkey, Google, Apple, «Forgot password».

**S05 Forgot password.** Email → екран «перевірте пошту».

**S06 Choose language** (одразу після реєстрації).
- Список мов з пошуком.
- Підпис дрібним текстом: «Changes app interface only. Positions, vessel types and countries always stay in English».

**S07 How it works** — степер на 4 слайди з індикатором і кнопками Skip / Next:
1. Знаходьте вакансії і зберігайте підбірки.
2. Сфотографуйте документи, AI заповнить профіль за вас.
3. Як фотографувати: рівна поверхня, добре світло, видно всі кути, один документ на фото.
4. Ваші дані захищені, контакти бачать лише перевірені компанії.

### 4.2 Майстер заповнення профілю

На всіх екранах майстра вгорі **шкала прогресу профілю (%)** і кнопка **Save & continue later**.

**S08 Profile setup — checklist.**
- Огляд кроків зі статусами (not started / in progress / done / needs review):
  1. Identity documents
  2. Contacts & personal info
  3. Fleet & position
  4. Documents
  5. Review
  6. Salary (optional)
  7. Plan
- Можна вийти і продовжити пізніше.

**S09 Camera capture.**
- Рамка під документ, підказки, спалах, вибір з галереї / PDF.
- Режим кількох сторінок: мініатюри знизу, «Add page».

**S10 Identity documents.**
- Картки: **Seaman's book / Seaman's ID — personal page** і **International passport**.
- Кнопка «Add other seaman's book» (наприклад, ліберійське).
- Після фото картка переходить у стан «Processing…».
- Підказка: «AI will fill your name, date of birth, citizenship and document details».

**S11 Contacts & personal info** — вручну тільки те, чого немає в документах:
- **Контакти:**
  - phone з кодом країни і перемикачами **WhatsApp / Viber / Telegram** на тому ж номері;
  - Telegram username (необов'язково), email.
- **Місце проживання:** country of residence, city, address; nearest airport (пошук за містом або кодом IATA).
- **Про себе:** gender (якщо AI не визначив), height (cm), weight (kg), distinguishing marks (вільний текст, приклад «tattoo left arm»), фото профілю, «About me» (коротка шапка).
- Поля, які заповнив AI, показані заповненими з маленькою позначкою «from document».

**S12 Languages.**
- Список доданих мов із рівнем; «Add language».
- Bottom sheet з рівнями A1–C2 + Native і коротким поясненням кожного рівня.

**S13 Preferred fleet & vessel types.**
- Крок 1: 5 карток флоту (multi-select): Merchant Fleet, Offshore Fleet, Passenger / Cruise Vessels, Fishing Vessels, Onshore / Office.
- Крок 2: типи суден для вибраних флотів — згруповані, з пошуком, чекбоксами, лічильником вибраних.
  - Приклад груп Merchant: Container / Cargo, Tankers, Gas Carriers, Bulk Carriers, Refrigerated / Specialized Cargo.
  - Приклад груп Offshore: Offshore Supply, Anchor Handling / Towing, Construction / Installation, ROV / Diving / Subsea, Offshore Wind, Well / Drilling, Production / Storage…

**S14 Desired position.**
- Дерево **Department → Position** (Deck, Engine, Catering, Safety/HSE, Fishing/Processing; «Hotel & Entertainment (Cruise)» і «Other» — внизу списку, приглушено).
- Пошук, алфавітний порядок, multi-select, позначка «Primary» для головної посади.
- Пункт «Other» відкриває поле вільного тексту.

**S15 Documents hub.**
- Категорії-картки з лічильником і статусом:
  - Sea service (pages of seaman's book)
  - Visas
  - Certificate of Competency (CoC)
  - Endorsement
  - Medical certificates
  - Vaccination (Yellow fever)
  - Certificates (STCW, offshore…)
  - Additional (courses, diplomas, appraisal report)
- Кожна картка: «Take photo» / «Upload» / «Add manually».
- Статуси документів: Processing · Needs review · Confirmed · Expiring soon · Expired.

**S16 Sea service pages.**
- Фото кількох розворотів посвідчення, мініатюри сторінок.
- Підказка: «Handwritten entries are OK — you'll check them after processing».

**S17 Certificates upload.**
- Масове завантаження (до ~30): сітка мініатюр зі статусами обробки.
- Підказка «One certificate per photo».

**S18 AI processing.**
- Фоновий процес: «We're reading your documents. You can continue filling your profile».
- Прогрес по кожному документу. Приклад пуша: «Documents processed — please review».

**S19 Check & correct — document.** Ключовий екран, зроби його особливо ретельно.
- Угорі фото документа з можливістю збільшити.
- Нижче розпізнані поля. Поля з низькою впевненістю AI підсвічені warning-кольором з позначкою «Please check».
- Поля за типом документа:
  - Seaman's book / Passport: number, issue date, expiry date, place of issue (+ ім'я, дата народження, громадянство, стать для першого документа);
  - Visa: country, type (наприклад B1/B2), number, issue date, expiry date;
  - CoC / Endorsement: number, issue date, expiry date, place of issue;
  - Medical: type, issue date, expiry date, place of issue;
  - Vaccination: disease, date, validity («Valid for life» — перемикач);
  - Certificate: name (з каталогу з пошуком або свій), number, issue date, expiry date або перемикач «No expiry date», place of issue.
- Кнопки: **Confirm** (основна), «Retake photo», «Delete».
- **Кнопки Skip немає.** Покажи лічильник «3 of 12 documents reviewed».

**S20 Check & correct — sea service.**
- Список розпізнаних рядків стажу. Кожен рядок: ship's name, date of embarkation, date of disembarkation, place of disembarkation, position (з довідника), vessel type (**вибір зі списку, обов'язково**).
- Сумнівні значення підсвічені. Поруч можна відкрити фрагмент фото сторінки.
- Необов'язкові поля, які моряк може додати: IMO, GT, DWT, main engine / kW, employer.

**S21 Add document manually.** Та сама форма, що й на S19, без фото (фото можна додати пізніше).

**S22 Your salary (optional).**
- Остання зарплата (USD/month), посада, тип судна, рік контракту.
- Пояснення: «Used anonymously to show where you stand among seafarers in the same rank».
- Кнопка «Skip for now».

**S23 Premium (paywall).**
- Перелік переваг з іконками: instant job alerts, CV / application form PDF, who viewed your profile, open profile for verified companies, priority in search.
- Перемикач Monthly / Yearly (бейдж знижки). Кнопки «Continue with Premium» і «Maybe later».

**S24 Profile ready.** Успіх, % заповнення, що ще можна додати, кнопки «Go to jobs» / «Go to home».

### 4.3 Головна і соціальна частина

**S25 Home feed.**
- Угорі аватар (бічне меню) і пошук.
- **Банер заповнення профілю**, якщо менше 100%.
- **Карусель «Jobs for you»**, 2–3 короткі картки вакансій.
- **Пости:** автор (аватар, ім'я, посада, «Following»), текст, фото, лайк / коментар / поділитися.
- Між постами **спонсорована картка** з позначкою «Sponsored» (наприклад, навчальний центр).
- Поширена вакансія в пості — вбудована картка вакансії.

**S26 Sidebar** — див. розділ 3.

**S27 Create post («+»).** Текст, фото, «Share a vacancy» (вибір з обраного), кнопка Post.

**S27b Guest tapped «+».** Tooltip / bottom sheet: «Create an account to post» + кнопки Sign up / Log in.

**S28 Post detail.** Пост, коментарі, поле коментаря; меню «…»: Report, Block user.

**S29 Seafarer profile (чужий).**
- Шапка: фото, ім'я, посада, флот, followers / following, кнопка **Follow / Following**.
- **Кнопки «Message» немає** (моряки між собою не листуються).
- Вкладки: Posts / About (без контактів і документів).
- Меню «…»: Share profile, Report, Block.

### 4.4 Вакансії

**S30 Jobs — Search.**
- Сегменти вгорі: **Search · Favorites · Saved searches · My applications**.
- Рядок пошуку, чипи активних фільтрів, сортування (Newest / Join date / Salary).
- **Коротка картка вакансії:**
  - посада;
  - зарплата (діапазон або «Negotiable»);
  - тип судна, дата посадки, тривалість контракту;
  - компанія + бейдж «Verified»;
  - час публікації;
  - бейджі NEW / ASAP;
  - іконка «серце».
- Внизу кнопка «Save this search».

**S31 Filters** (повноекранний).
- **Position:** дерево Department → Position з лічильниками і пошуком.
- **Fleet / vessel type:** дерево Fleet → Group → Vessel type з лічильниками і пошуком.
- **Country of employer**.
- **Salary from** (USD/month) + чекбокс «Include negotiable».
- **Join date** (from–to); **Contract length**.
- Кнопки «Reset» і «Show 128 jobs».

**S32 Vacancy detail.**
- **Шапка:** посада, компанія (логотип, Verified), час публікації, перегляди.
- **Основні поля:** salary, vessel type, join date, contract length, preferred nationality (прапорці).
- **Судно:** flag, shipowner country, DWT, main engine (maker / model), ME power kW, year built.
- **Вимоги:** English level, US visa, Schengen visa, required certificates. Позначки ✓ / ✗ проти профілю моряка: «You match 5 of 6 requirements».
- **Опис** — згорнутий текст рекрутера.
- **Дії:** Apply (основна, закріплена внизу), серце, поділитися.
- **Внизу 2–3 схожі вакансії**, не більше: на телефоні не перевантажуємо.

**S33 Apply.**
- Bottom sheet: що буде надіслано (профіль у форматі application form, прев'ю), необов'язковий cover letter, кнопка «Send application».
- Далі екран успіху.
- Стан гостя: bottom sheet «Create an account to apply».

**S34 Favorites.** Список збережених вакансій. Закрита вакансія приглушена з позначкою «Closed». Swipe для видалення.

**S35 Saved searches** (як у Kleinanzeigen).
- Картка підбірки:
  - автоматична назва, наприклад «3rd Engineer · Chemical Tanker · from $4,000»;
  - бейдж NEW з кількістю нових вакансій;
  - перемикач **Notifications**;
  - «Delete search».
- Два приклади підбірок, щоб показати сценарій «Master on Container ship» + «Chief Officer in Offshore».

**S36 My applications.** Список зі статусами: Sent → Viewed → Shortlisted → Offer → Accepted / Declined / Rejected.

### 4.5 Сповіщення і повідомлення

**S37 Notifications — Work.**
- **Картка оффера:** «BlueWave Crewing offers you 3rd Engineer on MT Aurora Spirit» + кнопки **Confirm** / **Decline**. Будь-яка з них відкриває чат з рекрутером.
- **Нові вакансії за підбіркою.**
- **Зміна статусу відгуку.**
- **«Your Medical certificate expires in 30 days»** — warning-кольором.
- **Для безкоштовного користувача:** ненав'язливий рядок «Premium members got this 1 hour earlier» + посилання на Premium.

**S38 Notifications — Personal.** Нові підписники, лайки, коментарі, нові пости тих, на кого підписаний.

**S39 Messages.** Список чатів **лише з рекрутерами**: логотип компанії, Verified, назва вакансії, останнє повідомлення, непрочитані.

**S40 Chat with recruiter.**
- **Шапка:** компанія + Verified, під нею вакансія (натискання відкриває S32).
- **Повідомлення:** текст, фото, файли.
- **Спеціальні картки в чаті:**
  - **Offer card** — Confirm / Decline, статус після вибору;
  - **Form request** — «Please fill in the company application form»;
  - **CV shared** — прев'ю application form.
- **Поле вводу:** вкладення, «Send my CV» (преміум — замок для безкоштовних).
- **Банер безпеки:** «Never pay for a job offer. Report suspicious messages».

**S41 Company form** — покажи **два варіанти** для обговорення:
- **A. Заповнення в застосунку:** поля форми, частина вже заповнена з профілю з позначкою «from your profile», кнопка Submit.
- **B. Файл:** Download form → «Fill it and upload back» → Upload filled form → статус «Sent».

### 4.6 Профіль, документи, преміум, налаштування

**S42 My profile** (шапка в стилі Kleinanzeigen).
- **Шапка:** аватар, ім'я, основна посада, followers / following / posts; праворуч угорі «Share» і «Settings».
- **Прогрес заповнення профілю** з підказкою, що додати.
- **Секції:** About, Contacts (видимість), Languages, Preferred fleet & vessels, Desired positions, Documents (зведення), Sea service (зведення), Availability (Available / On board / Not looking + дата).
- Кнопка **Generate CV** (преміум).

**S43 My documents.**
- Список за категоріями.
- Кожен документ: назва, номер (частково приховано), дата закінчення з кольоровим індикатором: зелений — дійсний, жовтий — спливає, червоний — прострочений, сірий — безстроковий.
- Дії: edit, replace photo, delete.

**S44 Sea service.**
- Хронологічний список карток: судно, тип, посада, дати, тривалість.
- Угорі підсумок: «Total sea time 6 y 4 m · 3rd Engineer 3 y 2 m».

**S45 CV / Application form.**
- Прев'ю PDF, стиль як у морських анкет: фото, основна інформація, документи, дипломи, сертифікати, медицина, стаж, cover letter.
- Кнопки «Download PDF», «Send by email / WhatsApp».
- Для безкоштовного — розмите прев'ю із замком і CTA Premium.

**S46 My salary & rating.**
- Моя зарплата.
- Позиція серед моряків тієї ж посади і типу судна: шкала-перцентиль, «You earn more than 62% of 3rd Engineers on Chemical Tankers».
- Стан «Not enough data yet».

**S47 Analytics.**
- Вакансії за моєю посадою і зарплатою (діапазони, міні-графік).
- Вакансії за бажаною роботою.
- «You appeared in recruiter searches: 14 times this week» — стан «Coming soon».
- «Who viewed your profile» — преміум, список компаній; для безкоштовних розмито.

**S48 Premium.** Статус підписки, переваги, керування, історія.

**S49 Settings** (список як у зразку):
- Account (email, password, passkeys, linked Google / Apple)
- Notifications
- Privacy & visibility
- App language
- Appearance (Dark / Light / System)
- Subscription & payments
- Help & feedback
- Legal (Terms, Privacy)
- Log out; Delete account (червоним)
- Версія застосунку внизу

**S50 Notification settings.**
- Групи **Work** і **Personal**, перемикачі за типами: new jobs from saved searches, application updates, recruiter messages, document expiry, new followers, likes & comments.
- Тихі години.

**S51 Privacy & visibility.**
- Profile visibility: Anonymized / Verified companies / Hidden — з поясненням, що бачить кожна група.
- **Open profile** (преміум) — контакти бачать перевірені компанії без запиту.
- Запити компаній на доступ до контактів: Allow / Deny.

### 4.7 Загальні стани

**S52** Гостьові обмеження (bottom sheet), порожні стани (немає вакансій за фільтром, немає обраного, немає сповіщень), помилка завантаження, офлайн-банер, skeleton-завантаження стрічки та списку вакансій.

---

## 5. Клікабельний прототип: сценарії

Зв'яжи екрани в такі сценарії:

- **F1. Гість:** S02 → S30 → S32 → Apply → «Create an account to apply» → S03.
- **F2. Реєстрація:** S02 → S03 → S06 → S07 → S08 → S09/S10 → S11 → S12 → S13 → S14 → S15 → S16/S17 → S18 → S19 → S20 → S22 → S23 → S24 → S25.
- **F3. Пошук роботи:** S25 → S30 → S31 → результати → S32 → серце → S34 → назад → «Save this search» → S35 → S32 → S33 → S36.
- **F4. Оффер:** S37 → Confirm → S40 з карткою оффера в статусі «Confirmed».
- **F5. Форма компанії:** S40 → Form request → S41 (A або B) → назад у чат зі статусом «Sent».
- **F6. Соціальне:** S25 → «+» → S27 → пост у стрічці; S25 → автор поста → S29 → Follow.
- **F7. Профіль і преміум:** аватар → S26 → S42 → S43 → документ → S19 (редагування) → S42 → Generate CV → S45 (замок) → S23.
- **F8. Налаштування:** S26 → S49 → S50 / S51.

---

## 6. Відкриті рішення — показати варіантами

1. Навігація: варіант A проти B (розділ 3).
2. Форма компанії: заповнення в застосунку (A) проти файлу (B) (S41).
3. Онбординг: зараз спершу фото документів, потім ручні дані. Порядок може змінитися, тому робити екрани незалежними одне від одного.
4. Вхід через Apple — показати кнопку як опційну.
5. Момент показу paywall (S23): у кінці онбордингу — поточна пропозиція.

---

## 7. Не малювати зараз

- Вебкабінет рекрутера і адмінку.
- Чати між моряками (їх немає).
- Світлу тему (тільки після погодження темної).
- Маркетинговий сайт.
