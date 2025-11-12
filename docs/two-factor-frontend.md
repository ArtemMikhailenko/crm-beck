## Двухфакторная аутентификация (Email OTP)

### 1. Общий поток (login)
1. Отправьте POST `/auth/login` с `{ email, password }`.
  - Важно: чтобы сервер установил cookie с сессией, запрос должен быть с `credentials: 'include'` (и все защищённые запросы дальше тоже).
2. Если у пользователя включена 2FA, ответ будет:
   ```json
   {
     "twoFactorRequired": true,
     "message": "Требуется двухфакторная аутентификация. Код отправлен на email.",
     "ttlMinutes": 10
   }
   ```
3. Покажите форму ввода кода (6 цифр).  
4. Повторно вызовите POST `/auth/login` с `{ email, password, token }`.  
5. В случае успеха получите объект с `accessToken` и данными пользователя.

### 2. Повторная отправка (resend)
Endpoint: `POST /auth/2fa/resend`  
Body: `{ "email": "user@example.com" }`

Ответ:
```json
{ "message": "Код повторно отправлен на email" }
```
Ограничение по частоте контролируется на сервере (env `TWO_FACTOR_RESEND_INTERVAL_SECONDS`). Если слишком рано — вернётся 400 с сообщением ожидания.

### 3. Отображение таймера на фронтенде
Используйте значение `ttlMinutes` из ответа login для обратного отсчёта (например, 10 минут). После истечения времени предложите пользователю нажать «Отправить код снова».

### 4. Состояния UI
| Состояние | Описание | Действия |
|-----------|----------|----------|
| Ожидание ввода | Пользователь ввёл email/пароль, сервер требует код | Показать форму, заблокировать поля email/пароль |
| Код неверный | Сервер вернул 404 / 400 при проверке | Показать ошибку, разрешить повторный ввод |
| Код истёк | Сообщение `Token has expired` | Предложить «Отправить снова» |
| Ресенд слишком рано | Сообщение с временем ожидания | Отобразить секунды до повторной попытки |

### 5. ENV параметры
| Переменная | Значение по умолчанию | Назначение |
|------------|-----------------------|------------|
| `TWO_FACTOR_TOKEN_TTL_MINUTES` | 10 | Время жизни кода |
| `TWO_FACTOR_TOKEN_LENGTH` | 6 | Длина кода (цифры) |
| `TWO_FACTOR_RESEND_INTERVAL_SECONDS` | 60 | Минимальный интервал между повторными отправками |
| `TWO_FACTOR_MAX_ATTEMPTS` | 5 | (Зарезервировано) Лимит попыток ввода |

### 6. Пример клиентской логики (TypeScript pseudo)
```ts
async function login(email: string, password: string, token?: string) {
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, token })
  })
  const data = await res.json()

  if (data.twoFactorRequired) {
    ui.showTwoFactorForm(data.ttlMinutes)
    return
  }

  auth.storeToken(data.accessToken)
  ui.redirectDashboard()
}

async function resend(email: string) {
  const res = await fetch('/auth/2fa/resend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email })
  })
  const data = await res.json()
  ui.notify(data.message)
}
```

### 7. Ошибки
| Код | Причина |
|-----|---------|
| 400 | Ресенд слишком рано / неверный формат |
| 404 | Токен не найден |
| 401 | Неверный пароль (перед этапом 2FA) |

### 8. Включение / отключение 2FA
По умолчанию 2FA включена для всех новых пользователей, а также принудительно включена для текущих аккаунтов.
Переключение выполняется через обновление пользователя: `PATCH /users/:id` с `{ isTwoFactorEnabled: true|false }`.
Вы можете добавить тумблер в настройках профиля; при `false` шаг ввода кода на логине отключается.

### 9. Рекомендации по UX
1. Автофокус на поле кода.
2. Блокировка кнопки «Ресенд» до истечения интервала.
3. Отображение оставшегося времени действия кода.
4. После успешной авторизации очистить временные состояния.

### 10. Дальнейшие улучшения
1. Поддержка TOTP (Google Authenticator) с секретом и QR.
2. Лимит попыток + блокировка после превышения.
3. Логи аудита попыток входа.
4. Отправка push/SMS вместо email.

---
Если потребуется расширить до TOTP — сообщите, подготовим миграцию и endpoints.

---

## Смена пароля (frontend)

Endpoint: `PUT /users/password`

Требования:
- Пользователь должен быть залогинен. Эндпоинт защищён и использует сессию, поэтому ВСЕ запросы должны идти с `credentials: 'include'`.
- Тело запроса:
  ```json
  { "currentPassword": "старый", "newPassword": "новыйПароль123" }
  ```

Пример запроса:
```ts
async function changePassword(currentPassword: string, newPassword: string) {
  const res = await fetch('/users/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ currentPassword, newPassword })
  })
  if (!res.ok) throw await res.json()
  return res.json() // { message: 'Password updated successfully' }
}
```

Рекомендации по UI:
- Добавьте поле подтверждения пароля на фронтенде и проверьте совпадение перед запросом.
- Показывайте ошибки: 401 — неверный текущий пароль; 400 — валидация.
- При успехе — уведомление и очистка полей.

---

## Включение/отключение 2FA из профиля

- Изменение флага: `PATCH /users/:id` с `{ isTwoFactorEnabled: true|false }`.
- После включения при следующем логине потребуется email‑код; при отключении — нет.
- Рекомендуется после включения сразу запускать отправку первого кода (в текущей логике код отправляется при логине, если токен не передан).