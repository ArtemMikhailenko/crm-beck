import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { CompaniesService } from './companies.service'
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CreateContactDto, 
  UpdateContactDto,
  CompanyQueryDto 
} from './dto/company.dto'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { PermissionsGuard } from '@/rbac/guards/permissions.guard'
import { Permissions } from '@/rbac/decorators/permissions.decorator'

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
// TODO: Temporarily disabled for testing - re-enable later
// @UseGuards(AuthGuard, PermissionsGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({ status: 201, description: 'Company created successfully' })
  // TODO: Temporarily disabled for testing - re-enable later
  // @Permissions('companies:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of companies' })
  @ApiQuery({ name: 'type', required: false, enum: ['CUSTOMER', 'SUBCONTRACTOR', 'INTERNAL'] })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, address, or tax ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field and direction (e.g., name:asc)' })
  // TODO: Temporarily disabled for testing - re-enable later
  // @Permissions('companies:list')
  async findAll(@Query() query: CompanyQueryDto) {
    return this.companiesService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by ID' })
  @ApiResponse({ status: 200, description: 'Company details' })
  @Permissions('companies:view')
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({ status: 200, description: 'Company updated successfully' })
  @Permissions('companies:update')
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({ status: 200, description: 'Company deleted successfully' })
  @Permissions('companies:delete')
  async remove(@Param('id') id: string) {
    return this.companiesService.remove(id)
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Get company summary with statistics' })
  @ApiResponse({ status: 200, description: 'Company summary data' })
  @Permissions('companies:view')
  async getSummary(@Param('id') id: string) {
    return this.companiesService.getSummary(id)
  }

  // Contact management endpoints
  @Get(':id/contacts')
  @ApiOperation({ summary: 'Get all company contacts' })
  @ApiResponse({ status: 200, description: 'Contacts retrieved successfully' })
  @Permissions('companies:read')
  async getContacts(@Param('id') companyId: string) {
    return this.companiesService.getContacts(companyId)
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Add contact to company' })
  @ApiResponse({ status: 201, description: 'Contact added successfully' })
  @Permissions('companies:update')
  @HttpCode(HttpStatus.CREATED)
  async createContact(
    @Param('id') companyId: string,
    @Body() createContactDto: CreateContactDto
  ) {
    return this.companiesService.createContact(companyId, createContactDto)
  }

  @Patch('contacts/:contactId')
  @ApiOperation({ summary: 'Update company contact' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @Permissions('companies:update')
  async updateContact(
    @Param('contactId') contactId: string,
    @Body() updateContactDto: UpdateContactDto
  ) {
    return this.companiesService.updateContact(contactId, updateContactDto)
  }

  @Delete('contacts/:contactId')
  @ApiOperation({ summary: 'Delete company contact' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  @Permissions('companies:update')
  async removeContact(@Param('contactId') contactId: string) {
    return this.companiesService.removeContact(contactId)
  }

  // Documents
  @Get(':id/documents')
  @ApiOperation({ summary: 'Get all company documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @Permissions('companies:read')
  async getDocuments(@Param('id') id: string) {
    return this.companiesService.getDocuments(id)
  }

  @Post(':id/documents/upload')
  @ApiOperation({ summary: 'Initiate document upload' })
  @ApiResponse({ 
    status: 200, 
    description: 'Upload URL generated successfully',
    schema: {
      properties: {
        documentId: { type: 'string' },
        uploadUrl: { type: 'string' },
        fileKey: { type: 'string' },
        expiresIn: { type: 'number' }
      }
    }
  })
  @Permissions('companies:update')
  async initiateDocumentUpload(
    @Param('id') id: string,
    @Body() uploadDto: any, // UploadDocumentDto
  ) {
    return this.companiesService.initiateDocumentUpload(id, uploadDto)
  }

  @Post(':id/documents/:documentId/confirm')
  @ApiOperation({ summary: 'Confirm document upload' })
  @ApiResponse({ status: 200, description: 'Document upload confirmed' })
  @Permissions('companies:update')
  async confirmDocumentUpload(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.companiesService.confirmDocumentUpload(id, documentId)
  }

  @Delete(':id/documents/:documentId')
  @ApiOperation({ summary: 'Delete company document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @Permissions('companies:update')
  async deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.companiesService.deleteDocument(id, documentId)
  }

  // Projects
  @Get(':id/projects')
  @ApiOperation({ summary: 'Get all company projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  @Permissions('companies:read')
  async getProjects(@Param('id') id: string, @Query() query: any) {
    return this.companiesService.getProjects(id, query)
  }
}
