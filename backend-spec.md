# Backend Spec: Users, Subcontractors, Time, Vacations, RBAC

This is a complete, Copilot-ready specification to scaffold and implement the backend that powers the UI screens you shared (Users/Subcontractors lists, detail cards, Add dialogs, Role customization, User schedule, Employee vacations, Rates/Hours, Change password, Documents, and summaries).

Paste tasks from the "Copilot runbook" into your backend project chat (VS Code) one by one. Each task has acceptance criteria and DTO shapes. Stack choices are aligned for speed-to-value and clarity.

---

## 0) Architecture & Stack

- Style: Modular monolith
- Language: TypeScript (Node.js LTS)
- Framework: NestJS (routing, DI, guards, pipes, interceptors)
- ORM: Prisma
- DB: PostgreSQL
- Cache/Queues: Redis + BullMQ (for exports, notifications, aggregates)
- File storage: S3-compatible (AWS S3/MinIO) via presigned uploads
- Auth: JWT access/refresh with Argon2 password hashing (or NextAuth adapter if preferred); device-bound refresh tokens
- Docs: Swagger (OpenAPI)
- Observability: pino logger, OpenTelemetry (traces/metrics), Sentry for errors
- Tests: Vitest/Jest + Supertest for e2e of controllers

Project structure (NestJS):

```
apps/api/
  src/
    main.ts
    app.module.ts
    common/
      dto/
      pipes/
      guards/
      interceptors/
      utils/
    modules/
      auth/
      rbac/
      users/
      companies/
      rates/
      schedules/
      time/
      vacations/
      documents/
      notifications/
      audit/
    prisma/
      prisma.service.ts
  test/
prisma/
  schema.prisma
```

Environment variables (example):

```
DATABASE_URL=postgresql://user:pass@localhost:5432/app
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=app-uploads
SENTRY_DSN=...
NODE_ENV=development
```

---

## 1) Data Model (Prisma, PostgreSQL)

Core entities and relations (concise version; extend as needed). Enums reflect the UI: rates for hour|kpl|m2|m3, vacations, time entries, permission levels.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum CompanyType { CUSTOMER SUBCONTRACTOR INTERNAL }
enum RateType { HOUR KPL M2 M3 }
enum PermissionLevel { FORBIDDEN LIMITED AUTHORIZED }
enum TimeEntryStatus { DRAFT SUBMITTED APPROVED REJECTED }
enum TimeSource { MANUAL TIMER }
enum VacationType { PAID UNPAID SICK WEEKEND }
enum VacationStatus { REQUESTED APPROVED REJECTED CANCELED }

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  phone         String?  @db.VarChar(64)
  passwordHash  String
  firstName     String
  lastName      String
  avatarUrl     String?
  status        String   @default("active")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  roles         UserRole[]
  memberships   UserCompanyMembership[]
  rates         Rate[]
  schedules     Schedule[]
  timeEntries   TimeEntry[]
  vacations     Vacation[]
  notifications Notification[]
  preferences   NotificationPreference[]
  auditLogs     AuditLog[] @relation("AuditActor")
}

model Role {
  id          String @id @default(cuid())
  name        String
  description String?
  isSystem    Boolean @default(false)
  users       UserRole[]
  permissions RolePermission[]
  @@unique([name])
}

model Permission {
  id          String @id @default(cuid())
  key         String @unique // e.g. users:view
  description String?
  roles       RolePermission[]
}

model RolePermission {
  roleId       String
  permissionId String
  level        PermissionLevel @default(FORBIDDEN)

  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])
  @@id([roleId, permissionId])
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id])
  role   Role @relation(fields: [roleId], references: [id])
  @@id([userId, roleId])
}

model Company {
  id        String      @id @default(cuid())
  name      String
  type      CompanyType @default(SUBCONTRACTOR)
  taxId     String?     @db.VarChar(64)
  iban      String?     @db.VarChar(64)
  address   String?
  status    String      @default("active")
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  contacts  CompanyContact[]
  members   UserCompanyMembership[]
  documents Document[]
}

model CompanyContact {
  id        String  @id @default(cuid())
  companyId String
  fullName  String
  email     String?
  phone     String?
  position  String?
  company   Company @relation(fields: [companyId], references: [id])
}

model UserCompanyMembership {
  id         String  @id @default(cuid())
  userId     String
  companyId  String
  position   String?
  isPrimary  Boolean @default(false)
  user       User    @relation(fields: [userId], references: [id])
  company    Company @relation(fields: [companyId], references: [id])
  @@unique([userId, companyId])
}

