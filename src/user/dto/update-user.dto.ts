import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEnum, IsOptional, IsString, IsEmail, IsUrl, IsPhoneNumber } from 'class-validator'

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'john.doe@example.com'
  })
  @IsOptional()
  @IsEmail()
  email?: string

  @ApiPropertyOptional({
    description: 'Отображаемое имя пользователя',
    example: 'John Doe'
  })
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'John'
  })
  @IsOptional()
  @IsString()
  firstName?: string

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    example: 'Doe'
  })
  @IsOptional()
  @IsString()
  lastName?: string

  @ApiPropertyOptional({
    description: 'Номер телефона',
    example: '+380501234567'
  })
  @IsOptional()
  @IsPhoneNumber()
  phone?: string

  @ApiPropertyOptional({
    description: 'URL аватара',
    example: 'https://example.com/avatar.jpg'
  })
  @IsOptional()
  @IsUrl()
  picture?: string

  @ApiPropertyOptional({
    description: 'Статус пользователя',
    enum: UserStatus,
    example: UserStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

  @ApiPropertyOptional({
    description: 'Включена ли двухфакторная аутентификация',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled?: boolean

  @ApiPropertyOptional({
    description: 'Подтвержден ли email',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean

  @ApiPropertyOptional({
    description: 'ID компании для привязки пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsString()
  companyId?: string

  @ApiPropertyOptional({
    description: 'Часовой пояс пользователя',
    example: 'Europe/Kiev'
  })
  @IsOptional()
  @IsString()
  timezone?: string
}