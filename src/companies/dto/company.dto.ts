import { IsString, IsOptional, IsEnum, IsNotEmpty, ValidateNested, IsArray, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { CompanyType } from '@prisma/client'

export class CreateCompanyDto {
  @ApiProperty({ example: 'ABC Construction LLC' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ enum: CompanyType, example: 'SUBCONTRACTOR' })
  @IsEnum(CompanyType)
  type: CompanyType

  @ApiPropertyOptional({ example: '12345678' })
  @IsString()
  @IsOptional()
  taxId?: string

  @ApiPropertyOptional({ example: 'UA213223130000026007233566001' })
  @IsString()
  @IsOptional()
  iban?: string

  @ApiPropertyOptional({ example: '123 Main St, Kyiv, Ukraine' })
  @IsString()
  @IsOptional()
  address?: string

  @ApiPropertyOptional({ example: 'active' })
  @IsString()
  @IsOptional()
  status?: string = 'active'
}

export class UpdateCompanyDto {
  @ApiPropertyOptional({ example: 'ABC Construction LLC Updated' })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ enum: CompanyType, example: 'CUSTOMER' })
  @IsEnum(CompanyType)
  @IsOptional()
  type?: CompanyType

  @ApiPropertyOptional({ example: '12345679' })
  @IsString()
  @IsOptional()
  taxId?: string

  @ApiPropertyOptional({ example: 'UA213223130000026007233566002' })
  @IsString()
  @IsOptional()
  iban?: string

  @ApiPropertyOptional({ example: '456 Updated St, Kyiv, Ukraine' })
  @IsString()
  @IsOptional()
  address?: string

  @ApiPropertyOptional({ example: 'inactive' })
  @IsString()
  @IsOptional()
  status?: string
}

export class CreateContactDto {
  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  fullName: string

  @ApiPropertyOptional({ example: 'john.smith@company.com' })
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ example: '+380501234567' })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ example: 'Project Manager' })
  @IsString()
  @IsOptional()
  position?: string
}

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'John Smith Updated' })
  @IsString()
  @IsOptional()
  fullName?: string

  @ApiPropertyOptional({ example: 'john.smith.updated@company.com' })
  @IsString()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ example: '+380501234568' })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ example: 'Senior Project Manager' })
  @IsString()
  @IsOptional()
  position?: string
}

export class CompanyQueryDto {
  @ApiPropertyOptional({ enum: CompanyType, example: 'SUBCONTRACTOR' })
  @IsEnum(CompanyType)
  @IsOptional()
  type?: CompanyType

  @ApiPropertyOptional({ example: 'Construction' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ example: 'active' })
  @IsString()
  @IsOptional()
  status?: string

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsOptional()
  pageSize?: number = 20

  @ApiPropertyOptional({ example: 'name:asc' })
  @IsString()
  @IsOptional()
  sort?: string = 'name:asc'
}

export class UploadDocumentDto {
  @ApiProperty({ example: 'Contract Agreement' })
  @IsString()
  @IsNotEmpty()
  title: string

  @ApiProperty({ example: 'contract.pdf' })
  @IsString()
  @IsNotEmpty()
  fileName: string

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  fileType: string

  @ApiProperty({ example: 1024000 })
  @IsNumber()
  @IsNotEmpty()
  fileSize: number
}