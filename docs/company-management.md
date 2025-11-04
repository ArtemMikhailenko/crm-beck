# Управление компаниями - Документация для фронтенда

## Обзор

API предоставляет возможности управления компаниями (субподрядчики и заказчики), включая:
- CRUD операции с компаниями
- Управление документами компании
- Управление контактами компании
- Просмотр проектов компании
- Загрузка документов с presigned URLs для S3

---

## 1. Основная информация о компании

### GET /companies/:id

Получить детальную информацию о компании.

**Параметры URL:**
- `id` - ID компании (string)

**Пример UI:**
```
┌────────────────────────────────────────────────────────┐
│ Biffco Enterprises Ltd.               id 45776890690   │
│                                  Edited Nov 11      ⋯  │
├────────────────────────────────────────────────────────┤
│ 🕐 Created              15/08/2017                      │
│ 📋 Registered address   76, Velyka Arnautska St.,      │
│                         Odesa, Ukraine, 65045, office 2│
│ 📄 Requisites           IBAN: UA393287040000026002... │
│                         in JSC CB "PRIVATBANK"          │
└────────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const getCompany = async (companyId: string) => {
  const response = await axios.get(`/companies/${companyId}`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => getCompany(companyId),
    enabled: !!companyId,
  });
};

// Использование
const { data: company, isLoading } = useCompany('company123');
```

**Ответ:**
```typescript
interface Company {
  id: string;
  name: string;                    // "Biffco Enterprises Ltd."
  type: 'SUBCONTRACTOR' | 'CUSTOMER';  // Тип компании
  taxId?: string;                  // "12345678" - налоговый номер
  iban?: string;                   // "UA393287040000026002054312944"
  address?: string;                // "76, Velyka Arnautska St., Odesa, Ukraine, 65045, office 2"
  status: string;                  // "active" | "inactive"
  createdAt: string;               // "2017-08-15T00:00:00.000Z"
  updatedAt: string;               // "2025-11-11T00:00:00.000Z"
  contacts?: CompanyContact[];     // Контакты компании
  documents?: CompanyDocument[];   // Документы
  members?: CompanyMember[];       // Члены компании
  _count?: {                       // Счетчики
    documents: number;
    timeEntries: number;
  };
}
```

---

### PATCH /companies/:id

Обновить информацию о компании.

**Параметры URL:**
- `id` - ID компании (string)

**Тело запроса:**
```typescript
interface UpdateCompanyDto {
  name?: string;
  type?: 'SUBCONTRACTOR' | 'CUSTOMER';
  taxId?: string;        // Налоговый номер
  iban?: string;         // IBAN банковского счета
  address?: string;      // Адрес
  status?: string;       // "active" | "inactive"
}
```

**Пример запроса:**
```typescript
const updateCompany = async (companyId: string, data: UpdateCompanyDto) => {
  const response = await axios.patch(`/companies/${companyId}`, data);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ companyId, data }: { companyId: string; data: UpdateCompanyDto }) => {
      const response = await axios.patch(`/companies/${companyId}`, data);
      return response.data;
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

// Использование
const { mutate: updateCompany } = useUpdateCompany();

updateCompany({
  companyId: 'company123',
  data: {
    address: '76, Velyka Arnautska St., Odesa, Ukraine, 65045, office 2',
    iban: 'UA393287040000026002054312944',
    taxId: '12345678'
  }
});
```

---

## 2. Документы компании

### GET /companies/:id/documents

Получить все документы компании.

**Параметры URL:**
- `id` - ID компании (string)

**Пример UI:**
```
┌────────────────────────────────────────────────────────┐
│ Documents                                          ✏️   │
├────────────────────────────────────────────────────────┤
│ Lorem ipsum   Lorem ipsum   Lorem ipsum   Lorem ipsum  │
│                                                         │
│ [Contract.png] [Contract.png] [Contract.png] ...       │
│                                                         │
│                        ➕ Add document                  │
└────────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const getCompanyDocuments = async (companyId: string) => {
  const response = await axios.get(`/companies/${companyId}/documents`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useCompanyDocuments = (companyId: string) => {
  return useQuery({
    queryKey: ['companyDocuments', companyId],
    queryFn: () => getCompanyDocuments(companyId),
    enabled: !!companyId,
  });
};
```

