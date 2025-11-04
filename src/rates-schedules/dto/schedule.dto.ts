import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsUUID, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber, Min, Max, Matches } from 'class-validator'
import { Type } from 'class-transformer'

export class ScheduleDayDto {
  @ApiProperty({
    description: 'День недели (1=Понедельник, 7=Воскресенье)',
    example: 1,
    minimum: 1,
    maximum: 7
  })
  @IsNumber()
  @Min(1)
  @Max(7)
  weekday: number

  @ApiPropertyOptional({
    description: 'Время начала рабочего дня',
    example: '09:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'workStart must be in format HH:MM' })
  workStart?: string

  @ApiPropertyOptional({
    description: 'Время окончания рабочего дня',
    example: '18:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'workEnd must be in format HH:MM' })
  workEnd?: string

  @ApiPropertyOptional({
    description: 'Время начала обеда',
    example: '12:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'lunchStart must be in format HH:MM' })
  lunchStart?: string

  @ApiPropertyOptional({
    description: 'Время окончания обеда',
    example: '13:00',
    pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'lunchEnd must be in format HH:MM' })
  lunchEnd?: string

  @ApiPropertyOptional({
    description: 'Выходной день',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isDayOff?: boolean = false
}

export class CreateScheduleDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string

  @ApiProperty({
    description: 'Название расписания',
    example: 'Основное расписание'
  })
  @IsString()
  name: string

  @ApiPropertyOptional({
    description: 'Часовой пояс',
    example: 'Europe/Kiev',
    default: 'Europe/Kiev'
  })
  @IsOptional()
  @IsString()
  timezone?: string = 'Europe/Kiev'

  @ApiPropertyOptional({
    description: 'Установить как расписание по умолчанию',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false

  @ApiProperty({
    description: 'Дни недели с рабочим временем',
    type: [ScheduleDayDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  days: ScheduleDayDto[]
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({
    description: 'Название расписания',
    example: 'Обновленное расписание'
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({
    description: 'Часовой пояс',
    example: 'Europe/Warsaw'
  })
  @IsOptional()
  @IsString()
  timezone?: string

  @ApiPropertyOptional({
    description: 'Установить как расписание по умолчанию',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean

  @ApiPropertyOptional({
    description: 'Дни недели с рабочим временем',
    type: [ScheduleDayDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  days?: ScheduleDayDto[]
}

export class ScheduleResponseDto {
  @ApiProperty({
    description: 'ID расписания',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string

  @ApiProperty({
    description: 'Название расписания',
    example: 'Основное расписание'
  })
  name: string

  @ApiProperty({
    description: 'Часовой пояс',
    example: 'Europe/Kiev'
  })
  timezone: string

  @ApiProperty({
    description: 'Расписание по умолчанию',
    example: true
  })
  isDefault: boolean

  @ApiProperty({
    description: 'Дни недели с рабочим временем',
    type: [ScheduleDayDto]
  })
  days: ScheduleDayDto[]

  @ApiPropertyOptional({
    description: 'Информация о пользователе'
  })
  user?: {
    id: string
    displayName: string
    email: string
  }
}