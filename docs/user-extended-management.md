# Расширенное управление пользователями - Документация для фронтенда

## Обзор

API предоставляет расширенные возможности управления профилями пользователей, включая:
- Управление ставками оплаты и рабочим расписанием
- Управление контактами пользователя
- Управление отпусками пользователя
- Настройки уведомлений

---

## 1. Управление ставками и расписанием

### PATCH /users/:id/rates

Обновление ставок оплаты и рабочего расписания пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Тело запроса:**
```typescript
interface UpdateUserRatesDto {
  ratePerHour?: number;           // Ставка за час (Rate per hour)
  ratePerLinearMeter?: number;    // Ставка за погонный метр (Cost per linear meter)
  ratePerM2?: number;              // Ставка за квадратный метр (Cost per m2)
  workTypes?: string[];            // Типы работ (Type of work) - например: ["Plumbing", "Spackle", "Tile"]
  workSchedule?: {                 // Рабочее расписание (Schedule)
    monday?: { start: string; end: string; };
    tuesday?: { start: string; end: string; };
    wednesday?: { start: string; end: string; };
    thursday?: { start: string; end: string; };
    friday?: { start: string; end: string; };
    saturday?: { start: string; end: string; };
    sunday?: { start: string; end: string; };
  };
}
```

**Пример UI:**
```
┌─────────────────────────────────────────────────────────┐
│ 💼 Rate and Salary                                  ⋯   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🕐 Type of work    Plumbing                             │
│ 🕐 Type of work    Spackle                              │
│ 🕐 Type of work    Tile                                 │
│                                                          │
│ Rate per hour      $77                                   │
│ Cost per linear meter  $48                              │
│ Cost per m2        $69                                   │
│                                                          │
│ 📅 Schedule                                              │
│ Mon. 8:00-18:00    Thurs. 8:00-18:00                    │
│ Tues. 8:00-18:00   Fri. 8:00-18:00                      │
│ Wed. 8:00-18:00    Sat. 8:00-18:00                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const updateUserRates = async (userId: string, data: UpdateUserRatesDto) => {
  const response = await axios.patch(`/users/${userId}/rates`, data);
  return response.data;
};

// Использование - пример с данными из UI
await updateUserRates('user123', {
  ratePerHour: 77,
  ratePerLinearMeter: 48,
  ratePerM2: 69,
  workTypes: ['Plumbing', 'Spackle', 'Tile'],
  workSchedule: {
    monday: { start: '08:00', end: '18:00' },
    tuesday: { start: '08:00', end: '18:00' },
    wednesday: { start: '08:00', end: '18:00' },
    thursday: { start: '08:00', end: '18:00' },
    friday: { start: '08:00', end: '18:00' },
    saturday: { start: '08:00', end: '18:00' }
    // Воскресенье не указано - выходной
  }
});
```

