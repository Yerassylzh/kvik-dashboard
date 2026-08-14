# Kvik — Kickstart Plan

> **Документ:** Технический план начала разработки фронтенда  
> **Стек:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4  
> **Рынок:** Казахстан / СНГ  
> **Связанный документ:** [`Product Architecture.md`](./Product%20Architecture.md)

---

## 📐 Часть 1 — Архитектура папок

### Концепция

Проект делится на две зоны, обе в одном Next.js приложении:

| Домен | Назначение | Тип |
|:------|:-----------|:----|
| `kvik.kz` | Лендинг (публичный) | SSR, SEO |
| `app.kvik.kz` | Логин, Регистрация, Онбординг, Дашборд | Auth-protected SPA |

Разделение на поддомен реализуется через **Next.js Middleware** — один деплой, никаких отдельных репозиториев.

---

### Целевая структура папок

```
kvik/
│
├── app/
│   │
│   ├── (marketing)/                     # Группа: лендинг — kvik.kz/
│   │   ├── layout.tsx                   # Nav + footer
│   │   ├── page.tsx                     # Главная страница (niche-switcher)
│   │   └── _sections/
│   │       ├── HeroSection.tsx
│   │       ├── NicheSwitcher.tsx        # Переключатель ниши без перезагрузки
│   │       ├── LiveDemoWidget.tsx       # Интерактивный демо-чат
│   │       ├── RoiCalculator.tsx
│   │       ├── PricingSection.tsx
│   │       └── FaqSection.tsx
│   │
│   ├── (auth)/                          # Группа: аутентификация — app.kvik.kz/login|register
│   │   ├── layout.tsx                   # Минимальный layout: логотип по центру
│   │   ├── login/
│   │   │   └── page.tsx                 # Форма логина
│   │   └── register/
│   │       └── page.tsx                 # Форма регистрации
│   │
│   ├── (onboarding)/                    # Группа: онбординг — app.kvik.kz/onboarding
│   │   ├── layout.tsx                   # Логотип + прогресс-бар + кнопка «Назад»
│   │   └── onboarding/
│   │       ├── page.tsx                 # Шаг 0: выбор ниши или автоматический редирект на текущий шаг
│   │       └── [niche]/
│   │           └── [step]/
│   │               └── page.tsx         # Динамические шаги по нише
│   │           # Компоненты шагов (private, префикс _):
│   │       └── _steps/
│   │           ├── realty/
│   │           │   ├── Step1KrishaUrl.tsx
│   │           │   ├── Step2ConfirmObjects.tsx
│   │           │   ├── Step3ConnectChannel.tsx
│   │           │   ├── Step4QualifySettings.tsx
│   │           │   ├── Step5Calendar.tsx
│   │           │   └── Step6TestBot.tsx
│   │           ├── auto/
│   │           │   ├── Step1SubSegment.tsx
│   │           │   ├── Step1aKolesaUrl.tsx
│   │           │   ├── Step1bPriceList.tsx
│   │           │   ├── Step2ConnectChannel.tsx
│   │           │   ├── Step3BookingRules.tsx
│   │           │   └── Step4TestBot.tsx
│   │           └── calendar/
│   │               ├── Step1SubVertical.tsx
│   │               ├── Step2ConnectCalendar.tsx
│   │               ├── Step3Messengers.tsx
│   │               └── Step4TestBot.tsx
│   │
│   ├── (dashboard)/                     # Группа: дашборд — app.kvik.kz/dashboard
│   │   ├── layout.tsx                   # Sidebar + Topbar layout
│   │   └── dashboard/
│   │       ├── page.tsx                 # Главная: ключевые метрики
│   │       ├── inbox/
│   │       │   └── page.tsx            # Единый чат-инбокс
│   │       ├── leads/
│   │       │   ├── page.tsx            # CRM-таблица лидов
│   │       │   └── [id]/page.tsx       # Карточка лида
│   │       ├── analytics/
│   │       │   └── page.tsx
│   │       ├── objects/                 # [realty only]
│   │       │   └── page.tsx
│   │       ├── catalog/                 # [auto only]
│   │       │   └── page.tsx
│   │       ├── schedule/               # [auto / calendar only]
│   │       │   └── page.tsx
│   │       ├── settings/
│   │       │   ├── page.tsx            # Бот / база знаний
│   │       │   └── team/page.tsx       # Доступы сотрудников
│   │       └── billing/
│   │           └── page.tsx
│   │
│   ├── api/                             # Next.js Route Handlers (BFF / Proxy)
│   │   ├── auth/
│   │   │   ├── login/route.ts           # POST → бекенд /auth/login → вернуть { user }, получить access token
│   │   │   ├── register/route.ts        # POST → бекенд /auth/register
│   │   │   ├── logout/route.ts          # POST → бекенд /auth/logout → очистить refresh cookie
│   │   │   ├── refresh/route.ts         # POST → бекенд /auth/refresh → обновить access token в store
│   │   │   └── me/route.ts              # GET  → бекенд /auth/me → текущий user (SSR guard)
│   │   ├── onboarding/
│   │   │   ├── state/route.ts           # GET  → бекенд getState(workspaceId)
│   │   │   ├── parse-krisha/route.ts    # POST → запуск асинхронной задачи парсинга { jobId }
│   │   │   ├── parse-kolesa/route.ts    # POST → запуск асинхронной задачи парсинга { jobId }
│   │   │   ├── parse-status/route.ts   # GET  → проверка статуса задачи { status, progress, data }
│   │   │   ├── progress/route.ts        # POST → сохранение прогресса шага
│   │   │   └── complete/route.ts        # POST → завершение онбординга
│   │   └── [proxy]/
│   │       └── route.ts                # Универсальный прокси с token injection
│   │
│   ├── globals.css
│   └── layout.tsx                      # Root layout: провайдеры (Zustand, SWR), шрифты
│
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   └── ProgressBar.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── OnboardingProgress.tsx
│   └── shared/
│       ├── NicheIcon.tsx
│       └── ChannelBadge.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts                   # Axios instance (interceptors: inject token, 401 → refresh)
│   │   ├── auth.ts                     # Функции: login(), register(), logout(), getMe()
│   │   ├── onboarding.ts               # getState(), parseKrisha(), checkParseStatus(), updateProgress()
│   │   └── dashboard.ts
│   └── utils/
│       ├── niche.ts                    # getLabel(), getSteps(), getIcon() по niche_profile
│       └── format.ts                   # Форматирование сумм KZT, дат
│
├── types/
│   ├── niche.ts                        # NicheProfile, OnboardingStep
│   ├── auth.ts                         # User, AuthResponse, TokenPayload
│   ├── lead.ts                         # Lead, Conversation
│   └── api.ts                          # ApiResponse<T>, ApiError
│
├── hooks/
│   ├── useAuth.ts                      # Текущий user из Zustand + хелперы
│   ├── useOnboarding.ts                # Состояние + навигация wizard
│   └── useNicheConfig.ts               # Конфиг виджетов/сайдбара по niche_profile
│
├── store/
│   ├── auth.store.ts                   # { user, accessToken, setTokens, clearAuth }
│   └── onboarding.store.ts             # { niche, step, data, actions }
│
├── middleware.ts                        # Auth guard + subdomain routing
│
├── dev_docs/
│   ├── Product Architecture.md
│   └── Kickstart.md
│
└── public/
    └── images/niche/
```