model Rate {
  id         String   @id @default(cuid())
  userId     String
  type       RateType
  value      Decimal  @db.Decimal(12,2)
  currency   String   @default("USD")
  validFrom  DateTime
  validTo    DateTime?
  user       User     @relation(fields: [userId], references: [id])
}

model Schedule {
  id        String   @id @default(cuid())
  userId    String
  name      String
  timezone  String   @default("Europe/Kyiv")
  isDefault Boolean  @default(false)
  days      ScheduleDay[]
  user      User     @relation(fields: [userId], references: [id])
}

model ScheduleDay {
  id          String  @id @default(cuid())
  scheduleId  String
  weekday     Int     // 1=Mon ... 7=Sun
  workStart   String? // "09:00"
  workEnd     String?
  lunchStart  String?
  lunchEnd    String?
  isDayOff    Boolean @default(false)
  schedule    Schedule @relation(fields: [scheduleId], references: [id])
}

model TimeEntry {
  id              String          @id @default(cuid())
  userId          String
  date            DateTime
  startAt         DateTime?
  endAt           DateTime?
  breakMinutes    Int?            @default(0)
  durationMinutes Int?            @default(0)
  companyId       String?
  status          TimeEntryStatus @default(DRAFT)
  source          TimeSource      @default(MANUAL)
  notes           String?
  user            User            @relation(fields: [userId], references: [id])
  company         Company?        @relation(fields: [companyId], references: [id])
  @@index([userId, date])
}

model Timesheet {
  id            String   @id @default(cuid())
  userId        String
  weekStartDate DateTime
  status        String   @default("submitted")
  totalMinutes  Int      @default(0)
  user          User     @relation(fields: [userId], references: [id])
  @@unique([userId, weekStartDate])
}

model Vacation {
  id         String         @id @default(cuid())
  userId     String
  startDate  DateTime
  endDate    DateTime
  type       VacationType
  status     VacationStatus @default(REQUESTED)
  approverId String?
  comment    String?
  user       User           @relation(fields: [userId], references: [id])
}