**React Query Hook:**
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateUserRates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserRatesDto }) => {
      const response = await axios.patch(`/users/${userId}/rates`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
};

// Использование в компоненте
const { mutate: updateRates, isPending } = useUpdateUserRates();

const handleSubmit = (data: UpdateUserRatesDto) => {
  updateRates({ userId: 'user123', data });
};
```

**Ответ:**
```typescript
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  ratePerHour: number;
  ratePerLinearMeter: number;
  ratePerM2: number;
  workTypes: string[];
  workSchedule: object;
  // ... другие поля пользователя
}
```

---

## 2. Управление контактами пользователя

### GET /users/:id/contacts

Получить все контакты пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Пример запроса:**
```typescript
const getUserContacts = async (userId: string) => {
  const response = await axios.get(`/users/${userId}/contacts`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUserContacts = (userId: string) => {
  return useQuery({
    queryKey: ['userContacts', userId],
    queryFn: () => getUserContacts(userId),
    enabled: !!userId,
  });
};

// Использование
const { data: contacts, isLoading } = useUserContacts('user123');
```

**Ответ:**
```typescript
interface UserContact {
  id: string;
  userId: string;
  name: string;              // Имя контакта
  phone?: string;            // Телефон
  email?: string;            // Email
  relation?: string;         // Отношение (друг, родственник, коллега)
  isPrimary: boolean;        // Основной контакт
  createdAt: string;
  updatedAt: string;
}

// Возвращает массив
UserContact[]
```

---

### POST /users/:id/contacts

Создать новый контакт для пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Тело запроса:**
```typescript
interface CreateUserContactDto {
  name: string;           // Обязательно
  phone?: string;
  email?: string;
  relation?: string;      // Например: "Друг", "Родственник", "Коллега"
  isPrimary?: boolean;    // По умолчанию false
}
```

**Пример запроса:**
```typescript
const createUserContact = async (userId: string, data: CreateUserContactDto) => {
  const response = await axios.post(`/users/${userId}/contacts`, data);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useCreateUserContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: CreateUserContactDto }) => {
      const response = await axios.post(`/users/${userId}/contacts`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userContacts', userId] });
    },
  });
};

// Использование
const { mutate: createContact } = useCreateUserContact();

createContact({
  userId: 'user123',
  data: {
    name: 'Иван Петров',
    phone: '+380501234567',
    email: 'ivan@example.com',
    relation: 'Родственник',
    isPrimary: true
  }
});
```

**Ответ:** Объект созданного контакта `UserContact`

---

### PATCH /users/contacts/:contactId

Обновить существующий контакт.

**Параметры URL:**
- `contactId` - ID контакта (string)

**Тело запроса:**
```typescript
interface UpdateUserContactDto {
  name?: string;
  phone?: string;
  email?: string;
  relation?: string;
  isPrimary?: boolean;
}
```

**Пример запроса:**
```typescript
const updateUserContact = async (contactId: string, data: UpdateUserContactDto) => {
  const response = await axios.patch(`/users/contacts/${contactId}`, data);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUpdateUserContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: UpdateUserContactDto }) => {
      const response = await axios.patch(`/users/contacts/${contactId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userContacts'] });
    },
  });
};

// Использование
const { mutate: updateContact } = useUpdateUserContact();

updateContact({
  contactId: 'contact123',
  data: { phone: '+380509876543' }
});
```

**Ответ:** Обновленный объект контакта `UserContact`

---

### DELETE /users/contacts/:contactId

Удалить контакт.

**Параметры URL:**
- `contactId` - ID контакта (string)

**Пример запроса:**
```typescript
const deleteUserContact = async (contactId: string) => {
  const response = await axios.delete(`/users/contacts/${contactId}`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useDeleteUserContact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (contactId: string) => {
      const response = await axios.delete(`/users/contacts/${contactId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userContacts'] });
    },
  });
};

// Использование
const { mutate: deleteContact } = useDeleteUserContact();

