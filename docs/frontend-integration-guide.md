# API Документация для фронтенда - Управление пользователями и субподрядчиками

## 🚀 Базовая настройка

### Конфигурация API клиента

```typescript
// config/api.ts
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001',
  timeout: 10000,
}

// lib/api-client.ts
import axios from 'axios'

export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor для автоматического добавления токена
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

## 👥 Управление пользователями

### TypeScript типы

```typescript
// types/user.ts
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  displayName: string
  phone?: string
  avatarUrl?: string
  status: string
  timezone?: string
  companyId?: string
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  company?: {
    id: string
    name: string
    type: 'CONTRACTOR' | 'CLIENT'
  }
  roles?: Array<{
    id: string
    name: string
    description?: string
  }>
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  displayName: string
  phone?: string
  timezone?: string
  companyId?: string
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  timezone?: string
  companyId?: string
  status?: string
}

export interface UserSearchParams {
  search?: string
  companyId?: string
  status?: string
  role?: string
  page?: number
  limit?: number
}

export interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### API методы для пользователей

```typescript
// services/users.service.ts
import { apiClient } from '../lib/api-client'

export class UsersService {
  // Получить список пользователей с фильтрацией и пагинацией
  static async getUsers(params: UserSearchParams = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/users?${searchParams}`)
    return response.data
  }

  // Получить пользователя по ID
  static async getUserById(id: string): Promise<User> {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  }

  // Создать нового пользователя (только для админов)
  static async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await apiClient.post('/users', userData)
    return response.data
  }

  // Обновить пользователя
  static async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch(`/users/${id}`, userData)
    return response.data
  }

  // Удалить пользователя
  static async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`)
  }

  // Назначить роли пользователю
  static async assignRoles(userId: string, roleIds: string[]): Promise<User> {
    const response = await apiClient.patch(`/users/${userId}/roles`, { roleIds })
    return response.data
  }

  // Получить профиль текущего пользователя
  static async getCurrentProfile(): Promise<User> {
    const response = await apiClient.get('/users/profile')
    return response.data
  }

  // Обновить свой профиль
  static async updateProfile(userData: Partial<UpdateUserRequest>): Promise<User> {
    const response = await apiClient.put('/users/profile', userData)
    return response.data
  }

  // Изменить пароль
  static async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.put('/users/password', { oldPassword, newPassword })
  }
}
```

### React хуки для пользователей

```typescript
// hooks/useUsers.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UsersService } from '../services/users.service'
import { toast } from 'react-hot-toast'

export const useUsers = (params: UserSearchParams = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => UsersService.getUsers(params),
    keepPreviousData: true,
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => UsersService.getUserById(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: UsersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Пользователь успешно создан')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания пользователя')
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateUserRequest) =>
      UsersService.updateUser(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['users'])
      queryClient.invalidateQueries(['user', id])
      toast.success('Пользователь обновлён')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления пользователя')
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: UsersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Пользователь удалён')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления пользователя')
    },
  })
}
```

### Компонент списка пользователей