**Ответ:**
```typescript
interface CompanyDocument {
  id: string;
  companyId: string;
  title: string;              // "Lorem ipsum"
  fileKey: string;            // S3 key
  fileName: string;           // "Contract.png"
  fileType: string;           // "image/png"
  fileSize: number;           // Размер в байтах
  uploadedAt: string;
  downloadUrl?: string;       // Presigned URL для скачивания
}

// Возвращает массив
CompanyDocument[]
```

---

### POST /companies/:id/documents/upload

✅ **РЕАЛИЗОВАНО** - Endpoint возвращает mock presigned URLs (S3 интеграция требует настройки)

Загрузить документ компании.

**Параметры URL:**
- `id` - ID компании (string)

**Тело запроса:**
```typescript
interface UploadDocumentDto {
  title: string;              // Название документа
  fileName: string;           // Имя файла
  fileType: string;           // MIME тип
  fileSize: number;           // Размер в байтах
}
```

**Ответ:**
```typescript
interface UploadResponse {
  documentId: string;         // ID созданного документа
  uploadUrl: string;          // Presigned URL для загрузки (пока mock)
  fileKey: string;            // Ключ файла в S3
  expiresIn: number;          // Время жизни URL в секундах (3600)
}
```

**Процесс загрузки:**
1. Получить presigned URL от бэкенда
2. Загрузить файл напрямую в S3 (требует настройки AWS)
3. Подтвердить загрузку (опционально)

**⚠️ Важно:** Endpoint работает, но возвращает mock S3 URLs. Для работы с реальным S3 нужно:
- Настроить AWS credentials в `.env`
- Реализовать генерацию настоящих presigned URLs
- Настроить CORS на S3 bucket

**Пример запроса:**
```typescript
const uploadCompanyDocument = async (
  companyId: string,
  file: File,
  title: string
) => {
  try {
    // Шаг 1: Получить presigned URL
    const { data: presignedData } = await axios.post(
      `/companies/${companyId}/documents/upload`,
      {
        title,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }
    );

    // Для mock URLs - пропустить реальную загрузку
    if (presignedData.uploadUrl.includes('mock-s3')) {
      console.warn('Mock S3 URL detected - skipping actual upload');
      
      // Можно сразу подтвердить "загрузку"
      const { data: document } = await axios.post(
        `/companies/${companyId}/documents/${presignedData.documentId}/confirm`
      );
      
      return document;
    }

    // Шаг 2: Загрузить файл в реальный S3
    await axios.put(presignedData.uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });

    // Шаг 3: Подтвердить загрузку
    const { data: document } = await axios.post(
      `/companies/${companyId}/documents/${presignedData.documentId}/confirm`
    );

    return document;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};
```

**Пример успешного ответа:**
```json
{
  "documentId": "cmhkx2b8f0001nywz7w94r88g",
  "uploadUrl": "https://mock-s3.amazonaws.com/companies/cmhkrq9dk0001qfrhp3cciyba/documents/1762281768541-5492da2ace479948-face3.png?uploadId=cmhkx2b8f0001nywz7w94r88g",
  "fileKey": "companies/cmhkrq9dk0001qfrhp3cciyba/documents/1762281768541-5492da2ace479948-face3.png",
  "expiresIn": 3600
}
```

**React Query Hook:**
```typescript
export const useUploadCompanyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      file,
      title,
    }: {
      companyId: string;
      file: File;
      title: string;
    }) => {
      return uploadCompanyDocument(companyId, file, title);
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments', companyId] });
    },
  });
};
```

---

### DELETE /companies/:companyId/documents/:documentId

Удалить документ компании.

**Параметры URL:**
- `companyId` - ID компании (string)
- `documentId` - ID документа (string)

**Пример запроса:**
```typescript
const deleteCompanyDocument = async (companyId: string, documentId: string) => {
  const response = await axios.delete(
    `/companies/${companyId}/documents/${documentId}`
  );
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useDeleteCompanyDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      documentId,
    }: {
      companyId: string;
      documentId: string;
    }) => {
      return deleteCompanyDocument(companyId, documentId);
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments', companyId] });
    },
  });
};
```

---

## 3. Контакты компании

### GET /companies/:id/contacts

✅ **РЕАЛИЗОВАНО**

Получить все контакты компании.