deleteContact('contact123');
```

**Ответ:**
```typescript
{
  message: "Contact deleted successfully"
}
```

---

## 3. Управление отпусками

### GET /users/:id/vacations

Получить все отпуска пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Пример запроса:**
```typescript
const getUserVacations = async (userId: string) => {
  const response = await axios.get(`/users/${userId}/vacations`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUserVacations = (userId: string) => {
  return useQuery({
    queryKey: ['userVacations', userId],
    queryFn: () => getUserVacations(userId),
    enabled: !!userId,
  });
};

// Использование
const { data: vacations, isLoading } = useUserVacations('user123');
```

**Ответ:**
```typescript
interface UserVacation {
  id: string;
  userId: string;
  title: string;           // Название отпуска
  startDate: string;       // ISO дата начала
  endDate: string;         // ISO дата окончания
  description?: string;    // Описание
  createdAt: string;
  updatedAt: string;
}

// Возвращает массив
UserVacation[]
```

---

### POST /users/:id/vacations

Создать новый отпуск для пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Тело запроса:**
```typescript
interface CreateUserVacationDto {
  title: string;          // Обязательно - Vacation type
  startDate: string;      // Обязательно (ISO дата) - Start date
  endDate: string;        // Обязательно (ISO дата) - Completion
  description?: string;   // Необязательно
}
```

**Пример UI:**
```
┌─────────────────────────────────────────────────────┐
│ 🏳️  Add a vacation                             ✕    │
│                                          🗑️ delete  │
├─────────────────────────────────────────────────────┤
│ Vacation type                                       │
│ ┌─────────────────────────────────────────────┐    │
│ │ input_label                              ▼  │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ Select a user                                       │
│ ┌─────────────────────────────────────────────┐    │
│ │ input_label                              ▼  │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ Start date              Completion                  │
│ ┌──────────────────┐   ┌──────────────────┐        │
│ │ 📅 input_label   │   │ 📅 input_label   │        │
│ └──────────────────┘   └──────────────────┘        │
│                                                     │
│ ┌───────────────┐    ┌─────────────────────────┐  │
│ │    Cancel     │    │        Save             │  │
│ └───────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const createUserVacation = async (userId: string, data: CreateUserVacationDto) => {
  const response = await axios.post(`/users/${userId}/vacations`, data);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useCreateUserVacation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: CreateUserVacationDto }) => {
      const response = await axios.post(`/users/${userId}/vacations`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userVacations', userId] });
    },
  });
};

// Использование
const { mutate: createVacation } = useCreateUserVacation();

createVacation({
  userId: 'user123',
  data: {
    title: 'Annual Leave',        // Vacation type
    startDate: '2025-07-01',      // Start date
    endDate: '2025-07-14',        // Completion (end date)
    description: 'Summer vacation'
  }
});
```

**Ответ:** Объект созданного отпуска `UserVacation`

---

### PATCH /users/vacations/:vacationId

Обновить существующий отпуск.

**Параметры URL:**
- `vacationId` - ID отпуска (string)

**Тело запроса:**
```typescript
interface UpdateUserVacationDto {
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}
```

**Пример запроса:**
```typescript
const updateUserVacation = async (vacationId: string, data: UpdateUserVacationDto) => {
  const response = await axios.patch(`/users/vacations/${vacationId}`, data);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUpdateUserVacation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ vacationId, data }: { vacationId: string; data: UpdateUserVacationDto }) => {
      const response = await axios.patch(`/users/vacations/${vacationId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVacations'] });
    },
  });
};

// Использование
const { mutate: updateVacation } = useUpdateUserVacation();

updateVacation({
  vacationId: 'vacation123',
  data: { endDate: '2025-07-20' }
});
```

**Ответ:** Обновленный объект отпуска `UserVacation`

---

### DELETE /users/vacations/:vacationId

Удалить отпуск.

**Параметры URL:**
- `vacationId` - ID отпуска (string)

**Пример запроса:**
```typescript
const deleteUserVacation = async (vacationId: string) => {
  const response = await axios.delete(`/users/vacations/${vacationId}`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useDeleteUserVacation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vacationId: string) => {
      const response = await axios.delete(`/users/vacations/${vacationId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVacations'] });
    },
  });
};

// Использование
const { mutate: deleteVacation } = useDeleteUserVacation();

