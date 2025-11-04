# Дополнительные компоненты и функции для фронтенда

## 🎨 UI Компоненты

### Универсальная таблица с данными

```tsx
// components/ui/DataTable.tsx
import React from 'react'

interface Column<T> {
  key: keyof T | string
  title: string
  render?: (value: any, record: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onRowClick?: (record: T) => void
  emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  onRowClick,
  emptyMessage = 'Нет данных'
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record) => (
            <tr
              key={record.id}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onRowClick?.(record)}
            >
              {columns.map((column) => {
                const value = column.key.includes('.')
                  ? column.key.split('.').reduce((obj, key) => obj?.[key], record)
                  : record[column.key as keyof T]

                return (
                  <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(value, record) : String(value || '')}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Фильтры для поиска

```tsx
// components/ui/SearchFilters.tsx
import React from 'react'
import { useDebounce } from '../../hooks/useDebounce'

interface FilterOption {
  label: string
  value: string
}

interface SearchFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters: Array<{
    key: string
    label: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }>
  onReset: () => void
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  searchValue,
  onSearchChange,
  filters,
  onReset
}) => {
  const debouncedSearch = useDebounce(searchValue, 300)

  React.useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="flex gap-4 items-end">
        {/* Поиск */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Поиск
          </label>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите текст для поиска..."
          />
        </div>

        {/* Фильтры */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {filter.label}
            </label>
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Кнопка сброса */}
        <button
          onClick={onReset}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Сбросить
        </button>
      </div>
    </div>
  )
}
```

### Компонент пагинации

```tsx
// components/ui/Pagination.tsx
import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: number
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = 5
}) => {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const half = Math.floor(showPageNumbers / 2)
    let start = Math.max(currentPage - half, 1)
    let end = Math.min(start + showPageNumbers - 1, totalPages)

    if (end - start + 1 < showPageNumbers) {
      start = Math.max(end - showPageNumbers + 1, 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Предыдущая
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Следующая
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Страница <span className="font-medium">{currentPage}</span> из{' '}
            <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            {/* Предыдущая страница */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              ←
            </button>

            {/* Первая страница */}
            {pageNumbers[0] > 1 && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  1
                </button>
                {pageNumbers[0] > 2 && (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    ...
                  </span>
                )}
              </>
            )}

            {/* Номера страниц */}
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                  pageNumber === currentPage
                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                    : 'text-gray-900'
                }`}
              >
                {pageNumber}
              </button>
            ))}

            {/* Последняя страница */}
            {pageNumbers[pageNumbers.length - 1] < totalPages && (
              <>
                {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                    ...
                  </span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Следующая страница */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              →
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
```

## 🎯 Продвинутые хуки

### Хук для debounce

```typescript
// hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

### Хук для локального хранилища

```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue]
}
```

### Хук для управления модальными окнами

```typescript
// hooks/useModal.ts
import { useState, useCallback } from 'react'

export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    isOpen,
    open,
    close,
    toggle
  }
}
```

## 📊 Компоненты для аналитики

### Карточка статистики

```tsx
// components/ui/StatCard.tsx
import React from 'react'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  loading?: boolean
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  change,
  loading
}) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}% за {change.period}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-gray-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
```

### Дашборд с основными метриками

```tsx
// components/dashboard/Dashboard.tsx
import React from 'react'
import { StatCard } from '../ui/StatCard'
import { useUsers } from '../../hooks/useUsers'
import { useCompanies } from '../../hooks/useCompanies'

export const Dashboard: React.FC = () => {
  const { data: usersData, isLoading: usersLoading } = useUsers()
  const { data: companiesData, isLoading: companiesLoading } = useCompanies()

  const stats = [
    {
      title: 'Всего пользователей',
      value: usersData?.pagination.total || 0,
      icon: '👥',
      loading: usersLoading
    },
    {
      title: 'Активных компаний',
      value: companiesData?.companies.filter(c => c.isActive).length || 0,
      icon: '🏢',
      loading: companiesLoading
    },
    {
      title: 'Субподрядчиков',
      value: companiesData?.companies.filter(c => c.type === 'CONTRACTOR').length || 0,
      icon: '🔧',
      loading: companiesLoading
    },
    {
      title: 'Заказчиков',
      value: companiesData?.companies.filter(c => c.type === 'CLIENT').length || 0,
      icon: '💼',
      loading: companiesLoading
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Дашборд</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Дополнительные виджеты */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentUsersWidget />
        <RecentCompaniesWidget />
      </div>
    </div>
  )
}

const RecentUsersWidget: React.FC = () => {
  const { data } = useUsers({ limit: 5 })

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Последние пользователи</h3>
      <div className="space-y-3">
        {data?.users.map((user) => (
          <div key={user.id} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
              {user.displayName.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user.displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const RecentCompaniesWidget: React.FC = () => {
  const { data } = useCompanies({ limit: 5 })

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Последние компании</h3>
      <div className="space-y-3">
        {data?.companies.map((company) => (
          <div key={company.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{company.name}</p>
              <p className="text-sm text-gray-500">
                {company.type === 'CONTRACTOR' ? 'Субподрядчик' : 'Заказчик'}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              company.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {company.isActive ? 'Активна' : 'Неактивна'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## 🔔 Уведомления и тосты

### Система уведомлений

```tsx
// components/ui/Toast.tsx
import React, { useEffect } from 'react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className={`p-4 rounded-lg border ${colors[type]} shadow-lg max-w-sm`}>
      <div className="flex items-start">
        <span className="mr-3 text-lg">{icons[type]}</span>
        <div className="flex-1">
          <h4 className="font-semibold">{title}</h4>
          {message && <p className="text-sm mt-1">{message}</p>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="ml-3 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    </div>
  )
}
```

### Контекст для уведомлений

```tsx
// contexts/ToastContext.tsx
import React, { createContext, useContext, useState } from 'react'
import { Toast, ToastProps } from '../components/ui/Toast'

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void
  showSuccess: (title: string, message?: string) => void
  showError: (title: string, message?: string) => void
  showWarning: (title: string, message?: string) => void
  showInfo: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const showSuccess = (title: string, message?: string) => {
    showToast({ type: 'success', title, message })
  }

  const showError = (title: string, message?: string) => {
    showToast({ type: 'error', title, message })
  }

  const showWarning = (title: string, message?: string) => {
    showToast({ type: 'warning', title, message })
  }

  const showInfo = (title: string, message?: string) => {
    showToast({ type: 'info', title, message })
  }

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      
      {/* Контейнер для тостов */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
```

## 📱 Адаптивный дизайн

### Responsive Layout

```tsx
// components/layout/Layout.tsx
import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-col bg-white">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

Эта дополнительная документация предоставляет готовые к использованию компоненты и продвинутые функции для создания полнофункционального фронтенда! 🎨