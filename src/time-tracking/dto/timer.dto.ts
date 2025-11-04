import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsOptional, IsString, IsDateString, IsInt, Min } from 'class-validator'

export class StartTimerDto {
  @ApiPropertyOptional({
    description: 'ID компании/проекта',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  companyId?: string

  @ApiPropertyOptional({
    description: 'Заметки о том, над чем работаем',
    example: 'Работаю над задачей #123'
  })
  @IsOptional()
  @IsString()
  notes?: string
}

export class StopTimerDto {
  @ApiPropertyOptional({
    description: 'Время перерыва в минутах',
    example: 30,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  breakMinutes?: number

  @ApiPropertyOptional({
    description: 'Обновить заметки при остановке таймера',
    example: 'Завершил работу над задачей #123'
  })
  @IsOptional()
  @IsString()
  notes?: string
}

export class TimerStatusDto {
  @ApiProperty({
    description: 'Активен ли таймер',
    example: true
  })
  isActive: boolean

  @ApiPropertyOptional({
    description: 'ID текущей записи времени',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  timeEntryId?: string

  @ApiPropertyOptional({
    description: 'Время начала текущей сессии',
    example: '2023-12-15T09:00:00Z'
  })
  startedAt?: Date

  @ApiPropertyOptional({
    description: 'Время окончания сессии (если таймер остановлен)',
    example: '2023-12-15T18:00:00Z'
  })
  endedAt?: Date

  @ApiPropertyOptional({
    description: 'Общее время в минутах с начала работы',
    example: 125
  })
  elapsedMinutes?: number

  @ApiPropertyOptional({
    description: 'Рабочее время в минутах (без перерывов)',
    example: 95
  })
  currentDuration?: number

  @ApiPropertyOptional({
    description: 'ID компании/проекта',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  companyId?: string

  @ApiPropertyOptional({
    description: 'Заметки о текущей работе'
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