**Параметры URL:**
- `id` - ID компании (string)

**Пример UI:**
```
┌────────────────────────────────────────────────────────┐
│ Contacts                                           ✏️   │
├────────────────────────────────────────────────────────┤
│ 👤 Henry Arthur              👤 Henry Arthur           │
│    📞 (217) 555-0113            📞 (217) 555-0113      │
│    📧 binhan628@gmail.com       📧 binhan628@gmail.com │
│                                                         │
│ 👤 Henry Arthur              👤 Henry Arthur           │
│    📞 (217) 555-0113            📞 (217) 555-0113      │
│    📧 binhan628@gmail.com       📧 binhan628@gmail.com │
│                                                         │
│ 👤 Henry Arthur              👤 Henry Arthur           │
│    📞 (217) 555-0113            📞 (217) 555-0113      │
│    📧 binhan628@gmail.com       📧 binhan628@gmail.com │
└────────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const getCompanyContacts = async (companyId: string) => {
  const response = await axios.get(`/companies/${companyId}/contacts`);
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useCompanyContacts = (companyId: string) => {
  return useQuery({
    queryKey: ['companyContacts', companyId],
    queryFn: () => getCompanyContacts(companyId),
    enabled: !!companyId,
  });
};
```

**Ответ:**
```typescript
interface CompanyContact {
  id: string;
  companyId: string;
  fullName: string;       // "Henry Arthur" или "Max Mustermann"
  phone?: string;         // "(217) 555-0113" или "2324234234"
  email?: string;         // "binhan628@gmail.com"
  position?: string;      // "Manager"
  // Примечание: isPrimary и временные метки не включены в текущую схему
}

// Возвращает массив
CompanyContact[]
```

---

### POST /companies/:id/contacts

Создать новый контакт компании.

**Параметры URL:**
- `id` - ID компании (string)

**Тело запроса:**
```typescript
interface CreateCompanyContactDto {
  fullName: string;       // Обязательно - "Max Mustermann"
  phone?: string;         // "(217) 555-0113" или "2324234234"
  email?: string;         // "test@example.com"
  position?: string;      // "Manager", "вімвімів"
  // Примечание: isPrimary не поддерживается для контактов компании
}
```

**⚠️ Важно:** Поле `fullName` обязательно (не `name`!). Поле `isPrimary` не поддерживается в текущей версии схемы.

**Пример UI:**
```
┌─────────────────────────────────────────────────────┐
│ Manage Documents                               ✕    │
├─────────────────────────────────────────────────────┤
│ Document Title *                                    │
│ ┌─────────────────────────────────────────────┐    │
│ │ face4                                       │    │
│ └─────────────────────────────────────────────┘    │
│                                                     │
│ File *                                              │
│ ┌─────────────────────────────────────────────┐    │
│ │        📤 face4.png                          │    │
│ └─────────────────────────────────────────────┘    │
│ Size: 43.35 KB                                      │
│                                                     │
│        ⬆️ Upload Document                           │
│                                                     │
│ Uploaded Documents                              ⋯   │
│                                                     │
│ No documents uploaded yet                           │
│                                                     │
│                               [Close]               │
└─────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const createCompanyContact = async (
  companyId: string,
  data: CreateCompanyContactDto
) => {
  const response = await axios.post(`/companies/${companyId}/contacts`, data);
  return response.data;
};

// Использование
await createCompanyContact('cmhkrq9dk0001qfrhp3cciyba', {
  fullName: 'Max Mustermann',
  phone: '2324234234',
  email: 'test@example.com',
  position: 'вімвімів'
});
```

**React Query Hook:**
```typescript
export const useCreateCompanyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      data,
    }: {
      companyId: string;
      data: CreateCompanyContactDto;
    }) => {
      return createCompanyContact(companyId, data);
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyContacts', companyId] });
    },
  });
};
```

---

### PATCH /companies/:companyId/contacts/:contactId

Обновить контакт компании.

**Параметры URL:**
- `companyId` - ID компании (string)
- `contactId` - ID контакта (string)

**Тело запроса:**
```typescript
interface UpdateCompanyContactDto {
  fullName?: string;      // "Max Mustermann"
  phone?: string;         // "2324234234"
  email?: string;         // "test@example.com"
  position?: string;      // "Manager"
  // Примечание: isPrimary не поддерживается
}
```

