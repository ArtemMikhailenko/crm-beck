import { IsEnum, IsNotEmpty, IsString, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { PermissionLevel } from '@prisma/client'

export class CreatePermissionDto {
  @ApiProperty({ example: 'users:view' })
  @IsString()
  @IsNotEmpty()
  key: string

  @ApiProperty({ example: 'Permission to view user details' })
  @IsString()
  @IsNotEmpty()
  description: string
}

export class PermissionUpdateDto {
  @ApiProperty({ example: 'users:view' })
  @IsString()
  @IsNotEmpty()
  permissionKey: string

  @ApiProperty({ enum: PermissionLevel, example: 'AUTHORIZED' })
  @IsEnum(PermissionLevel)
  level: PermissionLevel
}

export class UpdateRolePermissionsDto {
  @ApiProperty({ type: [PermissionUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionUpdateDto)
  updates: PermissionUpdateDto[]
}

export class AssignRolesDto {
  @ApiProperty({ type: [String], example: ['role-id-1', 'role-id-2'] })
  @IsArray()
  @IsString({ each: true })
  roles: string[]
}