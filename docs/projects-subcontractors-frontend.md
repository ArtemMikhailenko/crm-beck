## Проекты и субподрядчики — интеграция фронтенда

Этот документ описывает, как на фронтенде выводить проекты, создавать новый проект с выбором субподрядчиков и управлять списком субподрядчиков у проекта.

— Бекенд: NestJS + Prisma
— Swagger: `/api/docs`

### Список основных эндпоинтов

- Проекты (список):
  - `GET /projects`
  - query: `clientId`, `managerId`, `status`, `search`, `page`, `pageSize`, `sort`, `subcontractorId`
  - `sort` формат: `field:direction` (например, `createdAt:desc`)

- Проект (детали):
  - `GET /projects/:id`
  - `PATCH /projects/:id`
  - `DELETE /projects/:id`

- Создание проекта:
  - `POST /projects`
  - body: `{ name, projectId, clientId, managerId?, status?, description?, startDate?, endDate?, subcontractorIds?[] }`

- Субподрядчики проекта:
  - `GET /projects/:id/subcontractors`
  - `POST /projects/:id/subcontractors` — body: `{ subcontractorIds: string[] }`
  - `DELETE /projects/:id/subcontractors/:companyId`

- Компании (для выбора субподрядчиков в модалке):
  - `GET /companies?type=SUBCONTRACTOR&search=&page=&pageSize=&sort=`

- Проекты конкретного заказчика (для страницы компании → блок “Customer projects”):
  - `GET /companies/:id/projects`

Статусы проекта: `PLANNING | REVIEW | PROCESS | PAUSE | REUSE | COMPLETED | CANCELLED`

---

## Форматы данных

### Ответ списка проектов

```json
{
  "data": [
    {
      "id": "proj_123",
      "projectId": "8861",
      "name": "Facade Renovation",
      "status": "PROCESS",
      "description": "...",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": "2026-02-01T00:00:00.000Z",
      "client": { "id": "cmp_customer_1", "name": "Acme Co." },
      "manager": { "id": "usr_1", "displayName": "Jane Doe" },
      "subcontractors": [
        { "subcontractor": { "id": "cmp_subc_1", "name": "Roof Masters" } },
        { "subcontractor": { "id": "cmp_subc_2", "name": "Facade Team" } }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

Примечание: для удобства UI приведите массив субподрядчиков к массиву компаний:

```ts
const subs = project.subcontractors.map(x => x.subcontractor)
```

### Детали проекта

`GET /projects/:id` возвращает те же поля, плюс последние тайм‑энтри (сокращённо) и расширенную информацию о клиенте и менеджере.

---

## Типичные сценарии UI

### 1) Страница “Projects”

- Список: `GET /projects?search=&status=&subcontractorId=&page=1&pageSize=10&sort=createdAt:desc`
- Фильтр по субподрядчику: передавайте `subcontractorId` (id компании типа SUBCONTRACTOR)
- Кнопка “Add project” → открыть модал создания проекта

### 2) Модал “Create project”

Поля:
- Client (select, компании типа CUSTOMER)
- Project ID (человекочитаемый идентификатор, должен быть уникален)
- Name, Manager, Status, Dates, Description
- Subcontractors (multi-select) — источник: `GET /companies?type=SUBCONTRACTOR&search=...`

Сохранение:

```http
POST /projects
Content-Type: application/json

{
  "name": "Facade Renovation",
  "projectId": "8861",
  "clientId": "cmp_customer_1",
  "managerId": "usr_123",
  "status": "PROCESS",
  "description": "Facade works Q4",
  "startDate": "2025-11-01T00:00:00Z",
  "endDate": "2026-02-01T00:00:00Z",
  "subcontractorIds": ["cmp_subc_1", "cmp_subc_2"]
}
```

### 3) Страница компании → блок “Customer projects”

Загрузить проекты конкретного клиента:

```http
GET /companies/{companyId}/projects?status=PROCESS&page=1&pageSize=10&sort=createdAt:desc
```

### 4) Страница “Project Details” → блок “Subcontractors”

- Загрузить список субподрядчиков проекта:

```http
GET /projects/{projectId}/subcontractors
```

- Добавить субподрядчиков:

```http
POST /projects/{projectId}/subcontractors
Content-Type: application/json

{ "subcontractorIds": ["cmp_subc_3", "cmp_subc_4"] }
```

- Удалить конкретного субподрядчика:

```http
DELETE /projects/{projectId}/subcontractors/{companyId}
```

---

## Параметры фильтрации и сортировки

- `search` — по `name`, `projectId`, `description` (регистронезависимо)
- `status` — один из перечисления статусов
- `managerId`, `clientId`, `subcontractorId`
- `page`, `pageSize` (пагинация)
- `sort` — `field:direction`, примеры: `createdAt:desc`, `name:asc`, `status:asc`

---

## Ошибки и валидация

- `400 BadRequest` — дубликат `projectId`, неверные `subcontractorIds`, некорректный формат сортировки и т.п.
- `404 NotFound` — проект/компания/связь не найдены
- `401/403` — при включённых guard’ах без сессии/прав

Советы по UI:
- Блокируйте кнопку “Resend”/повторы запросов, показывайте спиннер.
- При создании проекта валидируйте обязательные поля до отправки.
- Для выбора субподрядчиков предфильтруйте компании по `type=SUBCONTRACTOR`.

---

## Быстрые сниппеты (fetch)

```ts
// Список проектов
async function listProjects(params: URLSearchParams) {
  const res = await fetch(`/projects?${params.toString()}`)
  if (!res.ok) throw await res.json()
  return res.json()
}

// Создать проект с субподрядчиками
async function createProject(payload: any) {
  const res = await fetch('/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

// Получить субподрядчиков проекта
async function getProjectSubs(projectId: string) {
  const res = await fetch(`/projects/${projectId}/subcontractors`)
  if (!res.ok) throw await res.json()
  return res.json()
}

// Добавить субподрядчиков
async function addProjectSubs(projectId: string, ids: string[]) {
  const res = await fetch(`/projects/${projectId}/subcontractors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subcontractorIds: ids })
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

// Удалить субподрядчика
async function removeProjectSub(projectId: string, companyId: string) {
  const res = await fetch(`/projects/${projectId}/subcontractors/${companyId}`, { method: 'DELETE' })
  if (!res.ok) throw await res.json()
  return res.json()
}
```

---

Если понадобится пример готового модала создания проекта или формат колонок для таблицы — напишите, добавим сниппеты под ваш UI‑фреймворк.