---

## 🔐 Часть 2 — Auth, Токены и Axios Proxy

### 2.1 Стратегия токенов (согласовано с бекендом)

Бекенд использует схему **JWT Access + Refresh Token (HttpOnly Cookie)**:

| Токен | Срок | Где хранится | Кто управляет |
|:------|:-----|:-------------|:--------------|
| **Access Token** | 15 мин | **Zustand store** (только в памяти JS) | Фронтенд: вставляет в каждый запрос через Axios interceptor |
| **Refresh Token** | 7 дней | **HttpOnly Cookie** (ставится бекендом) | Браузер: уходит автоматически на `/auth/refresh` при `withCredentials: true` |
| **User Info** | — | **Zustand store** | Фронтенд: заполняется из ответа `/auth/me` или `/auth/login` |

> ⚠️ **Access Token НИКОГДА не хранить в `localStorage` или Cookie** — только в памяти (Zustand). При перезагрузке страницы фронтенд тихо вызывает `/api/auth/refresh` для получения нового access token из refresh cookie.

### 2.2 Эндпоинты бекенда (согласовано)

```
POST /auth/register   → { user, access_token, expires_in: 900 } + Set-Cookie: refresh_token (HttpOnly)
POST /auth/login      → { user, access_token, expires_in: 900 } + Set-Cookie: refresh_token (HttpOnly)
POST /auth/refresh    → { access_token, expires_in: 900 }  (refresh cookie уходит автоматически)
POST /auth/logout     → очистка refresh_token в БД и удаление cookie
GET  /auth/me         → { user }  (требует JWT guard)

Публичные маршруты бекенда (@Public):
  POST /auth/register, /auth/login, /auth/refresh, /auth/logout
  POST /webhooks/whatsapp, /webhooks/instagram
  GET  /health
Всё остальное — требует JWT.
```