```tsx
// components/users/UsersList.tsx
import React, { useState } from 'react'
import { useUsers, useDeleteUser } from '../../hooks/useUsers'
import { UserSearchParams } from '../../types/user'

export const UsersList: React.FC = () => {
  const [searchParams, setSearchParams] = useState<UserSearchParams>({
    page: 1,
    limit: 10,
  })

  const { data, isLoading, error } = useUsers(searchParams)
  const deleteUserMutation = useDeleteUser()

  const handleSearch = (search: string) => {
    setSearchParams(prev => ({ ...prev, search, page: 1 }))
  }

  const handleFilterChange = (filters: Partial<UserSearchParams>) => {
    setSearchParams(prev => ({ ...prev, ...filters, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }))
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  if (isLoading) return <div>Загрузка...</div>
  if (error) return <div>Ошибка загрузки пользователей</div>

  return (
    <div className="space-y-6">
      {/* Поиск и фильтры */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Поиск пользователей..."
          className="flex-1 px-4 py-2 border rounded-lg"
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>

      {/* Список пользователей */}
      <div className="grid gap-4">
        {data?.users.map((user) => (
          <div key={user.id} className="p-4 border rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{user.displayName}</h3>
              <p className="text-gray-600">{user.email}</p>
              {user.company && (
                <p className="text-sm text-gray-500">{user.company.name}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-500 text-white rounded">
                Редактировать
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Пагинация */}
      {data?.pagination && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.pagination.totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`px-3 py-1 rounded ${
                data.pagination.page === i + 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 🏢 Управление субподрядчиками (компаниями)

### TypeScript типы

```typescript
// types/company.ts
export interface Company {
  id: string
  name: string
  type: 'CONTRACTOR' | 'CLIENT'
  description?: string
  website?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  vatNumber?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  contacts?: CompanyContact[]
  summary?: {
    totalUsers: number
    activeProjects: number
    totalRevenue: number
  }
}

export interface CompanyContact {
  id: string
  companyId: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position?: string
  isPrimary: boolean
}

export interface CreateCompanyRequest {
  name: string
  type: 'CONTRACTOR' | 'CLIENT'
  description?: string
  website?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  vatNumber?: string
}

export interface UpdateCompanyRequest {
  name?: string
  description?: string
  website?: string
  address?: string
  city?: string
  postalCode?: string
  country?: string
  vatNumber?: string
  isActive?: boolean
}

export interface CreateContactRequest {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  position?: string
  isPrimary?: boolean
}

export interface CompanySearchParams {
  search?: string
  type?: 'CONTRACTOR' | 'CLIENT'
  isActive?: boolean
  page?: number
  limit?: number
}
```

### API методы для компаний

```typescript
// services/companies.service.ts
import { apiClient } from '../lib/api-client'

export class CompaniesService {
  // Получить список компаний
  static async getCompanies(params: CompanySearchParams = {}): Promise<{
    companies: Company[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const response = await apiClient.get(`/companies?${searchParams}`)
    return response.data
  }

  // Получить компанию по ID
  static async getCompanyById(id: string): Promise<Company> {
    const response = await apiClient.get(`/companies/${id}`)
    return response.data
  }

  // Создать новую компанию
  static async createCompany(companyData: CreateCompanyRequest): Promise<Company> {
    const response = await apiClient.post('/companies', companyData)
    return response.data
  }

  // Обновить компанию
  static async updateCompany(id: string, companyData: UpdateCompanyRequest): Promise<Company> {
    const response = await apiClient.patch(`/companies/${id}`, companyData)
    return response.data
  }

  // Удалить компанию
  static async deleteCompany(id: string): Promise<void> {
    await apiClient.delete(`/companies/${id}`)
  }

  // Получить сводку по компании
  static async getCompanySummary(id: string): Promise<Company['summary']> {
    const response = await apiClient.get(`/companies/${id}/summary`)
    return response.data
  }

  // Добавить контакт к компании
  static async addContact(companyId: string, contactData: CreateContactRequest): Promise<CompanyContact> {
    const response = await apiClient.post(`/companies/${companyId}/contacts`, contactData)
    return response.data
  }

  // Обновить контакт
  static async updateContact(contactId: string, contactData: Partial<CreateContactRequest>): Promise<CompanyContact> {
    const response = await apiClient.patch(`/companies/contacts/${contactId}`, contactData)
    return response.data
  }

  // Удалить контакт
  static async deleteContact(contactId: string): Promise<void> {
    await apiClient.delete(`/companies/contacts/${contactId}`)
  }
}
```

### React хуки для компаний

```typescript
// hooks/useCompanies.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CompaniesService } from '../services/companies.service'
import { toast } from 'react-hot-toast'

export const useCompanies = (params: CompanySearchParams = {}) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => CompaniesService.getCompanies(params),
    keepPreviousData: true,
  })
}

export const useCompany = (id: string) => {
  return useQuery({
    queryKey: ['company', id],
    queryFn: () => CompaniesService.getCompanyById(id),
    enabled: !!id,
  })
}

export const useCreateCompany = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: CompaniesService.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries(['companies'])
      toast.success('Компания успешно создана')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка создания компании')
    },
  })
}

export const useUpdateCompany = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateCompanyRequest) =>
      CompaniesService.updateCompany(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries(['companies'])
      queryClient.invalidateQueries(['company', id])
      toast.success('Компания обновлена')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка обновления компании')
    },
  })
}

export const useDeleteCompany = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: CompaniesService.deleteCompany,
    onSuccess: () => {
      queryClient.invalidateQueries(['companies'])
      toast.success('Компания удалена')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка удаления компании')
    },
  })
}

export const useAddContact = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ companyId, ...data }: { companyId: string } & CreateContactRequest) =>
      CompaniesService.addContact(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries(['company', companyId])
      toast.success('Контакт добавлен')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ошибка добавления контакта')
    },
  })
}
```

### Компонент создания компании

```tsx
// components/companies/CreateCompanyForm.tsx
import React from 'react'
import { useForm } from 'react-hook-form'
import { useCreateCompany } from '../../hooks/useCompanies'
import { CreateCompanyRequest } from '../../types/company'

export const CreateCompanyForm: React.FC<{
  onSuccess?: () => void
}> = ({ onSuccess }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateCompanyRequest>()
  const createCompanyMutation = useCreateCompany()

  const onSubmit = async (data: CreateCompanyRequest) => {
    try {
      await createCompanyMutation.mutateAsync(data)
      onSuccess?.()
    } catch (error) {
      // Ошибка обрабатывается в хуке
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Название компании *
        </label>
        <input
          {...register('name', { required: 'Название обязательно' })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="ООО Стройкомпания"
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Тип компании *
        </label>
        <select
          {...register('type', { required: 'Тип обязателен' })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Выберите тип</option>
          <option value="CONTRACTOR">Субподрядчик</option>
          <option value="CLIENT">Заказчик</option>
        </select>
        {errors.type && (
          <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Описание
        </label>
        <textarea
          {...register('description')}
          className="w-full px-3 py-2 border rounded-lg"
          rows={3}
          placeholder="Краткое описание деятельности компании"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Веб-сайт
          </label>
          <input
            {...register('website')}
            type="url"
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            НДС номер
          </label>
          <input
            {...register('vatNumber')}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="12345678"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Адрес
        </label>
        <input
          {...register('address')}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="ул. Примерная, д. 123"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Город
          </label>
          <input
            {...register('city')}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Киев"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Почтовый индекс
          </label>
          <input
            {...register('postalCode')}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="01001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Страна
          </label>
          <input
            {...register('country')}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="Украина"
            defaultValue="Украина"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          className="px-4 py-2 text-gray-600 border rounded-lg"
          onClick={onSuccess}
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={createCompanyMutation.isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
        >
          {createCompanyMutation.isLoading ? 'Создание...' : 'Создать компанию'}
        </button>
      </div>
    </form>
  )
}
```

## 🔐 Обработка ошибок и аутентификации

### Обработка ошибок API

```typescript
// utils/error-handler.ts
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }
  
  switch (error.response?.status) {
    case 400:
      return 'Неверные данные запроса'
    case 401:
      return 'Необходима авторизация'
    case 403:
      return 'Доступ запрещён'
    case 404:
      return 'Ресурс не найден'
    case 409:
      return 'Конфликт данных'
    case 500:
      return 'Внутренняя ошибка сервера'
    default:
      return 'Произошла неизвестная ошибка'
  }
}
```

### Контекст аутентификации

```tsx
// contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '../types/user'
import { UsersService } from '../services/users.service'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      loadUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const loadUser = async () => {
    try {
      const userData = await UsersService.getCurrentProfile()
      setUser(userData)
    } catch (error) {
      localStorage.removeItem('authToken')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (token: string) => {
    localStorage.setItem('authToken', token)
    await loadUser()
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## 📱 Примеры использования

### Страница управления пользователями

```tsx
// pages/users/index.tsx
import React, { useState } from 'react'
import { UsersList } from '../../components/users/UsersList'
import { CreateUserForm } from '../../components/users/CreateUserForm'
import { Modal } from '../../components/ui/Modal'

export const UsersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление пользователями</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Добавить пользователя
        </button>
      </div>

      <UsersList />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создание нового пользователя"
      >
        <CreateUserForm
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
```

### Страница управления компаниями

```tsx
// pages/companies/index.tsx
import React, { useState } from 'react'
import { CompaniesList } from '../../components/companies/CompaniesList'
import { CreateCompanyForm } from '../../components/companies/CreateCompanyForm'
import { Modal } from '../../components/ui/Modal'

export const CompaniesPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление компаниями</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Добавить компанию
        </button>
      </div>

      <CompaniesList />

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создание новой компании"
      >
        <CreateCompanyForm
          onSuccess={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
```

## 🛠️ Дополнительные утилиты

### Валидация форм

```typescript
// utils/validation.ts
export const validationRules = {
  email: {
    required: 'Email обязателен',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Неверный формат email'
    }
  },
  password: {
    required: 'Пароль обязателен',
    minLength: {
      value: 8,
      message: 'Пароль должен быть не менее 8 символов'
    }
  },
  phone: {
    pattern: {
      value: /^[\+]?[1-9][\d]{0,15}$/,
      message: 'Неверный формат телефона'
    }
  }
}
```

### Форматирование данных

```typescript
// utils/formatters.ts
export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('ru-RU')
}

export const formatDateTime = (date: Date | string): string => {
  return new Date(date).toLocaleString('ru-RU')
}

export const formatUserName = (user: { firstName?: string; lastName?: string; displayName: string }): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  return user.displayName
}
```

## 🔧 Настройка окружения

### .env файл

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_APP_NAME=Personnel Management
```

### package.json зависимости

```json
{
  "dependencies": {
    "@tanstack/react-query": "^4.29.0",
    "axios": "^1.4.0",
    "react-hook-form": "^7.44.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

Эта документация покрывает все основные аспекты интеграции фронтенда с вашим API для управления пользователями и субподрядчиками. Используйте её как руководство для создания полнофункционального веб-интерфейса! 🚀