**Пример запроса:**
```typescript
const updateCompanyContact = async (
  companyId: string,
  contactId: string,
  data: UpdateCompanyContactDto
) => {
  const response = await axios.patch(
    `/companies/${companyId}/contacts/${contactId}`,
    data
  );
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useUpdateCompanyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      contactId,
      data,
    }: {
      companyId: string;
      contactId: string;
      data: UpdateCompanyContactDto;
    }) => {
      return updateCompanyContact(companyId, contactId, data);
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyContacts', companyId] });
    },
  });
};
```

---

### DELETE /companies/:companyId/contacts/:contactId

Удалить контакт компании.

**Параметры URL:**
- `companyId` - ID компании (string)
- `contactId` - ID контакта (string)

**Пример запроса:**
```typescript
const deleteCompanyContact = async (companyId: string, contactId: string) => {
  const response = await axios.delete(
    `/companies/${companyId}/contacts/${contactId}`
  );
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useDeleteCompanyContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      companyId,
      contactId,
    }: {
      companyId: string;
      contactId: string;
    }) => {
      return deleteCompanyContact(companyId, contactId);
    },
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyContacts', companyId] });
    },
  });
};
```

---

## 4. Проекты компании

### GET /companies/:id/projects

✅ **РЕАЛИЗОВАНО**

Получить все проекты заказчика.

**Параметры URL:**
- `id` - ID компании (string)

**Query параметры:**
```typescript
interface ProjectsQueryParams {
  page?: number;          // Номер страницы (по умолчанию 1)
  limit?: number;         // Количество на странице (по умолчанию 10)
  sortBy?: 'createdAt' | 'name' | 'status' | 'projectId';
  sortOrder?: 'asc' | 'desc';
  status?: 'PLANNING' | 'REVIEW' | 'PROCESS' | 'PAUSE' | 'REUSE' | 'COMPLETED' | 'CANCELLED';
  managerId?: string;     // Фильтр по ID менеджера
}
```

**Пример UI:**
```
┌────────────────────────────────────────────────────────────────┐
│ Customer projects                      Columns ▼          ⋯    │
├────────────────────────────────────────────────────────────────┤
│ ↕️ Дата      ↕️ Project name  ID    Менеджер        Статус     │
├────────────────────────────────────────────────────────────────┤
│ 16/08/2013  Binford Ltd.    8861  Flores, Juanita  Planning    │
│ 15/08/2017  Abstergo Ltd.   8829  Nguyen, Shane    Review      │
│ 15/08/2017  Acme Co.        1577  Nguyen, Shane    Process     │
│ 18/09/2016  Abstergo Ltd.   9151  Flores, Juanita  Process     │
│ 12/06/2020  Biffco Enter... 1374  Cooper, Kristin  Reuse       │
│ 28/10/2012  Acme Co.        6025  Cooper, Kristin  Process     │
│ 12/06/2020  Abstergo Ltd.   4846  Flores, Juanita  Process     │
└────────────────────────────────────────────────────────────────┘
```

**Пример запроса:**
```typescript
const getCompanyProjects = async (
  companyId: string,
  params?: ProjectsQueryParams
) => {
  const response = await axios.get(`/companies/${companyId}/projects`, {
    params,
  });
  return response.data;
};
```

**React Query Hook:**
```typescript
export const useCompanyProjects = (
  companyId: string,
  params?: ProjectsQueryParams
) => {
  return useQuery({
    queryKey: ['companyProjects', companyId, params],
    queryFn: () => getCompanyProjects(companyId, params),
    enabled: !!companyId,
  });
};
```

