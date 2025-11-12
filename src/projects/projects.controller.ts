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
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger'
import { ProjectsService } from './projects.service'
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto, ProjectStatus } from './dto/project.dto'
import { Permissions } from '@/rbac/decorators/permissions.decorator'

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
// TODO: Temporarily disabled for testing - re-enable later
// @UseGuards(AuthGuard, PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @Permissions('projects:create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto)
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client company ID' })
  @ApiQuery({ name: 'managerId', required: false, description: 'Filter by manager ID' })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name, projectId, or description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort field and direction (e.g., name:asc)' })
  @ApiQuery({ name: 'subcontractorId', required: false, description: 'Filter by subcontractor company ID' })
  @Permissions('projects:list')
  async findAll(@Query() query: ProjectQueryDto) {
    // Coerce pagination query params to numbers to satisfy Prisma (skip/take expect Int)
    const pageNum = query.page === undefined ? undefined : Number(query.page)
    const pageSizeNum = query.pageSize === undefined ? undefined : Number(query.pageSize)
    return this.projectsService.findAll({ ...query, page: pageNum, pageSize: pageSizeNum })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @Permissions('projects:view')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id)
  }

  @Get(':id/subcontractors')
  @ApiOperation({ summary: 'Get subcontractors for a project' })
  @ApiResponse({ status: 200, description: 'List of subcontractors for the project' })
  @Permissions('projects:view')
  async getSubcontractors(@Param('id') id: string) {
    return this.projectsService.getProjectSubcontractors(id)
  }

  @Post(':id/subcontractors')
  @ApiOperation({ summary: 'Add subcontractors to a project' })
  @ApiResponse({ status: 200, description: 'Subcontractors added' })
  @Permissions('projects:update')
  async addSubcontractors(@Param('id') id: string, @Body('subcontractorIds') subcontractorIds: string[]) {
    return this.projectsService.addSubcontractors(id, subcontractorIds)
  }

  @Delete(':id/subcontractors/:companyId')
  @ApiOperation({ summary: 'Remove subcontractor from a project' })
  @ApiResponse({ status: 200, description: 'Subcontractor removed' })
  @Permissions('projects:update')
  async removeSubcontractor(@Param('id') id: string, @Param('companyId') companyId: string) {
    return this.projectsService.removeSubcontractor(id, companyId)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @Permissions('projects:update')
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @Permissions('projects:delete')
  async remove(@Param('id') id: string) {
    return this.projectsService.remove(id)
  }
}