### 2.3 Поток авторизации и онбординга

```
Регистрация:
  1. Юзер на app.kvik.kz/register → вводит email + password
  2. POST /api/auth/register → бекенд создаёт аккаунт (ниши у юзера пока нет!)
  3. Бекенд возвращает { user, access_token } + Set-Cookie: refresh_token
  4. Фронтенд сохраняет access_token в Zustand
  5. Автоматический редирект → app.kvik.kz/onboarding (так как ниша ещё не выбрана)

Логин существующего пользователя:
  1. Юзер на app.kvik.kz/login → вводит credentials
  2. POST /api/auth/login → бекенд отдаёт { user, access_token }
  3. Фронтенд проверяет статус онбординга через GET /api/onboarding/state ( getState() ):
     - Если state === 'DONE' → редирект на /dashboard
     - Если state !== 'DONE' → редирект на нужный шаг /onboarding/...
```

### 2.4 Axios Client — interceptors

```ts
// lib/api/client.ts
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

export const apiClient = axios.create({
  baseURL: '/api',            // Всё идёт через Next.js proxy
  withCredentials: true,      // Refresh cookie уходит автоматически на /auth/refresh
})

// Вставляем access token в каждый запрос
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 401 → тихий refresh → retry
let isRefreshing = false
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      if (!isRefreshing) {
        isRefreshing = true
        try {
          const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
          useAuthStore.getState().setAccessToken(data.access_token)
        } finally {
          isRefreshing = false
        }
      }
      return apiClient(original)
    }
    return Promise.reject(error)
  }
)
```

### 2.5 Next.js Route Handler как BFF Proxy

```ts
// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const res = await fetch(`${process.env.BACKEND_URL}/auth/refresh`, {
    method: 'POST',
    headers: { Cookie: request.headers.get('cookie') ?? '' },
  })
  const data = await res.json()

  const response = NextResponse.json(data, { status: res.status })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) response.headers.set('set-cookie', setCookie)
  return response
}
```

### 2.6 Next.js Middleware — Auth Guard

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') ?? ''
  const isApp = hostname.startsWith('app.')

  // app.kvik.kz/ → /dashboard
  if (isApp && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || !isApp) {
    return NextResponse.next()
  }

  // Защищённые пути (/dashboard, /onboarding): проверяем наличие refresh cookie
  const hasRefreshCookie = request.cookies.has('refresh_token')

  if (!hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|api).*)'],
}
```

---

## 🧭 Часть 3 — Страницы Auth и Онбординг

### 3.1 Состояния Онбординга (Onboarding State Machine)

На бекенде статус онбординга вычисляется функцией `getState(workspaceId)`:

```ts
export type OnboardingStepState =
  | 'SELECT_NICHE'           // Ниша не выбрана → /onboarding
  | 'DATA_SOURCE'            // Нет базы данных → /onboarding/[niche]/1 (Парсинг Krisha/Kolesa)
  | 'CONNECT_CHANNEL'        // Нет мессенджера → /onboarding/[niche]/3 (WhatsApp/IG)
  | 'QUALIFICATION'          // Нет правил ИИ → /onboarding/[niche]/4
  | 'COMPLETE'               // Финальный тест-бот → /onboarding/[niche]/6
  | 'DONE'                   // Всё заполнено и бот активен → /dashboard