**Ответ:**
```typescript
interface Project {
  id: string;
  name: string;           // "Binford Ltd."
  projectId: string;      // "8861" - отображаемый ID проекта
  clientId: string;       // ID компании-заказчика
  managerId: string | null; // ID менеджера проекта
  managerName?: string;   // "Flores, Juanita" (если manager загружен)
  status: 'PLANNING' | 'REVIEW' | 'PROCESS' | 'PAUSE' | 'REUSE' | 'COMPLETED' | 'CANCELLED';
  description?: string;   // Описание проекта
  startDate?: string;     // Дата начала
  endDate?: string;       // Дата окончания
  createdAt: string;      // "2013-08-16T00:00:00.000Z"
  updatedAt: string;
  
  // Связанные данные (опционально)
  client?: {
    id: string;
    name: string;
    type: string;
  };
  manager?: {
    id: string;
    email: string;
    displayName: string;
  };
}

interface ProjectsResponse {
  data: Project[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

**Пример успешного ответа:**
```json
{
  "data": [
    {
      "id": "cmhl123abc",
      "projectId": "8861",
      "name": "Binford Ltd.",
      "clientId": "cmhkrq9dk0001qfrhp3cciyba",
      "managerId": "user123",
      "status": "PLANNING",
      "description": "Construction project for office building",
      "startDate": "2013-08-16T00:00:00.000Z",
      "createdAt": "2013-08-16T00:00:00.000Z",
      "updatedAt": "2013-08-16T00:00:00.000Z",
      "manager": {
        "id": "user123",
        "email": "juanita.flores@example.com",
        "displayName": "Flores, Juanita"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

## 5. Дополнительные endpoints для проектов

Помимо получения проектов через компанию, доступны прямые CRUD endpoints для управления проектами:

### POST /projects

Создать новый проект.

**Тело запроса:**
```typescript
interface CreateProjectDto {
  name: string;              // Название проекта
  projectId: string;         // Отображаемый ID (например "8861")
  clientId: string;          // ID компании-заказчика
  managerId?: string;        // ID менеджера проекта (опционально)
  status?: ProjectStatus;    // По умолчанию "PLANNING"
  description?: string;      // Описание проекта
  startDate?: string;        // Дата начала (ISO 8601)
  endDate?: string;          // Дата окончания (ISO 8601)
}
```

**Пример запроса:**
```typescript
const response = await axios.post('/projects', {
  name: 'Binford Ltd.',
  projectId: '8861',
  clientId: 'cmhkrq9dk0001qfrhp3cciyba',
  status: 'PLANNING'
});
```

---

### GET /projects

Получить список всех проектов с фильтрацией.

**Query параметры:**
```typescript
interface ProjectsQueryDto {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'status' | 'projectId';
  sortOrder?: 'asc' | 'desc';
  clientId?: string;         // Фильтр по заказчику
  managerId?: string;        // Фильтр по менеджеру
  status?: ProjectStatus;    // Фильтр по статусу
}
```

---

### GET /projects/:id

Получить проект по ID с полной информацией.

**Ответ включает связанные данные:**
- client (Company)
- manager (User)
- timeEntries (последние записи времени)

---

### PATCH /projects/:id

Обновить проект.

**Тело запроса:**
```typescript
interface UpdateProjectDto {
  name?: string;
  projectId?: string;
  managerId?: string;
  status?: ProjectStatus;
  description?: string;
  startDate?: string;
  endDate?: string;
}
```

---

### DELETE /projects/:id

Удалить проект.

**Примечание:** При удалении проекта связанные записи времени (TimeEntry) будут также удалены.

---

## Полный пример сервиса для Next.js

```typescript
// services/companyService.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

// Типы
export interface UpdateCompanyDto {
  name?: string;
  type?: 'SUBCONTRACTOR' | 'CUSTOMER';
  taxId?: string;
  iban?: string;
  address?: string;
  status?: string;
}

export interface CreateCompanyContactDto {
  fullName: string;       // Обязательно
  phone?: string;
  email?: string;
  position?: string;
  isPrimary?: boolean;
}

export interface UpdateCompanyContactDto {
  fullName?: string;
  phone?: string;
  email?: string;
  position?: string;
  isPrimary?: boolean;
}

export interface UploadDocumentDto {
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
  status?: 'Planning' | 'Review' | 'Process' | 'Reuse';
}

// Сервис
export const companyService = {
  // Company
  getCompany: async (companyId: string) => {
    const response = await axios.get(`${API_URL}/companies/${companyId}`);
    return response.data;
  },

  updateCompany: async (companyId: string, data: UpdateCompanyDto) => {
    const response = await axios.patch(`${API_URL}/companies/${companyId}`, data);
    return response.data;
  },

  // Documents
  getDocuments: async (companyId: string) => {
    const response = await axios.get(`${API_URL}/companies/${companyId}/documents`);
    return response.data;
  },

  uploadDocument: async (companyId: string, file: File, title: string) => {
    // Получить presigned URL
    const { data: presignedData } = await axios.post(
      `${API_URL}/companies/${companyId}/documents/upload`,
      {
        title,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }
    );

    // Для mock URLs - пропустить реальную загрузку
    if (presignedData.uploadUrl.includes('mock-s3')) {
      console.warn('Mock S3 URL detected - skipping actual upload');
      
      // Подтвердить "загрузку"
      const { data: document } = await axios.post(
        `${API_URL}/companies/${companyId}/documents/${presignedData.documentId}/confirm`
      );
      
      return document;
    }

    // Загрузить в реальный S3
    await axios.put(presignedData.uploadUrl, file, {
      headers: { 'Content-Type': file.type },
    });

    // Подтвердить загрузку
    const { data: document } = await axios.post(
      `${API_URL}/companies/${companyId}/documents/${presignedData.documentId}/confirm`
    );

    return document;
  },

  deleteDocument: async (companyId: string, documentId: string) => {
    const response = await axios.delete(
      `${API_URL}/companies/${companyId}/documents/${documentId}`
    );
    return response.data;
  },

  // Contacts
  getContacts: async (companyId: string) => {
    const response = await axios.get(`${API_URL}/companies/${companyId}/contacts`);
    return response.data;
  },

  createContact: async (companyId: string, data: CreateCompanyContactDto) => {
    const response = await axios.post(
      `${API_URL}/companies/${companyId}/contacts`,
      data
    );
    return response.data;
  },

  updateContact: async (
    companyId: string,
    contactId: string,
    data: UpdateCompanyContactDto
  ) => {
    const response = await axios.patch(
      `${API_URL}/companies/${companyId}/contacts/${contactId}`,
      data
    );
    return response.data;
  },

  deleteContact: async (companyId: string, contactId: string) => {
    const response = await axios.delete(
      `${API_URL}/companies/${companyId}/contacts/${contactId}`
    );
    return response.data;
  },

  // Projects
  getProjects: async (companyId: string, params?: ProjectsQueryParams) => {
    const response = await axios.get(`${API_URL}/companies/${companyId}/projects`, {
      params,
    });
    return response.data;
  },
};
```

---

## React Query хуки (полный набор)

```typescript
// hooks/useCompany.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';

// Company
export const useCompany = (companyId: string) => {
  return useQuery({
    queryKey: ['company', companyId],
    queryFn: () => companyService.getCompany(companyId),
    enabled: !!companyId,
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, data }: Parameters<typeof companyService.updateCompany>) =>
      companyService.updateCompany(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

// Documents
export const useCompanyDocuments = (companyId: string) => {
  return useQuery({
    queryKey: ['companyDocuments', companyId],
    queryFn: () => companyService.getDocuments(companyId),
    enabled: !!companyId,
  });
};

export const useUploadCompanyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      file,
      title,
    }: {
      companyId: string;
      file: File;
      title: string;
    }) => companyService.uploadDocument(companyId, file, title),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments', companyId] });
    },
  });
};

export const useDeleteCompanyDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, documentId }: { companyId: string; documentId: string }) =>
      companyService.deleteDocument(companyId, documentId),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments', companyId] });
    },
  });
};

// Contacts
export const useCompanyContacts = (companyId: string) => {
  return useQuery({
    queryKey: ['companyContacts', companyId],
    queryFn: () => companyService.getContacts(companyId),
    enabled: !!companyId,
  });
};

export const useCreateCompanyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, data }: Parameters<typeof companyService.createContact>) =>
      companyService.createContact(companyId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyContacts', companyId] });
    },
  });
};

export const useUpdateCompanyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      contactId,
      data,
    }: Parameters<typeof companyService.updateContact>) =>
      companyService.updateContact(companyId, contactId, data),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyContacts', companyId] });
    },
  });
};

export const useDeleteCompanyContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, contactId }: { companyId: string; contactId: string }) =>
      companyService.deleteContact(companyId, contactId),
    onSuccess: (_, { companyId }) => {
      queryClient.invalidateQueries({ queryKey: ['companyContacts', companyId] });
    },
  });
};

// Projects
export const useCompanyProjects = (
  companyId: string,
  params?: Parameters<typeof companyService.getProjects>[1]
) => {
  return useQuery({
    queryKey: ['companyProjects', companyId, params],
    queryFn: () => companyService.getProjects(companyId, params),
    enabled: !!companyId,
  });
};
```

---

## Примеры использования в компонентах

### Страница компании с редактированием

```typescript
'use client';

import { useCompany, useUpdateCompany } from '@/hooks/useCompany';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CompanyPage({ companyId }: { companyId: string }) {
  const { data: company, isLoading } = useCompany(companyId);
  const { mutate: updateCompany } = useUpdateCompany();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    iban: '',
    taxId: '',
  });

  if (isLoading) return <div>Загрузка...</div>;

  const handleEdit = () => {
    setFormData({
      name: company.name,
      address: company.address || '',
      iban: company.iban || '',
      taxId: company.taxId || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateCompany(
      { companyId, data: formData },
      {
        onSuccess: () => {
          toast.success('Company updated successfully');
          setIsEditing(false);
        },
        onError: () => {
          toast.error('Failed to update company');
        },
      }
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-gray-500">
            id {company.id} • Edited {new Date(company.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleEdit}
          className="text-gray-500 hover:text-gray-700 text-2xl"
        >
          ⋯
        </button>
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <span className="text-xl">🕐</span>
          <div>
            <span className="text-gray-600">Created</span>
            <p>{new Date(company.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <span className="text-xl">📋</span>
          <div>
            <span className="text-gray-600">Address</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full border rounded px-2 py-1"
              />
            ) : (
              <p>{company.address}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <span className="text-xl">🏦</span>
          <div>
            <span className="text-gray-600">Tax ID</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
            ) : (
              <p>{company.taxId}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <span className="text-xl">💳</span>
          <div>
            <span className="text-gray-600">IBAN</span>
            {isEditing ? (
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                className="w-full border rounded px-2 py-1"
              />
            ) : (
              <p>{company.iban}</p>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 border border-gray-300 rounded py-2"
          >
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 bg-blue-600 text-white rounded py-2">
            Save
          </button>
        </div>
      )}
    </div>
  );
}
```

### Таблица проектов

```typescript
'use client';

import { useCompanyProjects } from '@/hooks/useCompany';
import { useState } from 'react';

export default function CompanyProjectsTable({ companyId }: { companyId: string }) {
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
  });

  const { data: projects, isLoading } = useCompanyProjects(companyId, params);

  if (isLoading) return <div>Загрузка...</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planning':
        return 'bg-purple-100 text-purple-800';
      case 'Review':
        return 'bg-blue-100 text-blue-800';
      case 'Process':
        return 'bg-green-100 text-green-800';
      case 'Reuse':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Customer projects</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 border rounded">Columns ▼</button>
          <button className="text-gray-500">⋯</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                ↕️ Дата
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                ↕️ Project name
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Менеджер
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                Статус
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {projects?.data.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {new Date(project.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{project.name}</td>
                <td className="px-4 py-3 text-sm">{project.projectId}</td>
                <td className="px-4 py-3 text-sm">{project.managerName}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Сетка контактов

```typescript
'use client';

import { useCompanyContacts } from '@/hooks/useCompany';

export default function CompanyContactsGrid({ companyId }: { companyId: string }) {
  const { data: contacts, isLoading } = useCompanyContacts(companyId);

  if (isLoading) return <div>Загрузка...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Contacts</h2>
        <button className="text-gray-500 hover:text-gray-700">✏️</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts?.map((contact) => (
          <div key={contact.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">👤</span>
              <span className="font-medium">{contact.fullName}</span>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📞</span>
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>📧</span>
                <span>{contact.email}</span>
              </div>
            )}
            {contact.position && (
              <div className="text-xs text-gray-500">{contact.position}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Важные замечания

1. **Авторизация**: В данный момент авторизация временно отключена для тестирования.

2. **Загрузка файлов**: Используется двухэтапный процесс с presigned URLs для прямой загрузки в S3.

3. **Primary контакт**: При установке `isPrimary: true` для контакта, все остальные контакты автоматически теряют статус primary.

4. **Проекты**: Endpoint `/companies/:id/projects` работает только для компаний типа CLIENT (заказчики).

---

## Swagger документация

Полная интерактивная документация доступна по адресу:
```
http://localhost:4001/api/docs
```
