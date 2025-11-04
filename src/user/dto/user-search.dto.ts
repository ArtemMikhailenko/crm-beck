import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export class UserSearchDto {
  @ApiPropertyOptional({
    description: 'Поиск по имени, email или телефону',
    example: 'john@example.com'
  })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({
    description: 'Фильтр по статусу пользователя',
    enum: UserStatus,
    example: UserStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

  @ApiPropertyOptional({
    description: 'Фильтр по компании (ID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  companyId?: string

  @ApiPropertyOptional({
    description: 'Фильтр по роли (ID)',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  roleId?: string

  @ApiPropertyOptional({
    description: 'Показывать только верифицированных пользователей',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isVerified?: boolean

  @ApiPropertyOptional({
    description: 'Показывать только пользователей с включенной 2FA',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isTwoFactorEnabled?: boolean

  @ApiPropertyOptional({
    description: 'Номер страницы',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Количество записей на странице',
    example: 20,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20

  @ApiPropertyOptional({
    description: 'Поле для сортировки',
    example: 'displayName',
    enum: ['displayName', 'email', 'createdAt', 'lastLoginAt']
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt'

  @ApiPropertyOptional({
    description: 'Направление сортировки',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc'
}