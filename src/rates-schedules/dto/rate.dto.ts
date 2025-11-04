import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDecimal, IsEnum, IsString, IsUUID, IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'

enum RateType {
  HOUR = 'HOUR',
  KPL = 'KPL',
  M2 = 'M2',
  M3 = 'M3'
}

export class CreateRateDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  userId: string

  @ApiProperty({
    description: 'Тип ставки',
    enum: RateType,
    example: RateType.HOUR
  })
  @IsEnum(RateType)
  type: RateType

  @ApiProperty({
    description: 'Размер ставки',
    example: 25.50,
    type: Number
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value: number

  @ApiPropertyOptional({
    description: 'Валюта',
    example: 'USD',
    default: 'USD'
  })
  @IsOptional()
  @IsString()
  currency?: string = 'USD'

  @ApiProperty({
    description: 'Дата начала действия ставки',
    example: '2023-12-01T00:00:00Z'
  })
  @IsDateString()
  validFrom: string

  @ApiPropertyOptional({
    description: 'Дата окончания действия ставки',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  validTo?: string
}

export class UpdateRateDto {
  @ApiPropertyOptional({
    description: 'Тип ставки',
    enum: RateType,
    example: RateType.HOUR
  })
  @IsOptional()
  @IsEnum(RateType)
  type?: RateType

  @ApiPropertyOptional({
    description: 'Размер ставки',
    example: 30.00,
    type: Number
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value?: number

  @ApiPropertyOptional({
    description: 'Валюта',
    example: 'EUR'
  })
  @IsOptional()
  @IsString()
  currency?: string

  @ApiPropertyOptional({
    description: 'Дата начала действия ставки',
    example: '2023-12-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string

  @ApiPropertyOptional({
    description: 'Дата окончания действия ставки',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  validTo?: string
}

export class RateResponseDto {
  @ApiProperty({
    description: 'ID ставки',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string

  @ApiProperty({
    description: 'ID пользователя',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  userId: string

  @ApiProperty({
    description: 'Тип ставки',
    enum: RateType,
    example: RateType.HOUR
  })
  type: RateType

  @ApiProperty({
    description: 'Размер ставки',
    example: 25.50
  })
  value: number

  @ApiProperty({
    description: 'Валюта',
    example: 'USD'
  })
  currency: string

  @ApiProperty({
    description: 'Дата начала действия',
    example: '2023-12-01T00:00:00Z'
  })
  validFrom: Date

  @ApiPropertyOptional({
    description: 'Дата окончания действия',
    example: '2024-12-31T23:59:59Z'
  })
  validTo?: Date

  @ApiPropertyOptional({
    description: 'Информация о пользователе'
  })
  user?: {
    id: string
    displayName: string
    email: string
  }
}