model Document {
  id         String   @id @default(cuid())
  ownerType  String   // user|company|project
  ownerId    String
  title      String
  mime       String
  size       Int
  storageKey String
  createdBy  String
  createdAt  DateTime @default(now())
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  channel   String   // email|inapp
  type      String
  payload   Json
  readAt    DateTime?
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model NotificationPreference {
  id      String @id @default(cuid())
  userId  String
  type    String
  enabled Boolean @default(true)
  user    User   @relation(fields: [userId], references: [id])
  @@unique([userId, type])
}

model AuditLog {
  id         String   @id @default(cuid())
  actorId    String?
  action     String
  entityType String
  entityId   String
  before     Json?
  after      Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime @default(now())
  actor      User?    @relation("AuditActor", fields: [actorId], references: [id])
}
```

Indexes to consider: GIN trigram on users(name/email/phone) and companies(name), plus composite on time_entries(userId,date) already added.

---

## 2) API Surface (REST)

Common response contract:

```
Success: { data: T, meta?: {...} }
Error:   { error: { code, message, details? } }
Pagination: ?page=1&pageSize=20 -> meta: { page, pageSize, total, totalPages }
Sorting: ?sort=field:asc,field2:desc
```

Auth
- POST /auth/login { email, password }
- POST /auth/refresh { refreshToken }
- POST /auth/logout
- POST /auth/password/reset/request { email }
- POST /auth/password/reset/confirm { token, newPassword }
- PATCH /users/:id/password { oldPassword, newPassword }

Users
- GET /users?search=&roleId=&companyId=&status=&sort=&page=&pageSize=
- POST /users { firstName, lastName, email, phone?, companyId?, roles:[roleId], status?, avatarUrl? }
- GET /users/:id — user detail card (aggregated: profile, company, contacts, rates, schedules, recent docs)
- PATCH /users/:id
- PATCH /users/:id/status { status }
- PATCH /users/:id/roles { roles:[roleId] }
- Rates: GET /users/:id/rates; POST /users/:id/rates; PATCH /rates/:id; DELETE /rates/:id
- Schedules: GET /users/:id/schedules; POST /users/:id/schedules; PATCH /schedules/:id; DELETE /schedules/:id; PATCH /users/:id/schedules/default { scheduleId }

Companies & Subcontractors
- GET /companies?type=subcontractor|customer&search=&page=
- POST /companies { name, type, address?, iban?, taxId? }
- GET /companies/:id — subcontractor card
- PATCH /companies/:id
- Contacts: POST /companies/:id/contacts; PATCH /company-contacts/:id; DELETE /company-contacts/:id
- Documents: POST /companies/:id/documents/presign { mime, filename } -> { url, fields }
- Summary: GET /companies/:id/summary (funds flow counters, totals, latest docs)

Time Tracking
- POST /time-entries { userId, date, startAt, endAt, breakMinutes?, companyId?, notes? }
- POST /time-entries/timer/start { companyId? } -> { entryId, startedAt }
- POST /time-entries/timer/stop { entryId }
- GET /time-entries?userId=&dateFrom=&dateTo=&status=&page=
- PATCH /time-entries/:id { startAt?, endAt?, breakMinutes?, status? }
- Timesheets: POST /timesheets/submit { userId, weekStartDate }; POST /timesheets/:id/approve; POST /timesheets/:id/reject; GET /timesheets?userId=&weekStartDate=&status=

Vacations
- GET /vacations?userId=&from=&to=&status=
- POST /vacations { userId, startDate, endDate, type, comment? }
- PATCH /vacations/:id/approve | /reject | /cancel
- GET /vacations/calendar?year=YYYY — aggregated per user per month

RBAC (Role customization)
- GET /roles; POST /roles { name, description }
- GET /roles/:id/permissions — returns matrix with levels (FORBIDDEN|LIMITED|AUTHORIZED)
- PATCH /roles/:id/permissions { updates:[{ permissionKey, level }] }
- GET /permissions — list for UI
- PATCH /users/:id/roles { roles:[roleId] }

Documents
- POST /documents/presign { ownerType, ownerId, mime, filename, size? } -> presigned upload
- GET /documents?ownerType=&ownerId=
- DELETE /documents/:id

Exports & Reports (optional)
- POST /exports/time-entries { filter } -> task id
- GET /exports/:id/status -> download link when ready

---

## 3) RBAC Model

Permission keys (suggested):

- users:list|view|create|update|delete
- companies:list|view|create|update|delete
- time:list|create|update|approve
- vacations:list|create|approve|update|delete
- schedules:list|create|update|delete
- rates:list|create|update|delete
- documents:upload|view|delete

Levels:
- FORBIDDEN — no access
- LIMITED — access limited by scoping policy (e.g., only same company)
- AUTHORIZED — full access

Nest Guard checks permission + level; policy-handlers apply scoping (companyId/owner).

---

## 4) Validation & Rules (highlights)

- Email unique; company name unique per org (if multi-tenant)
- Time entries: no overlaps per user per day; duration computed on stop/save
- Applying rates: choose active Rate by date and type=HOUR when computing cost (extend for M2/KPL/M3 when provided)
- Vacations: prevent overlaps; optional rule to block backdated requests
- Soft delete for users/companies (status or deletedAt) to preserve history
- Password policy: Argon2; password history optional (N=5)
- Files: whitelist MIME types; all uploads via presigned URLs only

---

## 5) Mapping to UI Screens

- Users/Subcontractors lists -> GET /users, GET /companies?type=subcontractor with search/sort/pagination
- Add dialogs -> POST /users, POST /companies
- User card -> GET /users/:id plus rates/schedules endpoints
- Subcontractor card -> GET /companies/:id (+ summary, contacts, documents)
- Role customization -> /roles, /permissions, PATCH roles/:id/permissions
- Change password -> PATCH /users/:id/password
- User schedule grid -> schedules + /vacations/calendar?year=
- Employee vacations tab -> /vacations CRUD + calendar feed
- Rate and Salary / Edit hours -> /users/:id/rates and /users/:id/schedules

---

## 6) Copilot Runbook (paste tasks one by one)

Each task includes acceptance criteria. Ask Copilot Chat to “implement the task below”.

### Task A: Bootstrap NestJS + Prisma + Swagger
- Create NestJS app with modules folder and PrismaService
- Add global ValidationPipe (class-validator/zod), pino logger
- Add Swagger at /docs
- Health check GET /health returns { status: "ok" }
Acceptance: app builds, /docs works, /health ok

### Task B: Add Prisma schema (from section 1) and migrations
- Copy schema.prisma, run migrations, generate client
- Seed: system roles (Admin, Manager, Employee), base permissions with FORBIDDEN by default; assign Admin all AUTHORIZED
Acceptance: prisma migrate dev succeeds; seed populates roles/permissions

### Task C: Auth module (JWT access/refresh) + password reset
- POST /auth/login, /auth/refresh, /auth/logout
- PATCH /users/:id/password with Argon2 verify
- Password reset request/confirm with email token table
Acceptance: e2e tests cover login/refresh/password change

### Task D: RBAC module (Guard + decorator)
- @Permissions('users:view') decorator; Guard checks JWT + permission level
- Policy handler for LIMITED (scope by company membership)
Acceptance: controller endpoints protected; unit tests for guard

### Task E: Users module
- CRUD with search (ILIKE on name/email/phone), filters, pagination, sorting
- PATCH /users/:id/roles, GET user detail aggregate (profile+company+rates+schedules summary)
Acceptance: endpoints return according to contracts; search and pagination work

### Task F: Companies (Subcontractors)
- CRUD companies, contacts, summary endpoint; list filtered by type=subcontractor/customer
Acceptance: list and detail match DTOs; contacts CRUD ok

### Task G: Rates & Schedules
- Rate CRUD for types HOUR/KPL/M2/M3 with validity ranges
- Schedule CRUD (days Mon..Sun, work/lunch times, day off flag) + set default
Acceptance: schedule returned matches UI; cannot create overlapping validFrom/validTo for same type

### Task H: Time Tracking
- Time entries CRUD, timer start/stop, overlap validation, duration compute
- Timesheet submit/approve/reject; weekly aggregation
Acceptance: rejecting overlaps; computing totals; status transitions enforced

### Task I: Vacations
- CRUD + approve/reject/cancel; calendar aggregation per user per month
Acceptance: calendar endpoint returns per-month markers like in the grid; prevents overlapping vacations

### Task J: Documents (S3 presigned)
- Presign upload, list, delete; ownerType=user|company
Acceptance: presigned URL returned; list shows uploaded items

### Task K: Notifications & Preferences
- In-app notification table + simple creator on important events
- Preferences per type; “email” channel scaffolding (no-op adapter ok)
Acceptance: preferences toggle; notifications appear on events

### Task L: Audit Log
- Interceptor to write before/after snapshots on create/update/delete
Acceptance: logs written for Users/Companies/Vacations/TimeEntry changes

### Task M: Exports (optional)
- Queue job to export time-entries to CSV/XLSX; provide download when ready
Acceptance: export task lifecycle endpoints

---

## 7) DTO Samples (copy when implementing controllers)

Create user:
```json
{
  "firstName": "Albert",
  "lastName": "Flores",
  "email": "albert@example.com",
  "phone": "(217) 555-0113",
  "companyId": "cmp_123",
  "roles": ["role_employee"]
}
```

Rates:
```json
{
  "rates": [
    { "type": "HOUR", "value": 77, "currency": "USD", "validFrom": "2025-01-01" },
    { "type": "M2", "value": 136, "currency": "USD", "validFrom": "2025-01-01" }
  ]
}
```

Schedule:
```json
{
  "name": "Default",
  "timezone": "Europe/Kyiv",
  "days": [
    { "weekday": 1, "workStart": "09:00", "workEnd": "18:00", "lunchStart": "13:00", "lunchEnd": "14:00", "isDayOff": false },
    { "weekday": 6, "isDayOff": true },
    { "weekday": 7, "isDayOff": true }
  ]
}
```

Vacation:
```json
{
  "userId": "usr_123",
  "startDate": "2025-03-15",
  "endDate": "2025-03-26",
  "type": "WEEKEND",
  "comment": "Family trip"
}
```

---

## 8) Quality Gates

- Build: tsc passes, Nest app compiles
- Lint/Format: eslint + prettier
- Tests: unit for services/guards, e2e for critical controllers (auth, users, time, vacations)
- Security: rate-limit auth, validate inputs, mask PII in logs

---

## 9) Optional run commands (for docs)

```bash
# (Optional) Scaffold
npm i -g @nestjs/cli
nest new api && cd api
npm i @nestjs/swagger swagger-ui-express @prisma/client prisma @nestjs/config pino-pretty @nestjs/throttler argon2 jsonwebtoken class-validator class-transformer bullmq ioredis aws-sdk

# Prisma init & migrate
npx prisma init
npx prisma migrate dev --name init

# Start
npm run start:dev
```

---

## 10) Milestones

1) Auth + RBAC + Users CRUD
2) Companies (Subcontractors) + Contacts + Documents presign
3) Rates + Schedules
4) Time Tracking + Timesheets
5) Vacations + Calendar
6) Notifications + Audit + Exports

Deliver each milestone with Swagger docs, seeds, and e2e smoke tests.

---

Paste the tasks from Section 6 into Copilot Chat inside your backend project and iterate milestone by milestone. This document is the single source of truth for data shapes and endpoints that match your UI.
