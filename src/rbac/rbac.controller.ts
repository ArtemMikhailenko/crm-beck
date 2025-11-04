import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { RbacService } from './rbac.service'
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto'
import { CreatePermissionDto, UpdateRolePermissionsDto, AssignRolesDto } from './dto/permission.dto'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { PermissionsGuard } from './guards/permissions.guard'
import { Permissions } from './decorators/permissions.decorator'

@ApiTags('RBAC')
@ApiBearerAuth()
@Controller('rbac')
@UseGuards(AuthGuard, PermissionsGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  // Roles endpoints
  @Post('roles')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  @Permissions('users:create') // Admin permission required
  @HttpCode(HttpStatus.CREATED)
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.rbacService.createRole(createRoleDto)
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles' })
  @Permissions('users:view')
  async findAllRoles() {
    return this.rbacService.findAllRoles()
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @Permissions('users:view')
  async findRoleById(@Param('id') id: string) {
    return this.rbacService.findRoleById(id)
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: 'Update role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @Permissions('users:update')
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rbacService.updateRole(id, updateRoleDto)
  }

  @Delete('roles/:id')
  @ApiOperation({ summary: 'Delete role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @Permissions('users:delete')
  async deleteRole(@Param('id') id: string) {
    return this.rbacService.deleteRole(id)
  }

  // Permissions endpoints
  @Post('permissions')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission created successfully' })
  @Permissions('users:create')
  @HttpCode(HttpStatus.CREATED)
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.rbacService.createPermission(createPermissionDto)
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiResponse({ status: 200, description: 'List of all permissions' })
  @Permissions('users:view')
  async findAllPermissions() {
    return this.rbacService.findAllPermissions()
  }

  @Get('roles/:id/permissions')
  @ApiOperation({ summary: 'Get role permissions matrix' })
  @ApiResponse({ status: 200, description: 'Role permissions with levels' })
  @Permissions('users:view')
  async getRolePermissions(@Param('id') roleId: string) {
    return this.rbacService.getRolePermissions(roleId)
  }

  @Patch('roles/:id/permissions')
  @ApiOperation({ summary: 'Update role permissions' })
  @ApiResponse({ status: 200, description: 'Role permissions updated successfully' })
  @Permissions('users:update')
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body() updateDto: UpdateRolePermissionsDto,
  ) {
    return this.rbacService.updateRolePermissions(roleId, updateDto)
  }

  // User role assignment endpoints
  @Patch('users/:id/roles')
  @ApiOperation({ summary: 'Assign roles to user' })
  @ApiResponse({ status: 200, description: 'User roles updated successfully' })
  @Permissions('users:update')
  async assignRolesToUser(@Param('id') userId: string, @Body() assignRolesDto: AssignRolesDto) {
    return this.rbacService.assignRolesToUser(userId, assignRolesDto)
  }

  @Get('users/:id/roles')
  @ApiOperation({ summary: 'Get user roles' })
  @ApiResponse({ status: 200, description: 'User roles' })
  @Permissions('users:view')
  async getUserRoles(@Param('id') userId: string) {
    return this.rbacService.getUserRoles(userId)
  }

  @Get('users/:id/permissions')
  @ApiOperation({ summary: 'Get user effective permissions' })
  @ApiResponse({ status: 200, description: 'User effective permissions' })
  @Permissions('users:view')
  async getUserPermissions(@Param('id') userId: string) {
    return this.rbacService.getUserPermissions(userId)
  }
}