deleteVacation('vacation123');
```

**Ответ:**
```typescript
{
  message: "Vacation deleted successfully"
}
```

---

## 4. Управление настройками уведомлений

### GET /users/:id/alerts

Получить все настройки уведомлений пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Пример запроса:**
```typescript
const getUserAlertSettings = async (userId: string) => {
  const response = await axios.get(`/users/${userId}/alerts`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUserAlertSettings = (userId: string) => {
  return useQuery({
    queryKey: ['userAlertSettings', userId],
    queryFn: () => getUserAlertSettings(userId),
    enabled: !!userId,
  });
};

// Использование
const { data: alertSettings, isLoading } = useUserAlertSettings('user123');
```

**Ответ:**
```typescript
interface UserAlertSetting {
  id: string;
  userId: string;
  alertType: string;      // email, sms, push
  category: string;       // vacation, timesheet, schedule, etc
  isEnabled: boolean;     // Включено/выключено
  createdAt: string;
  updatedAt: string;
}

// Возвращает массив
UserAlertSetting[]
```

---

### PATCH /users/:id/alerts

Обновить настройку уведомлений пользователя.

**Параметры URL:**
- `id` - ID пользователя (string)

**Тело запроса:**
```typescript
interface UpdateUserAlertSettingsDto {
  alertType: string;      // Обязательно: email, sms, push
  category: string;       // Обязательно: vacation, timesheet, schedule
  isEnabled: boolean;     // Обязательно
}
```

**Пример запроса:**
```typescript
const updateUserAlertSetting = async (userId: string, data: UpdateUserAlertSettingsDto) => {
  const response = await axios.patch(`/users/${userId}/alerts`, data);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUpdateUserAlertSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserAlertSettingsDto }) => {
      const response = await axios.patch(`/users/${userId}/alerts`, data);
      return response.data;
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userAlertSettings', userId] });
    },
  });
};

// Использование
const { mutate: updateAlertSetting } = useUpdateUserAlertSetting();

updateAlertSetting({
  userId: 'user123',
  data: {
    alertType: 'email',
    category: 'vacation',
    isEnabled: true
  }
});
```

**Ответ:** Обновленный объект настройки `UserAlertSetting`

---

## Полный пример сервиса для Next.js

```typescript
// services/userExtendedService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// Типы
export interface UpdateUserRatesDto {
  ratePerHour?: number;
  ratePerLinearMeter?: number;
  ratePerM2?: number;
  workTypes?: string[];
  workSchedule?: Record<string, { start: string; end: string }>;
}

export interface CreateUserContactDto {
  name: string;
  phone?: string;
  email?: string;
  relation?: string;
  isPrimary?: boolean;
}

export interface UpdateUserContactDto {
  name?: string;
  phone?: string;
  email?: string;
  relation?: string;
  isPrimary?: boolean;
}

export interface CreateUserVacationDto {
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
}

export interface UpdateUserVacationDto {
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface UpdateUserAlertSettingsDto {
  alertType: string;
  category: string;
  isEnabled: boolean;
}

// Сервис
export const userExtendedService = {
  // Rates
  updateRates: async (userId: string, data: UpdateUserRatesDto) => {
    const response = await axios.patch(`${API_URL}/users/${userId}/rates`, data);
    return response.data;
  },

  // Contacts
  getContacts: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/contacts`);
    return response.data;
  },
  
  createContact: async (userId: string, data: CreateUserContactDto) => {
    const response = await axios.post(`${API_URL}/users/${userId}/contacts`, data);
    return response.data;
  },
  
  updateContact: async (contactId: string, data: UpdateUserContactDto) => {
    const response = await axios.patch(`${API_URL}/users/contacts/${contactId}`, data);
    return response.data;
  },
  
  deleteContact: async (contactId: string) => {
    const response = await axios.delete(`${API_URL}/users/contacts/${contactId}`);
    return response.data;
  },

  // Vacations
  getVacations: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/vacations`);
    return response.data;
  },
  
  createVacation: async (userId: string, data: CreateUserVacationDto) => {
    const response = await axios.post(`${API_URL}/users/${userId}/vacations`, data);
    return response.data;
  },
  
  updateVacation: async (vacationId: string, data: UpdateUserVacationDto) => {
    const response = await axios.patch(`${API_URL}/users/vacations/${vacationId}`, data);
    return response.data;
  },
  
  deleteVacation: async (vacationId: string) => {
    const response = await axios.delete(`${API_URL}/users/vacations/${vacationId}`);
    return response.data;
  },

  // Alert Settings
  getAlertSettings: async (userId: string) => {
    const response = await axios.get(`${API_URL}/users/${userId}/alerts`);
    return response.data;
  },
  
  updateAlertSetting: async (userId: string, data: UpdateUserAlertSettingsDto) => {
    const response = await axios.patch(`${API_URL}/users/${userId}/alerts`, data);
    return response.data;
  },
};
```

---

## React Query хуки (полный набор)

```typescript
// hooks/useUserExtended.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userExtendedService } from '@/services/userExtendedService';

