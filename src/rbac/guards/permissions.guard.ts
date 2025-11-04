import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { User, PermissionLevel } from '@prisma/client'
import { Request } from 'express'
import { PrismaService } from '@/prisma/prisma.service'
import { PERMISSIONS_KEY, PermissionRequirement } from '../decorators/permissions.decorator'

interface RequestWithUser extends Request {
  user?: User
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<PermissionRequirement[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredPermissions) {
      return true
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const user = request.user

    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }

    // Get user's roles and permissions
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
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
      throw new UnauthorizedException('User not found')
    }

    // Collect all user permissions with their levels
    const userPermissions = new Map<string, PermissionLevel>()
    
    for (const userRole of userWithRoles.userRoles) {
      for (const rolePermission of userRole.role.permissions) {
        const permissionKey = rolePermission.permission.key
        const currentLevel = userPermissions.get(permissionKey)
        
        // Take the highest permission level if user has multiple roles with same permission
        if (!currentLevel || this.isHigherPermissionLevel(rolePermission.level, currentLevel)) {
          userPermissions.set(permissionKey, rolePermission.level)
        }
      }
    }

    // Check if user has all required permissions
    for (const requirement of requiredPermissions) {
      const userPermissionLevel = userPermissions.get(requirement.key)
      const requiredLevel = requirement.level || PermissionLevel.AUTHORIZED

      if (!userPermissionLevel || !this.hasPermissionLevel(userPermissionLevel, requiredLevel)) {
        throw new ForbiddenException(
          `Insufficient permissions for '${requirement.key}' (required: ${requiredLevel}, has: ${userPermissionLevel || 'FORBIDDEN'})`
        )
      }

      // For LIMITED permissions, apply scoping policies
      if (userPermissionLevel === PermissionLevel.LIMITED) {
        await this.applyScopingPolicy(request, user, requirement.key)
      }
    }

    return true
  }

  private isHigherPermissionLevel(level1: PermissionLevel, level2: PermissionLevel): boolean {
    const hierarchy = {
      [PermissionLevel.FORBIDDEN]: 0,
      [PermissionLevel.LIMITED]: 1,
      [PermissionLevel.AUTHORIZED]: 2,
    }
    
    return hierarchy[level1] > hierarchy[level2]
  }

  private hasPermissionLevel(userLevel: PermissionLevel, requiredLevel: PermissionLevel): boolean {
    if (userLevel === PermissionLevel.FORBIDDEN) {
      return false
    }
    
    if (requiredLevel === PermissionLevel.AUTHORIZED) {
      return userLevel === PermissionLevel.AUTHORIZED
    }
    
    return userLevel === PermissionLevel.LIMITED || userLevel === PermissionLevel.AUTHORIZED
  }

  private async applyScopingPolicy(request: RequestWithUser, user: User, permissionKey: string): Promise<void> {
    // Apply scoping based on permission type
    if (permissionKey.startsWith('users:') || permissionKey.startsWith('companies:')) {
      // For LIMITED users permissions, only allow access to same company users
      // This is a simplified policy - in real app you'd have more complex logic
      const userMemberships = await this.prisma.userCompanyMembership.findMany({
        where: { userId: user.id },
        select: { companyId: true },
      })

      // Store user's company IDs in request for later use by controllers
      request['userCompanyIds'] = userMemberships.map(m => m.companyId)
    }
  }
}