```

#### Правило перенаправления:
Если авторизованный пользователь переходит на `/onboarding`, фронтенд запрашивает `GET /api/onboarding/state`:
- Если `state === 'DONE'` → мгновенный редирект на `/dashboard`.
- Если `state !== 'DONE'` → автоматический переход на соответствующий незавершённый шаг (например, если у пользователя застряло на `CONNECT_CHANNEL`, открыть сразу Шаг 3 подключения каналов).

---

### 3.2 Почему скрейпинг Krisha / Kolesa делается АСИНХРОННО (Async Jobs)

#### ❓ Что значит асинхронный парсинг и почему он лучше/быстрее?

* **Синхронный подход (ПЛОХО):**
  Пользователь нажимает «Спарсить Krisha.kz» → Браузер делает `POST /api/parse` → Бекенд начинает скрейпить 50 объектов на месте → Соединение висит в ожидании **30–60 секунд** → Браузер показывает застывший spinner → Высокий риск HTTP Timeout (504 Gateway Timeout) в NGINX/Vercel → Потеря доверия юзера.

* **Асинхронный подход с очередью (ПРАВИЛЬНО):**
  1. Пользователь вводит ссылку на Krisha/Kolesa → нажатие кнопки.
  2. `POST /api/onboarding/parse-krisha` сразу (за **50 миллисекунд**) возвращает `202 Accepted` и `{ jobId: "task_9981" }`.
  3. Бекенд кладёт задачу в фоновую очередь (BullMQ/Redis), где её безопасно выполняет фоновый воркер с парсером.
  4. Фронтенд показывает красивые анимированные карточки-скелетоны и делает **Polling** (запрос `GET /api/onboarding/parse-status?jobId=task_9981` каждые 2 секунды) или получает прогресс по WebSocket/SSE.
  5. UI сразу показывает прогресс в реальном времени: *«Спарсено 12 из 40 объектов...»*.
  6. После завершения задачи фронтенд отображает готовый сет объектов.

> **Выгода для UX:** Страница не лагает, веб-соединения не рвутся по таймауту, пользователь видит живой процесс с прогресс-баром.

---

## ✅ Чеклист реализации

### Блок 1 — Базовая настройка

- [x] Установить зависимости: `zustand`, `axios`, `swr`, `zod`, `clsx`
- [x] Настроить `tsconfig.json`: path aliases `@/components`, `@/lib`, `@/types`, `@/store`, `@/hooks`
- [x] Создать `.env.local`: `BACKEND_URL`, `NEXT_PUBLIC_APP_DOMAIN`
- [x] Создать `.env.example` с описанием всех переменных
- [x] Создать базовую структуру папок (пустые placeholder файлы)
- [x] Создать `types/auth.ts`, `types/niche.ts`, `types/lead.ts`, `types/api.ts`

### Блок 2 — Dev-окружение (subdomain локально)

- [x] Добавить в Windows `hosts` файл: `127.0.0.1 app.localhost`
- [x] Настроить `next.config.ts`: в dev пробрасывать `app.localhost:3000` как `app.*`
- [x] Проверить: `http://app.localhost:3000/login` работает отдельно от `http://localhost:3000`

### Блок 3 — Auth Store + Axios Client

- [x] `store/auth.store.ts` — `{ user, accessToken, setTokens, setUser, clearAuth }`
- [x] `lib/api/client.ts` — Axios instance, baseURL=`/api`, `withCredentials: true`
- [x] Axios request interceptor: вставляет `Authorization: Bearer <accessToken>`
- [x] Axios response interceptor: 401 → POST `/api/auth/refresh` → retry original
- [x] Логика "silent refresh при старте": при монтировании root layout → если `accessToken` null → POST `/api/auth/refresh`
- [x] `hooks/useAuth.ts` — `{ user, isLoading, isAuthenticated, logout }`

### Блок 4 — Next.js API Routes (Auth & Onboarding BFF)

- [x] `app/api/auth/login/route.ts` — проксирует login, передаёт Set-Cookie
- [x] `app/api/auth/register/route.ts` — регистрация без ниши
- [x] `app/api/auth/logout/route.ts` — сброс cookie
- [x] `app/api/auth/refresh/route.ts` — ротация access token
- [x] `app/api/auth/me/route.ts` — получение профиля
- [ ] `app/api/onboarding/state/route.ts` — GET `getState()`
- [ ] `app/api/onboarding/parse-krisha/route.ts` — POST { url } → возвращает `{ jobId }`
- [ ] `app/api/onboarding/parse-status/route.ts` — GET `{ jobId }` → status polling
- [x] `app/api/[...proxy]/route.ts` — универсальный прокси