// Rates
export const useUpdateUserRates = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: Parameters<typeof userExtendedService.updateRates>) =>
      userExtendedService.updateRates(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
  });
};

// Contacts
export const useUserContacts = (userId: string) => {
  return useQuery({
    queryKey: ['userContacts', userId],
    queryFn: () => userExtendedService.getContacts(userId),
    enabled: !!userId,
  });
};

export const useCreateUserContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: Parameters<typeof userExtendedService.createContact>) =>
      userExtendedService.createContact(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userContacts', userId] });
    },
  });
};

export const useUpdateUserContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, data }: Parameters<typeof userExtendedService.updateContact>) =>
      userExtendedService.updateContact(contactId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userContacts'] });
    },
  });
};

export const useDeleteUserContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (contactId: string) => userExtendedService.deleteContact(contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userContacts'] });
    },
  });
};

// Vacations
export const useUserVacations = (userId: string) => {
  return useQuery({
    queryKey: ['userVacations', userId],
    queryFn: () => userExtendedService.getVacations(userId),
    enabled: !!userId,
  });
};

export const useCreateUserVacation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: Parameters<typeof userExtendedService.createVacation>) =>
      userExtendedService.createVacation(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userVacations', userId] });
    },
  });
};

export const useUpdateUserVacation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vacationId, data }: Parameters<typeof userExtendedService.updateVacation>) =>
      userExtendedService.updateVacation(vacationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVacations'] });
    },
  });
};

export const useDeleteUserVacation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vacationId: string) => userExtendedService.deleteVacation(vacationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userVacations'] });
    },
  });
};

// Alert Settings
export const useUserAlertSettings = (userId: string) => {
  return useQuery({
    queryKey: ['userAlertSettings', userId],
    queryFn: () => userExtendedService.getAlertSettings(userId),
    enabled: !!userId,
  });
};

export const useUpdateUserAlertSetting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: Parameters<typeof userExtendedService.updateAlertSetting>) =>
      userExtendedService.updateAlertSetting(userId, data),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userAlertSettings', userId] });
    },
  });
};
```

---

## Примеры использования в компонентах

### Обновление ставок

```typescript
'use client';

import { useUpdateUserRates } from '@/hooks/useUserExtended';
import { useState } from 'react';

