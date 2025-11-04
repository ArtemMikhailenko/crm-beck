# Руководство по настройке и развертыванию фронтенда

## 🚀 Быстрый старт

### 1. Создание Next.js проекта

```bash
# Создание нового проекта
npx create-next-app@latest personnel-management-frontend --typescript --tailwind --eslint --app

# Переход в папку проекта
cd personnel-management-frontend

# Установка дополнительных зависимостей
npm install @tanstack/react-query axios react-hook-form react-hot-toast @headlessui/react @heroicons/react
```

### 2. Структура проекта

```
src/
├── app/                    # Next.js 13+ App Router
│   ├── layout.tsx         # Главный layout
│   ├── page.tsx           # Главная страница
│   ├── login/             # Страница входа
│   ├── users/             # Страницы пользователей
│   └── companies/         # Страницы компаний
├── components/            # React компоненты
│   ├── ui/               # UI компоненты
│   ├── forms/            # Формы
│   ├── layout/           # Layout компоненты
│   └── pages/            # Компоненты страниц
├── hooks/                # Custom hooks
├── services/             # API сервисы
├── types/                # TypeScript типы
├── utils/                # Утилиты
├── contexts/             # React контексты
└── styles/               # Стили
```

### 3. Настройка окружения

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME=Personnel Management System
NEXT_PUBLIC_VERSION=1.0.0
```

### 4. Базовая настройка App Router

```tsx
// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Personnel Management System',
  description: 'Система управления персоналом',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

```tsx
// app/providers.tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '../contexts/AuthContext'
import { ToastProvider } from '../contexts/ToastContext'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          cacheTime: 10 * 60 * 1000, // 10 minutes
        },
      },
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### 5. Главная страница с защищенным контентом

```tsx
// app/page.tsx
'use client'

import { useAuth } from '../contexts/AuthContext'
import { Dashboard } from '../components/dashboard/Dashboard'
import { LoginForm } from '../components/auth/LoginForm'

export default function HomePage() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <LoginForm />
        </div>
      </div>
    )
  }

  return <Dashboard />
}
```

## 🔐 Компоненты аутентификации

### Форма входа

```tsx
// components/auth/LoginForm.tsx
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { apiClient } from '../../lib/api-client'
import { useToast } from '../../contexts/ToastContext'

interface LoginForm {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>()
  const { login } = useAuth()
  const { showError, showSuccess } = useToast()

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await apiClient.post('/auth/login', data)
      await login(response.data.token)
      showSuccess('Добро пожаловать!')
    } catch (error: any) {
      showError('Ошибка входа', error.response?.data?.message || 'Неверные учетные данные')
    }
  }

  return (
    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход в систему
        </h2>
      </div>

      <form className="space-y-6 mt-8" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <div className="mt-1">
            <input
              {...register('email', {
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Неверный формат email'
                }
              })}
              type="email"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Пароль
          </label>
          <div className="mt-1">
            <input
              {...register('password', {
                required: 'Пароль обязателен',
                minLength: {
                  value: 6,
                  message: 'Пароль должен быть не менее 6 символов'
                }
              })}
              type="password"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ваш пароль"
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

### Защищенный маршрут

```tsx
// components/auth/ProtectedRoute.tsx
'use client'

import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginForm } from './LoginForm'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  fallback
}) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <LoginForm />
        </div>
      </div>
    )
  }

  // Проверка разрешений (если нужно)
  if (requiredPermissions.length > 0) {
    const userPermissions = user.roles?.flatMap(role => role.permissions || []) || []
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.some(userPerm => userPerm.key === permission)
    )

    if (!hasRequiredPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Доступ запрещен</h1>
            <p className="text-gray-600 mt-2">У вас нет прав для просмотра этой страницы</p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
```

## 📦 Готовые страницы

### Страница пользователей

