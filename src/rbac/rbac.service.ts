import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto'
import { CreatePermissionDto, UpdateRolePermissionsDto, AssignRolesDto } from './dto/permission.dto'
import { PermissionLevel } from '@prisma/client'

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  // Roles management
  async createRole(createRoleDto: CreateRoleDto) {
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    })

    if (existingRole) {
      throw new ConflictException(`Role with name '${createRoleDto.name}' already exists`)
    }

    return this.prisma.role.create({
      data: createRoleDto,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    })
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`)
    }

    return role
  }

  async updateRole(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } })

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`)
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles')
    }

    if (updateRoleDto.name) {
      const existingRole = await this.prisma.role.findFirst({
        where: {
          name: updateRoleDto.name,
          id: { not: id },
        },
      })

      if (existingRole) {
        throw new ConflictException(`Role with name '${updateRoleDto.name}' already exists`)
      }
    }

    return this.prisma.role.update({
      where: { id },
      data: updateRoleDto,
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } })

    if (!role) {
      throw new NotFoundException(`Role with ID '${id}' not found`)
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles')
    }

    // Check if role is assigned to any users
    const usersCount = await this.prisma.userRole.count({
      where: { roleId: id },
    })

    if (usersCount > 0) {
      throw new BadRequestException('Cannot delete role that is assigned to users')
    }

    return this.prisma.role.delete({ where: { id } })
  }

  // Permissions management
  async createPermission(createPermissionDto: CreatePermissionDto) {
    const existingPermission = await this.prisma.permission.findUnique({
      where: { key: createPermissionDto.key },
    })

    if (existingPermission) {
      throw new ConflictException(`Permission with key '${createPermissionDto.key}' already exists`)
    }

    return this.prisma.permission.create({
      data: createPermissionDto,
    })
  }

  async findAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: { key: 'asc' },
    })
  }

  async getRolePermissions(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`)
    }

    // Get all permissions and their levels for this role
    const allPermissions = await this.prisma.permission.findMany()
    const rolePermissionMap = new Map(
      role.permissions.map(rp => [rp.permission.key, rp.level])
    )

    return allPermissions.map(permission => ({
      key: permission.key,
      description: permission.description,
      level: rolePermissionMap.get(permission.key) || PermissionLevel.FORBIDDEN,
    }))
  }

  async updateRolePermissions(roleId: string, updateDto: UpdateRolePermissionsDto) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } })

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`)
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system role permissions')
    }

    // Process each permission update
    const updates = []
    for (const update of updateDto.updates) {
      const permission = await this.prisma.permission.findUnique({
        where: { key: update.permissionKey },
      })

      if (!permission) {
        throw new NotFoundException(`Permission with key '${update.permissionKey}' not found`)
      }

      updates.push(
        this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId,
              permissionId: permission.id,
            },
          },
          update: {
            level: update.level,
          },
          create: {
            roleId,
            permissionId: permission.id,
            level: update.level,
          },
        })
      )
    }

    await Promise.all(updates)

    return this.getRolePermissions(roleId)
  }

  // User role assignment
  async assignRolesToUser(userId: string, assignRolesDto: AssignRolesDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`)
    }

    // Verify all roles exist
    const roles = await this.prisma.role.findMany({
      where: { id: { in: assignRolesDto.roles } },
    })

    if (roles.length !== assignRolesDto.roles.length) {
      throw new BadRequestException('One or more roles not found')
    }

    // Remove existing roles and add new ones
    await this.prisma.userRole.deleteMany({
      where: { userId },
    })

    const userRoles = assignRolesDto.roles.map(roleId => ({
      userId,
      roleId,
    }))

    await this.prisma.userRole.createMany({
      data: userRoles,
    })

    return this.getUserRoles(userId)
  }

  async getUserRoles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found`)
    }

    return user.userRoles.map(ur => ur.role)
  }

  async getUserPermissions(userId: string) {
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!userWithRoles) {
      throw new NotFoundException(`User with ID '${userId}' not found`)
    }

    // Collect all permissions with highest level
    const permissionsMap = new Map<string, { key: string; description: string; level: PermissionLevel }>()

    for (const userRole of userWithRoles.userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        const key = rolePermission.permission.key
        const existing = permissionsMap.get(key)

        if (!existing || this.isHigherPermissionLevel(rolePermission.level, existing.level)) {
          permissionsMap.set(key, {
            key: rolePermission.permission.key,
            description: rolePermission.permission.description || '',
            level: rolePermission.level,
          })
        }
      }
    }

    return Array.from(permissionsMap.values()).filter(p => p.level !== PermissionLevel.FORBIDDEN)
  }

  private isHigherPermissionLevel(level1: PermissionLevel, level2: PermissionLevel): boolean {
    const hierarchy = {
      [PermissionLevel.FORBIDDEN]: 0,
      [PermissionLevel.LIMITED]: 1,
      [PermissionLevel.AUTHORIZED]: 2,
    }

    return hierarchy[level1] > hierarchy[level2]
  }
}