export default function UserRatesForm({ userId }: { userId: string }) {
  const { mutate: updateRates, isPending } = useUpdateUserRates();
  const [workTypes, setWorkTypes] = useState<string[]>(['Plumbing', 'Spackle', 'Tile']);
  const [rates, setRates] = useState({
    ratePerHour: 77,
    ratePerLinearMeter: 48,
    ratePerM2: 69,
  });
  const [schedule, setSchedule] = useState({
    monday: { start: '08:00', end: '18:00' },
    tuesday: { start: '08:00', end: '18:00' },
    wednesday: { start: '08:00', end: '18:00' },
    thursday: { start: '08:00', end: '18:00' },
    friday: { start: '08:00', end: '18:00' },
    saturday: { start: '08:00', end: '18:00' },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRates({ 
      userId, 
      data: {
        ...rates,
        workTypes,
        workSchedule: schedule
      }
    });
  };

  const addWorkType = (type: string) => {
    if (!workTypes.includes(type)) {
      setWorkTypes([...workTypes, type]);
    }
  };

  const removeWorkType = (type: string) => {
    setWorkTypes(workTypes.filter(t => t !== type));
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          💼 Rate and Salary
        </h2>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Типы работ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🕐 Type of work
          </label>
          <div className="space-y-2">
            {workTypes.map((type) => (
              <div key={type} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span>{type}</span>
                <button
                  type="button"
                  onClick={() => removeWorkType(type)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Ставки */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rate per hour
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={rates.ratePerHour}
                onChange={(e) => setRates({ ...rates, ratePerHour: Number(e.target.value) })}
                className="pl-8 w-full border rounded-lg p-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost per linear meter
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={rates.ratePerLinearMeter}
                onChange={(e) => setRates({ ...rates, ratePerLinearMeter: Number(e.target.value) })}
                className="pl-8 w-full border rounded-lg p-2"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost per m2
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={rates.ratePerM2}
                onChange={(e) => setRates({ ...rates, ratePerM2: Number(e.target.value) })}
                className="pl-8 w-full border rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        {/* Расписание */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📅 Schedule
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(schedule).map(([day, time]) => (
              <div key={day} className="flex items-center gap-2">
                <span className="w-16 text-sm capitalize">{day.slice(0, 3)}.</span>
                <input
                  type="time"
                  value={time.start}
                  onChange={(e) => setSchedule({
                    ...schedule,
                    [day]: { ...time, start: e.target.value }
                  })}
                  className="border rounded p-1 text-sm"
                />
                <span>-</span>
                <input
                  type="time"
                  value={time.end}
                  onChange={(e) => setSchedule({
                    ...schedule,
                    [day]: { ...time, end: e.target.value }
                  })}
                  className="border rounded p-1 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isPending ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  );
}
```

**Компонент только для отображения (read-only):**

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export default function UserRatesDisplay({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await axios.get(`/users/${userId}`);
      return response.data;
    },
  });

  if (isLoading) return <div>Загрузка...</div>;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          💼 Rate and Salary
        </h2>
        <button className="text-gray-500 hover:text-gray-700">⋯</button>
      </div>

      {/* Типы работ */}
      {user?.workTypes?.length > 0 && (
        <div className="mb-6">
          {user.workTypes.map((type: string, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-2 text-gray-700">
              <span className="text-xl">🕐</span>
              <span className="text-sm">Type of work</span>
              <span className="font-medium">{type}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ставки */}
      <div className="space-y-3 mb-6">
        {user?.ratePerHour && (
          <div className="flex justify-between">
            <span className="text-gray-600">Rate per hour</span>
            <span className="font-semibold">${user.ratePerHour}</span>
          </div>
        )}
        {user?.ratePerLinearMeter && (
          <div className="flex justify-between">
            <span className="text-gray-600">Cost per linear meter</span>
            <span className="font-semibold">${user.ratePerLinearMeter}</span>
          </div>
        )}
        {user?.ratePerM2 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Cost per m2</span>
            <span className="font-semibold">${user.ratePerM2}</span>
          </div>
        )}
      </div>

      {/* Расписание */}
      {user?.workSchedule && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📅</span>
            <span className="font-medium">Schedule</span>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {Object.entries(user.workSchedule).map(([day, time]: [string, any]) => (
              <div key={day}>
                <span className="capitalize">{day.slice(0, 3)}.</span>{' '}
                {formatTime(time.start)}-{formatTime(time.end)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Список контактов

```typescript
'use client';

import { useUserContacts, useDeleteUserContact } from '@/hooks/useUserExtended';

export default function UserContactsList({ userId }: { userId: string }) {
  const { data: contacts, isLoading } = useUserContacts(userId);
  const { mutate: deleteContact } = useDeleteUserContact();

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div>
      <h2>Контакты</h2>
      {contacts?.map((contact) => (
        <div key={contact.id}>
          <h3>{contact.name} {contact.isPrimary && '⭐'}</h3>
          <p>Телефон: {contact.phone}</p>
          <p>Email: {contact.email}</p>
          <p>Отношение: {contact.relation}</p>
          <button onClick={() => deleteContact(contact.id)}>
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Форма добавления отпуска

```typescript
'use client';

import { useCreateUserVacation } from '@/hooks/useUserExtended';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface AddVacationModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddVacationModal({ userId, isOpen, onClose }: AddVacationModalProps) {
  const { mutate: createVacation, isPending } = useCreateUserVacation();
  const [formData, setFormData] = useState({
    title: '',
    startDate: '',
    endDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createVacation(
      { userId, data: formData },
      {
        onSuccess: () => {
          toast.success('Vacation added successfully');
          onClose();
          setFormData({ title: '', startDate: '', endDate: '' });
        },
        onError: () => {
          toast.error('Failed to add vacation');
        },
      }
    );
  };

  const handleDelete = () => {
    setFormData({ title: '', startDate: '', endDate: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏳️</span>
            <h2 className="text-xl font-semibold">Add a vacation</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-600 flex items-center gap-1"
            >
              <span>🗑️</span>
              <span className="text-sm">delete</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vacation type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vacation type
            </label>
            <select
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">input_label</option>
              <option value="Annual Leave">Annual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Personal Leave">Personal Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>

          {/* Select a user - для админов */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a user
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            >
              <option>input_label</option>
            </select>
          </div>

          {/* Start date and Completion */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="absolute left-3 top-3 text-gray-400">📅</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="absolute left-3 top-3 text-gray-400">📅</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 rounded-full py-3 text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-slate-800 text-white rounded-full py-3 hover:bg-slate-700 disabled:bg-gray-400 font-medium"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### Календарь отпусков

```typescript
'use client';

import { useUserVacations } from '@/hooks/useUserExtended';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function UserVacationsCalendar({ userId }: { userId: string }) {
  const { data: vacations, isLoading } = useUserVacations(userId);

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div>
      <h2>Отпуска</h2>
      {vacations?.map((vacation) => (
        <div key={vacation.id}>
          <h3>{vacation.title}</h3>
          <p>
            {format(new Date(vacation.startDate), 'dd MMMM yyyy', { locale: ru })}
            {' - '}
            {format(new Date(vacation.endDate), 'dd MMMM yyyy', { locale: ru })}
          </p>
          <p>{vacation.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Обработка ошибок

```typescript
const { mutate: updateRates, isPending, error } = useUpdateUserRates();

// В компоненте
{error && (
  <div className="error">
    Ошибка: {error.response?.data?.message || 'Что-то пошло не так'}
  </div>
)}
```

---

## Уведомления при успехе

```typescript
import { toast } from 'react-hot-toast';

export const useUpdateUserRates = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, data }) => userExtendedService.updateRates(userId, data),
    onSuccess: () => {
      toast.success('Ставки успешно обновлены!');
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      toast.error('Ошибка при обновлении ставок');
    },
  });
};
```

---

## Важные замечания

1. **Авторизация**: В данный момент авторизация временно отключена для тестирования. После завершения разработки необходимо включить авторизацию обратно.

2. **Валидация**: Все поля проходят валидацию на бэкенде. Убедитесь, что обрабатываете ошибки валидации на фронтенде.

3. **Даты**: Даты должны быть в формате ISO 8601 (YYYY-MM-DD или YYYY-MM-DDTHH:mm:ss.sssZ).

4. **Primary контакт**: При установке `isPrimary: true` для контакта, все остальные контакты автоматически теряют статус primary.

5. **Уникальность настроек уведомлений**: Комбинация `userId + alertType + category` должна быть уникальной.

---

## Swagger документация

Полная интерактивная документация доступна по адресу:
```
http://localhost:4001/api/docs
```

Там вы можете протестировать все endpoints напрямую из браузера.
