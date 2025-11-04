import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsUUID, IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsPositive } from 'class-validator'
import { Transform } from 'class-transformer'

enum TimeEntryStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

enum TimeSource {
  MANUAL = 'MANUAL',
  TIMER = 'TIMER'
}

export class CreateTimeEntryDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string

  @ApiProperty({
    description: 'Дата записи времени',
    example: '2023-12-15'
  })
  @IsDateString()
  date: string

  @ApiPropertyOptional({
    description: 'Время начала работы',
    example: '2023-12-15T09:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startAt?: string

  @ApiPropertyOptional({
    description: 'Время окончания работы',
    example: '2023-12-15T18:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  endAt?: string

  @ApiPropertyOptional({
    description: 'Перерыв в минутах',
    example: 60,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakMinutes?: number = 0

  @ApiPropertyOptional({
    description: 'Общая продолжительность в минутах (если указано вручную)',
    example: 480,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number

  @ApiPropertyOptional({
    description: 'ID компании/проекта',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  companyId?: string

  @ApiPropertyOptional({
    description: 'Заметки о работе',
    example: 'Работал над задачами по проекту X'
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({
    description: 'Источник записи времени',
    enum: TimeSource,
    example: TimeSource.MANUAL,
    default: TimeSource.MANUAL
  })
  @IsOptional()
  @IsEnum(TimeSource)
  source?: TimeSource = TimeSource.MANUAL
}

export class UpdateTimeEntryDto {
  @ApiPropertyOptional({
    description: 'Время начала работы',
    example: '2023-12-15T09:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startAt?: string

  @ApiPropertyOptional({
    description: 'Время окончания работы',
    example: '2023-12-15T18:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  endAt?: string

  @ApiPropertyOptional({
    description: 'Перерыв в минутах',
    example: 60,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  breakMinutes?: number

  @ApiPropertyOptional({
    description: 'Общая продолжительность в минутах',
    example: 480,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number

  @ApiPropertyOptional({
    description: 'ID компании/проекта',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  companyId?: string

  @ApiPropertyOptional({
    description: 'Заметки о работе'
  })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiPropertyOptional({
    description: 'Статус записи',
    enum: TimeEntryStatus,
    example: TimeEntryStatus.SUBMITTED
  })
  @IsOptional()
  @IsEnum(TimeEntryStatus)
  status?: TimeEntryStatus
}

export class TimeEntryResponseDto {
  @ApiProperty({
    description: 'ID записи времени',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string

  @ApiProperty({
    description: 'Дата записи',
    example: '2023-12-15T00:00:00Z'
  })
  date: Date

  @ApiPropertyOptional({
    description: 'Время начала работы',
    example: '2023-12-15T09:00:00Z'
  })
  startAt?: Date

  @ApiPropertyOptional({
    description: 'Время окончания работы',
    example: '2023-12-15T18:00:00Z'
  })
  endAt?: Date

  @ApiProperty({
    description: 'Перерыв в минутах',
    example: 60
  })
  breakMinutes: number

  @ApiProperty({
    description: 'Общая продолжительность в минутах',
    example: 480
  })
  durationMinutes: number

  @ApiPropertyOptional({
    description: 'ID компании/проекта',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  companyId?: string

  @ApiProperty({
    description: 'Статус записи',
    enum: TimeEntryStatus,
    example: TimeEntryStatus.SUBMITTED
  })
  status: TimeEntryStatus

  @ApiProperty({
    description: 'Источник записи',
    enum: TimeSource,
    example: TimeSource.MANUAL
  })
  source: TimeSource

  @ApiPropertyOptional({
    description: 'Заметки о работе'
  })
  notes?: string

  @ApiPropertyOptional({
    description: 'Информация о пользователе'
  })
  user?: {
    id: string
    displayName: string
    email: string
  }

  @ApiPropertyOptional({
    description: 'Информация о компании'
  })
  company?: {
    id: string
    name: string
    type: string
  }
}