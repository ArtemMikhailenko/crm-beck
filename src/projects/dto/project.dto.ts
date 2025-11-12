import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, ArrayUnique } from 'class-validator'

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  REVIEW = 'REVIEW',
  PROCESS = 'PROCESS',
  PAUSE = 'PAUSE',
  REUSE = 'REUSE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateProjectDto {
  @ApiProperty({ example: 'Binford Ltd. Renovation' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '8861' })
  @IsString()
  @IsNotEmpty()
  projectId: string

  @ApiProperty({ example: 'cm7cjzqzv0006tvbfgkxpbg5b' })
  @IsString()
  @IsNotEmpty()
  clientId: string

  @ApiPropertyOptional({ example: 'user123' })
  @IsString()
  @IsOptional()
  managerId?: string

  @ApiPropertyOptional({ enum: ProjectStatus, example: ProjectStatus.PLANNING })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus

  @ApiPropertyOptional({ example: 'Project description' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({
    example: ['subc1', 'subc2'],
    description: 'IDs компаний-субподрядчиков'
  })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  subcontractorIds?: string[]
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Updated Project Name' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ example: '8861' })
  @IsString()
  @IsOptional()
  projectId?: string

  @ApiPropertyOptional({ example: 'user456' })
  @IsString()
  @IsOptional()
  managerId?: string

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string

  @ApiPropertyOptional({
    example: ['subc1', 'subc3'],
    description: 'Полная замена списка субподрядчиков (опционально)'
  })
  @IsArray()
  @ArrayUnique()
  @IsOptional()
  subcontractorIds?: string[]
}

export class ProjectQueryDto {
  @ApiPropertyOptional({ example: 'cm7cjzqzv0006tvbfgkxpbg5b' })
  @IsString()
  @IsOptional()
  clientId?: string

  @ApiPropertyOptional({ example: 'user123' })
  @IsString()
  @IsOptional()
  managerId?: string

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus

  @ApiPropertyOptional({ example: 'Binford' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  pageSize?: number

  @ApiPropertyOptional({ example: 'createdAt:desc' })
  @IsString()
  @IsOptional()
  sort?: string

  @ApiPropertyOptional({ example: 'subc1', description: 'Фильтр по ID субподрядчика' })
  @IsString()
  @IsOptional()
  subcontractorId?: string
}