```tsx
// app/users/page.tsx
'use client'

import React from 'react'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { Layout } from '../../components/layout/Layout'
import { UsersPage } from '../../components/pages/UsersPage'

export default function Users() {
  return (
    <ProtectedRoute requiredPermissions={['users:view']}>
      <Layout>
        <UsersPage />
      </Layout>
    </ProtectedRoute>
  )
}
```

### Страница компаний

```tsx
// app/companies/page.tsx
'use client'

import React from 'react'
import { ProtectedRoute } from '../../components/auth/ProtectedRoute'
import { Layout } from '../../components/layout/Layout'
import { CompaniesPage } from '../../components/pages/CompaniesPage'

export default function Companies() {
  return (
    <ProtectedRoute requiredPermissions={['companies:view']}>
      <Layout>
        <CompaniesPage />
      </Layout>
    </ProtectedRoute>
  )
}
```

## 🎨 Настройка Tailwind CSS

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

## 🛠️ Конфигурация TypeScript

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/types/*": ["./src/types/*"],
      "@/services/*": ["./src/services/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 📋 Скрипты package.json

```json
{
  "name": "personnel-management-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@headlessui/react": "^1.7.15",
    "@heroicons/react": "^2.0.18",
    "@tanstack/react-query": "^4.29.0",
    "axios": "^1.4.0",
    "next": "13.4.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-hook-form": "^7.44.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.3",
    "@tailwindcss/typography": "^0.5.9",
    "@types/node": "20.2.0",
    "@types/react": "18.2.0",
    "@types/react-dom": "18.2.0",
    "autoprefixer": "10.4.14",
    "eslint": "8.40.0",
    "eslint-config-next": "13.4.0",
    "postcss": "8.4.23",
    "prettier": "^2.8.8",
    "tailwindcss": "3.3.2",
    "typescript": "5.0.4"
  }
}
```

## 🚀 Развертывание

### 1. Vercel (рекомендуется)

```bash
# Установка Vercel CLI
npm i -g vercel

# Деплой
vercel

# Настройка переменных окружения в Vercel Dashboard
# NEXT_PUBLIC_API_URL = https://your-api-domain.com
```

### 2. Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:4001
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    external: true
```

### 3. Nginx конфигурация

```nginx
# nginx.conf
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files caching
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:3000;
        add_header X-Cache-Status $upstream_cache_status;
    }
}
```

## 🔧 Оптимизация производительности

### 1. Мемоизация компонентов

```tsx
// Используйте React.memo для компонентов
export const UserCard = React.memo<UserCardProps>(({ user }) => {
  // component code
})

// Используйте useMemo для вычислений
const filteredUsers = useMemo(() => {
  return users.filter(user => user.status === 'active')
}, [users])

// Используйте useCallback для функций
const handleUserClick = useCallback((userId: string) => {
  navigate(`/users/${userId}`)
}, [navigate])
```

### 2. Lazy loading

```tsx
// Lazy loading компонентов
const UserDetails = lazy(() => import('./UserDetails'))
const CompanyForm = lazy(() => import('./CompanyForm'))

// Использование с Suspense
<Suspense fallback={<div>Загрузка...</div>}>
  <UserDetails userId={userId} />
</Suspense>
```

### 3. Оптимизация запросов

```tsx
// Prefetching данных
const queryClient = useQueryClient()

const handleUserHover = (userId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['user', userId],
    queryFn: () => UsersService.getUserById(userId)
  })
}

// Infinite queries для больших списков
const {
  data,
  fetchNextPage,
  hasNextPage,
  isLoading
} = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: ({ pageParam = 1 }) => UsersService.getUsers({ page: pageParam }),
  getNextPageParam: (lastPage) => lastPage.nextPage
})
```

## 📊 Мониторинг и аналитика

### 1. Добавление Sentry

```bash
npm install @sentry/nextjs
```

```js
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

### 2. Добавление Google Analytics

```tsx
// components/Analytics.tsx
import Script from 'next/script'

export const Analytics = () => {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
        `}
      </Script>
    </>
  )
}
```

Эта документация предоставляет полное руководство по созданию, настройке и развертыванию фронтенда для системы управления персоналом! 🚀