### Блок 5 — Middleware

- [ ] `middleware.ts` — определение `isApp` по hostname
- [ ] Редирект `app.kvik.kz/` → `/dashboard`
- [ ] Публичные пути (`/login`, `/register`) — пропускать
- [ ] Защищённые пути (`/dashboard`, `/onboarding`) — проверить `refresh_token` cookie
- [ ] Тест: без cookie → `/dashboard` → редирект `/login?from=/dashboard` ✓

### Блок 6 — Auth Pages (UI)

- [ ] `app/(auth)/layout.tsx` — центрированный layout с логотипом
- [ ] `app/(auth)/login/page.tsx`:
  - Форма: email + password
  - При успехе: проверка `getState()` → редирект на `/dashboard` или незавершённый шаг онбординга
- [ ] `app/(auth)/register/page.tsx`:
  - Форма: email + password
  - При успехе: редирект на `/onboarding` (Шаг 0: выбор ниши)

### Блок 7 — Онбординг (UI + Async Parsing Flow)

- [ ] `app/(onboarding)/layout.tsx` — логотип + `OnboardingProgress` + кнопка «Назад»
- [ ] `app/(onboarding)/onboarding/page.tsx` — вызов `getState()`: если `'DONE'` → `/dashboard`, иначе перенаправить на соответствующий шаг
- [ ] `store/onboarding.store.ts`
- [ ] **Ветка Realty** (шаги 1–6):
  - [ ] `Step1KrishaUrl.tsx` — ввод ссылки → POST `parse-krisha` → получить `jobId` → запустить polling `parse-status`
  - [ ] `Step2ConfirmObjects.tsx` — отобразить спарсенные объекты из `jobId` + чекбоксы подтверждения
  - [ ] `Step3ConnectChannel.tsx` — WhatsApp / Instagram / Telegram
  - [ ] `Step4QualifySettings.tsx` — форма квалификации ИИ
  - [ ] `Step5Calendar.tsx` — Google Calendar + Live Overflow
  - [ ] `Step6TestBot.tsx` — тест-чат
- [ ] **Ветка Auto** (шаги 1–4, аналогично через Async Job для Kolesa.kz)
- [ ] **Ветка Calendar** (шаги 1–4)
- [ ] Финализация: `POST /api/onboarding/complete` → редирект `/dashboard`

### Блок 8 — Дашборд (скелет)

- [ ] `app/(dashboard)/layout.tsx` — Sidebar + Topbar + silent refresh при монтировании
- [ ] Server Component guard в layout: вызов `/api/auth/me`, если 401 → redirect `/login`
- [ ] `components/layout/Sidebar.tsx` — навигация по `niche_profile`
- [ ] `app/(dashboard)/dashboard/page.tsx` — дашборд по нише

---

## 📝 Все открытые вопросы ЗАКРЫТЫ ✅

| # | Вопрос | Ответ / Техническое решение |
|:--|:-------|:----------------------------|
| 1 | **JWT vs Opaque Token** | ✅ **JWT Access (15 мин) + Refresh Cookie (7 дней)** |
| 2 | **Хранение Access Token** | ✅ **Zustand store (в памяти)** — без localStorage / cookies |
| 3 | **Домен Auth & Onboarding** | ✅ **`app.kvik.kz/login`, `/register`, `/onboarding`** |
| 4 | **Парсинг Krisha / Kolesa** | ✅ **Async Jobs (BullMQ)**: POST возвращает `{ jobId }`, фронт делает polling статуса |
| 5 | **Повторный заход на `/onboarding`** | ✅ **Проверка через `getState()`**: если `'DONE'` → редирект в `/dashboard`, иначе продолжить незавершённый шаг |
| 6 | **Ниша при регистрации** | ✅ **Регистрация без ниши**. Ниша выбирается на Шаге 0 онбординга (`SELECT_NICHE`) |
