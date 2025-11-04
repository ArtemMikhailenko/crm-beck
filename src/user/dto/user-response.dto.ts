import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserRoleResponseDto } from './assign-roles.dto'

enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE', 
  SUSPENDED = 'SUSPENDED'
}

enum AuthMethod {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE'
}

export class CompanyInfoDto {
  @ApiProperty({
    description: 'ID компании',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'Название компании',
    example: 'ООО "Строительная Компания"'
  })
  name: string

  @ApiProperty({
    description: 'Тип компании',
    example: 'CONTRACTOR'
  })
  type: string
}

export class UserDetailResponseDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'Email пользователя',
    example: 'john.doe@example.com'
  })
  email: string

  @ApiProperty({
    description: 'Отображаемое имя',
    example: 'John Doe'
  })
  displayName: string

  @ApiPropertyOptional({
    description: 'Имя',
    example: 'John'
  })
  firstName?: string

  @ApiPropertyOptional({
    description: 'Фамилия',
    example: 'Doe'
  })
  lastName?: string

  @ApiPropertyOptional({
    description: 'Номер телефона',
    example: '+380501234567'
  })
  phone?: string

  @ApiPropertyOptional({
    description: 'URL аватара',
    example: 'https://example.com/avatar.jpg'
  })
  picture?: string

  @ApiProperty({
    description: 'Статус пользователя',
    enum: UserStatus,
    example: UserStatus.ACTIVE
  })
  status: UserStatus

  @ApiProperty({
    description: 'Метод аутентификации',
    enum: AuthMethod,
    example: AuthMethod.EMAIL
  })
  method: AuthMethod

  @ApiProperty({
    description: 'Подтвержден ли email',
    example: true
  })
  isVerified: boolean

  @ApiProperty({
    description: 'Включена ли 2FA',
    example: false
  })
  isTwoFactorEnabled: boolean

  @ApiPropertyOptional({
    description: 'Часовой пояс',
    example: 'Europe/Kiev'
  })
  timezone?: string

  @ApiPropertyOptional({
    description: 'Дата последнего входа',
    example: '2023-12-01T10:00:00Z'
  })
  lastLoginAt?: Date

  @ApiProperty({
    description: 'Дата создания',
    example: '2023-11-01T10:00:00Z'
  })
  createdAt: Date

  @ApiProperty({
    description: 'Дата обновления',
    example: '2023-12-01T10:00:00Z'
  })
  updatedAt: Date

  @ApiPropertyOptional({
    description: 'Информация о компании',
    type: CompanyInfoDto
  })
  company?: CompanyInfoDto

  @ApiProperty({
    description: 'Роли пользователя',
    type: [UserRoleResponseDto]
  })
  roles: UserRoleResponseDto[]
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'Список пользователей',
    type: [UserDetailResponseDto]
  })
  users: UserDetailResponseDto[]

  @ApiProperty({
    description: 'Общее количество пользователей',
    example: 150
  })
  total: number

  @ApiProperty({
    description: 'Текущая страница',
    example: 1
  })
  page: number

  @ApiProperty({
    description: 'Количество записей на странице',
    example: 20
  })
  limit: number

  @ApiProperty({
    description: 'Общее количество страниц',
    example: 8
  })
  totalPages: number
}