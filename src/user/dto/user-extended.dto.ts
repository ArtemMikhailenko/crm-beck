import { IsOptional, IsString, IsArray, IsObject, IsDecimal, IsBoolean, IsEmail, IsNotEmpty } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { Decimal } from '@prisma/client/runtime/library'

// DTO для обновления ставок и расписания
export class UpdateUserRatesDto {
  @ApiPropertyOptional({ description: 'Ставка за час работы', type: Number })
  @IsOptional()
  @Type(() => Number)
  ratePerHour?: number | Decimal

  @ApiPropertyOptional({ description: 'Ставка за погонный метр', type: Number })
  @IsOptional()
  @Type(() => Number)
  ratePerLinearMeter?: number | Decimal

  @ApiPropertyOptional({ description: 'Ставка за квадратный метр', type: Number })
  @IsOptional()
  @Type(() => Number)
  ratePerM2?: number | Decimal

  @ApiPropertyOptional({ description: 'Типы работ', type: [String], example: ['Монтаж', 'Демонтаж'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  workTypes?: string[]

  @ApiPropertyOptional({ 
    description: 'Расписание работы (JSON объект)', 
    type: Object,
    example: { monday: '9:00-18:00', tuesday: '9:00-18:00' }
  })
  @IsOptional()
  @IsObject()
  workSchedule?: Record<string, any>
}

// DTO для создания контакта пользователя
export class CreateUserContactDto {
  @ApiProperty({ description: 'Имя контакта', example: 'Иван Иванов' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional({ description: 'Телефон', example: '+380501234567' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: 'Email', example: 'contact@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ description: 'Отношение (друг, родственник и т.д.)', example: 'Друг' })
  @IsOptional()
  @IsString()
  relation?: string

  @ApiPropertyOptional({ description: 'Является ли основным контактом', default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

// DTO для обновления контакта
export class UpdateUserContactDto {
  @ApiPropertyOptional({ description: 'Имя контакта' })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({ description: 'Телефон' })
  @IsOptional()
  @IsString()
  phone?: string

  @ApiPropertyOptional({ description: 'Email' })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({ description: 'Отношение' })
  @IsOptional()
  @IsString()
  relation?: string

  @ApiPropertyOptional({ description: 'Является ли основным контактом' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean
}

// DTO для создания отпуска пользователя
export class CreateUserVacationDto {
  @ApiProperty({ description: 'Название отпуска', example: 'Отпуск 2024' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ description: 'Дата начала', example: '2024-12-01T00:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  startDate: Date

  @ApiProperty({ description: 'Дата окончания', example: '2024-12-15T00:00:00Z' })
  @IsNotEmpty()
  @Type(() => Date)
  endDate: Date

  @ApiPropertyOptional({ description: 'Описание', example: 'Ежегодный оплачиваемый отпуск' })
  @IsOptional()
  @IsString()
  description?: string
}

// DTO для обновления отпуска
export class UpdateUserVacationDto {
  @ApiPropertyOptional({ description: 'Название отпуска' })
  @IsOptional()
  @IsString()
  title?: string

  @ApiPropertyOptional({ description: 'Дата начала' })
  @IsOptional()
  @Type(() => Date)
  startDate?: Date

  @ApiPropertyOptional({ description: 'Дата окончания' })
  @IsOptional()
  @Type(() => Date)
  endDate?: Date

  @ApiPropertyOptional({ description: 'Описание' })
  @IsOptional()
  @IsString()
  description?: string
}

// DTO для настроек уведомлений
export class UpdateUserAlertSettingsDto {
  @ApiProperty({ description: 'Тип уведомления', example: 'email', enum: ['email', 'sms', 'push'] })
  @IsString()
  @IsNotEmpty()
  alertType: string

  @ApiProperty({ description: 'Категория', example: 'vacation', enum: ['vacation', 'timesheet', 'schedule', 'system'] })
  @IsString()
  @IsNotEmpty()
  category: string

  @ApiProperty({ description: 'Включено/выключено', example: true })
  @IsBoolean()
  isEnabled: boolean
}
