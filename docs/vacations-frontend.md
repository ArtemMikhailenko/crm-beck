## Vacations: получение и отображение (Frontend)

Этот короткий гайд показывает, как получить и отрисовать отпуска пользователя в таблице «Vacation schedule».

### Эндпоинт

- Метод: GET
- Путь: `/users/:userId/vacations`
- Авторизация: cookie-сессия (нужно передавать credentials)
- Ответ: массив отпусков, отсортированный по дате начала (startDate) по убыванию

Пример одного элемента:

```json
{
  "id": "ckxyz...",
  "userId": "ckabc...",
  "title": "Vacation 1",
  "startDate": "2025-06-16T00:00:00.000Z",
  "endDate": "2025-06-16T00:00:00.000Z",
  "description": null,
  "createdAt": "2025-06-01T10:00:00.000Z",
  "updatedAt": "2025-06-01T10:00:00.000Z"
}
```

### Типы (TypeScript)

```ts
export type VacationDto = {
  id: string
  userId: string
  title: string
  startDate: string // ISO
  endDate: string   // ISO
  description?: string | null
  createdAt: string
  updatedAt: string
}
```

### Запрос на клиенте

Axios:

```ts
import axios from 'axios'

export async function fetchUserVacations(userId: string) {
  const res = await axios.get<VacationDto[]>(`/users/${userId}/vacations`, {
    withCredentials: true // для cookie-сессии
  })
  return res.data
}
```

Fetch API:

```ts
export async function fetchUserVacations(userId: string) {
  const res = await fetch(`/users/${userId}/vacations`, {
    credentials: 'include' // для cookie-сессии
  })
  if (!res.ok) throw new Error('Failed to load vacations')
  return (await res.json()) as VacationDto[]
}
```

### Преобразование под таблицу «Vacation schedule»

Рекомендуется хранить даты в ISO, а в UI форматировать. Ниже — маппинг в строки таблицы с форматом `DD.MM.YYYY`.

```ts
import dayjs from 'dayjs'

type VacationRow = {
  id: string
  title: string
  start: string // 16.06.2025
  end: string   // 16.06.2025
}

export function toVacationRows(items: VacationDto[]): VacationRow[] {
  return items.map(v => ({
    id: v.id,
    title: v.title,
    start: dayjs(v.startDate).format('DD.MM.YYYY'),
    end: dayjs(v.endDate).format('DD.MM.YYYY')
  }))
}
```

### UI-поведение (рекомендации)

- Кнопка «Add new»: открывает модалку создания отпуска и по успеху делает refetch списка.
- Иконка «Edit» напротив строки: открывает модалку редактирования конкретного отпуска `id`.
- Пустое состояние: показывайте «No vacations yet».

### Смежные эндпоинты (уже есть на бэке)

- POST `/users/:userId/vacations` — создать отпуск.
- PATCH `/users/vacations/:vacationId` — обновить отпуск.
- DELETE `/users/vacations/:vacationId` — удалить отпуск.

Тела/форматы простые: `{ title, startDate, endDate, description? }`, даты — ISO-строки.

### Возможные расширения (по запросу)

- Фильтры по диапазону дат: `GET /users/:id/vacations?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- Пагинация: `?page=1&limit=20`.

Сообщите, если нужен бэкенд-фильтр/пагинация — добавим быстро.
