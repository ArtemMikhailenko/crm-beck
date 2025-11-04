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
  @Permissions('projects:list')
  async findAll(@Query() query: ProjectQueryDto) {
    return this.projectsService.findAll(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @Permissions('projects:view')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id)
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

