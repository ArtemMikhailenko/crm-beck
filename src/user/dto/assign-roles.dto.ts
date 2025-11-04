import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsString, IsUUID } from 'class-validator'

export class AssignRolesDto {
  @ApiProperty({
    description: 'Массив ID ролей для назначения пользователю',
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-9f12-345678901234'],
    type: [String]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[]
}

export class UserRoleResponseDto {
  @ApiProperty({
    description: 'ID роли',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'Название роли',
    example: 'Manager'
  })
  name: string

  @ApiProperty({
    description: 'Описание роли',
    example: 'Менеджер проектов'
  })
  description: string

  @ApiProperty({
    description: 'Активна ли роль',
    example: true
  })
  isActive: boolean
}