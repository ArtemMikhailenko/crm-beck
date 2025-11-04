import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsUUID, IsOptional, IsArray, IsEnum } from 'class-validator'
import { Transform } from 'class-transformer'
import { TimeEntryResponseDto } from './time-entry.dto'

enum TimesheetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export class CreateTimesheetDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string

  @ApiProperty({
    description: 'Дата начала недели (понедельник)',
    example: '2023-12-11'
  })
  @IsDateString()
  weekStartDate: string

  @ApiPropertyOptional({
    description: 'Массив ID записей времени для включения в табель',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  timeEntryIds?: string[]
}

export class UpdateTimesheetStatusDto {
  @ApiProperty({
    description: 'Новый статус табеля',
    enum: TimesheetStatus,
    example: TimesheetStatus.SUBMITTED
  })
  @IsEnum(TimesheetStatus)
  status: TimesheetStatus
}

export class TimesheetResponseDto {
  @ApiProperty({
    description: 'ID табеля',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string

  @ApiProperty({
    description: 'Начало недели',
    example: '2023-12-11T00:00:00Z'
  })
  weekStartDate: Date

  @ApiProperty({
    description: 'Конец недели',
    example: '2023-12-17T23:59:59Z'
  })
  weekEndDate: Date

  @ApiProperty({
    description: 'Статус табеля',
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
    example: 'SUBMITTED'
  })
  status: string

  @ApiProperty({
    description: 'Сводка времени'
  })
  summary: {
    totalMinutes: number
    totalHours: number
    entriesCount: number
    byStatus: {
      DRAFT: number
      SUBMITTED: number
      APPROVED: number
      REJECTED: number
    }
    byCompany: Array<{
      companyId: string | null
      companyName: string | null
      minutes: number
      hours: number
    }>
  }

  @ApiProperty({
    description: 'Информация о пользователе'
  })
  user: {
    id: string
    displayName: string
    email: string
  }

  @ApiProperty({
    description: 'Записи времени за неделю',
    type: 'array'
  })
  entries: Array<{
    id: string
    date: Date
    startAt?: Date
    endAt?: Date
    durationMinutes: number
    breakMinutes: number
    status: string
    company?: {
      id: string
      name: string
      type: string
    }
    notes?: string
  }>
}

export class TimeReportQueryDto {
  @ApiProperty({
    description: 'Дата начала периода',
    example: '2023-12-01'
  })
  @IsDateString()
  startDate: string

  @ApiProperty({
    description: 'Дата окончания периода',
    example: '2023-12-31'
  })
  @IsDateString()
  endDate: string

  @ApiPropertyOptional({
    description: 'ID пользователя (для фильтрации)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  userId?: string

  @ApiPropertyOptional({
    description: 'ID компании (для фильтрации)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  companyId?: string

  @ApiPropertyOptional({
    description: 'Статус записей (для фильтрации)',
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED']
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])
  status?: string
}

export class TimeReportResponseDto {
  @ApiProperty({
    description: 'Период отчёта'
  })
  period: {
    startDate: Date
    endDate: Date
  }

  @ApiProperty({
    description: 'Общая сводка по всем пользователям'
  })
  summary: {
    totalMinutes: number
    totalHours: number
    entriesCount: number
    byStatus: {
      DRAFT: number
      SUBMITTED: number
      APPROVED: number
      REJECTED: number
    }
    byCompany: Array<{
      companyId: string | null
      companyName: string | null
      minutes: number
      hours: number
    }>
  }

  @ApiProperty({
    description: 'Данные по пользователям',
    type: 'array'
  })
  users: Array<{
    user: {
      id: string
      displayName: string
      email: string
    }
    summary: {
      totalMinutes: number
      totalHours: number
      entriesCount: number
      byStatus: {
        DRAFT: number
        SUBMITTED: number
        APPROVED: number
        REJECTED: number
      }
      byCompany: Array<{
        companyId: string | null
        companyName: string | null
        minutes: number
        hours: number
      }>
    }
    entries: Array<{
      id: string
      date: Date
      startAt?: Date
      endAt?: Date
      durationMinutes: number
      breakMinutes: number
      status: string
      company?: {
        id: string
        name: string
        type: string
      }
      notes?: string
    }>
  }>

  @ApiProperty({
    description: 'Применённые фильтры'
  })
  filters: {
    userId?: string
    companyId?: string
    status?: string
  }
}