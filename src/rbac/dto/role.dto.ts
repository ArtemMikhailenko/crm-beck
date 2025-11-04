import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateRoleDto {
  @ApiProperty({ example: 'Project Manager' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiPropertyOptional({ example: 'Manages project timelines and resources' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean = false
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Senior Project Manager' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ example: 'Manages multiple projects and teams' })
  @IsString()
  @IsOptional()
  description?: string
}