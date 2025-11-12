import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ConflictException
} from '@nestjs/common'
import { hash, verify } from 'argon2'

import { PrismaService } from '@/prisma/prisma.service'
import { ChangePasswordDto } from '@/user/dto/change-password.dto'
import { UserDto } from '@/user/dto/user.dto'

@Injectable()
export class UserService {
  public constructor(private readonly db: PrismaService) {}

  public async findById(id: string) {
    const user = await this.db.user.findUnique({
      where: {
        id
      },
      include: {
        accounts: true,
        company: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return user
  }

  public async findByEmail(email: string) {
    const user = await this.db.user.findUnique({
      where: {
        email
      },
      include: {
        accounts: true,
        company: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    return user
  }

  public async create(
    email: string,
    password: string,
    displayName: string,
    picture: string,
    method: any,
    isVerified: boolean
  ) {
    const user = await this.db.user.create({
      data: {
        email,
        passwordHash: password ? await hash(password) : '',
        displayName,
        picture,
        method,
        isVerified
      },
      include: {
        accounts: true,
        company: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    // Assign default Admin role if present
    try {
      const adminRole = await this.db.role.findFirst({ where: { name: 'Admin' } })
      if (adminRole) {
        await this.db.userRole.create({
          data: { userId: user.id, roleId: adminRole.id }
        })
        // reload include
        return this.findById(user.id)
      }
    } catch (e) {
      // ignore role assignment errors and return created user
    }

    return user
  }

  public async updateProfile(id: string, dto: UserDto) {
    const user = await this.findById(id)

    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: {
        email: dto.email,
        displayName: dto.displayName,
        isTwoFactorEnabled: dto.isTwoFactorEnabled
      }
    })

    return updatedUser
  }

  public async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.findById(id)

    if (!user.passwordHash) {
      throw new UnauthorizedException('User has no password set')
    }

    const isCurrentPasswordValid = await verify(
      user.passwordHash,
      dto.currentPassword
    )

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect')
    }

    const hashedNewPassword = await hash(dto.newPassword)

    await this.db.user.update({
      where: { id: user.id },
      data: { passwordHash: hashedNewPassword }
    })

    return { message: 'Password updated successfully' }
  }

  // Новые методы для расширенного управления пользователями
  public async findAll(searchParams: any = {}) {
    // Преобразуем строковые параметры в числа
    const limit = searchParams.limit ? parseInt(searchParams.limit, 10) : 20
    const page = searchParams.page ? parseInt(searchParams.page, 10) : 1
    const skip = (page - 1) * limit

    // Временная простая реализация - позже добавим полную функциональность
    const users = await this.db.user.findMany({
      include: {
        company: true,
        userRoles: {
          include: {
            role: true
          }
        }
      },
      take: limit,
      skip: skip
    })

    const total = await this.db.user.count()

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  public async createUser(userData: any) {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.db.user.findUnique({
      where: { email: userData.email }
    })

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует')
    }

    // Хешируем пароль, если он предоставлен
    const passwordHash = userData.password ? await hash(userData.password) : ''

    // Создаем пользователя (только поля, которые существуют в схеме)
    const user = await this.db.user.create({
      data: {
        email: userData.email,
        passwordHash,
        displayName: userData.displayName || userData.email,
        picture: userData.picture || null,
        method: userData.method || 'CREDENTIALS',
        isVerified: userData.isVerified || false,
        companyId: userData.companyId || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        phone: userData.phone || null,
        status: userData.status || 'active',
        avatarUrl: userData.avatarUrl || null,
        description: userData.description || null,
        timezone: userData.timezone || 'Europe/Kiev'
      },
        include: {
          company: true,
          userRoles: {
            include: {
              role: true
            }
          }
        }
      })

      // Если указаны роли, назначаем их
      if (userData.roleIds && userData.roleIds.length > 0) {
        await this.assignRoles(user.id, userData.roleIds)
        return this.findById(user.id)
      }

      // По умолчанию назначаем роль Admin (если существует)
      try {
        const adminRole = await this.db.role.findFirst({ where: { name: 'Admin' } })
        if (adminRole) {
          await this.db.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
            update: {},
            create: { userId: user.id, roleId: adminRole.id }
          })
        }
      } catch (e) {
        // ignore
      }

      return this.findById(user.id)
  }

  public async updateUser(id: string, updateData: any) {
    // Временная реализация
    const user = await this.findById(id)
    
    // Список разрешенных полей для обновления
    const allowedFields = [
      'email', 'phone', 'firstName', 'lastName', 'displayName',
      'avatarUrl', 'picture', 'description', 'status', 'timezone',
      'ratePerHour', 'ratePerLinearMeter', 'ratePerM2',
      'workTypes', 'workSchedule',
      'isVerified', 'isTwoFactorEnabled'
    ]
    
    // Фильтруем только разрешенные поля (description просто игнорируется)
    const data: any = {}
    for (const key of Object.keys(updateData)) {
      if (allowedFields.includes(key)) {
        data[key] = updateData[key]
      }
    }
    
    // Преобразуем companyId в вложенный объект company для Prisma
    if ('companyId' in updateData) {
      const companyId = updateData.companyId
      
      if (companyId) {
        data.company = {
          connect: { id: companyId }
        }
      } else {
        data.company = {
          disconnect: true
        }
      }
    }
    
    const updatedUser = await this.db.user.update({
      where: { id },
      data,
      include: {
        company: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    return updatedUser
  }

  public async deleteUser(id: string) {
    await this.findById(id) // Проверяем существование

    await this.db.user.delete({
      where: { id }
    })

    return { message: 'User deleted successfully' }
  }

  public async assignRoles(userId: string, roleIdentifiers: string[]) {
    await this.findById(userId) // ensure user exists

    // Normalize input: may contain IDs (cuid) or names (Admin, admin)
    const cleaned = (roleIdentifiers || [])
      .map(r => (r || '').trim())
      .filter(r => r.length > 0)

    if (cleaned.length === 0) {
      // If empty array provided, just remove all roles
      await this.db.userRole.deleteMany({ where: { userId } })
      return this.findById(userId)
    }

    // Split potential IDs vs names (simple heuristic: cuid starts with 'c' and length > 20)
    const possibleIds = cleaned.filter(r => /^c[a-z0-9]{4,}/i.test(r))
    const possibleNames = cleaned.filter(r => !/^c[a-z0-9]{4,}/i.test(r))

    const normalize = (name: string) => (name || '').trim().toLowerCase()

    // Fetch roles by IDs OR by case-insensitive name equals
    const roles = await this.db.role.findMany({
      where: {
        OR: [
          possibleIds.length ? { id: { in: possibleIds } } : undefined,
          ...possibleNames.map(n => ({ name: { equals: n, mode: 'insensitive' as const } }))
        ].filter(Boolean) as any
      }
    })

    // Map found role IDs
    const resolvedRoleIds = roles.map(r => r.id)

    // Validate that every identifier was resolved either as an ID or via name variant match
    const lowerNameSet = new Set(roles.map(r => r.name.toLowerCase()))
    const unresolved = cleaned.filter(identifier => {
      if (resolvedRoleIds.includes(identifier)) return false
      return !lowerNameSet.has(identifier.toLowerCase())
    })

    if (unresolved.length > 0) {
      // provide available roles for clarity
      const available = await this.db.role.findMany({ select: { id: true, name: true } })
      const availableList = available.map(r => `${r.name} (${r.id})`).join(', ')
      throw new BadRequestException(
        `One or more roles not found: ${unresolved.join(', ')}. Available roles: ${availableList}`
      )
    }

    const uniqueRoleIds = Array.from(new Set(resolvedRoleIds))

    await this.db.$transaction(async prisma => {
      await prisma.userRole.deleteMany({ where: { userId } })
      if (uniqueRoleIds.length) {
        await prisma.userRole.createMany({
          data: uniqueRoleIds.map(roleId => ({ userId, roleId }))
        })
      }
    })

    return this.findById(userId)
  }
  // ========== Extended User Management Methods ==========

  // Rates and Schedule Management
  public async updateUserRates(userId: string, ratesData: any) {
    await this.findById(userId) // Check if user exists

    const updateData: any = {}
    if (ratesData.ratePerHour !== undefined) updateData.ratePerHour = ratesData.ratePerHour
    if (ratesData.ratePerLinearMeter !== undefined) updateData.ratePerLinearMeter = ratesData.ratePerLinearMeter
    if (ratesData.ratePerM2 !== undefined) updateData.ratePerM2 = ratesData.ratePerM2
    if (ratesData.workTypes !== undefined) updateData.workTypes = ratesData.workTypes
    if (ratesData.workSchedule !== undefined) updateData.workSchedule = ratesData.workSchedule

    const updatedUser = await this.db.user.update({
      where: { id: userId },
      data: updateData
    })

    return updatedUser
  }

  // User Contacts Management
  public async getUserContacts(userId: string) {
    await this.findById(userId) // Check if user exists

    return this.db.userContact.findMany({
      where: { userId },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    })
  }

  public async createUserContact(userId: string, contactData: any) {
    await this.findById(userId) // Check if user exists

    // Валидация обязательных полей
    if (!contactData.name) {
      throw new BadRequestException('name is required')
    }

    // If this contact is marked as primary, unmark all other contacts
    if (contactData.isPrimary) {
      await this.db.userContact.updateMany({
        where: { userId },
        data: { isPrimary: false }
      })
    }

    return this.db.userContact.create({
      data: {
        userId,
        name: contactData.name,
        phone: contactData.phone || null,
        email: contactData.email || null,
        relation: contactData.relation || null,
        isPrimary: contactData.isPrimary || false
      }
    })
  }

  public async updateUserContact(contactId: string, contactData: any) {
    const contact = await this.db.userContact.findUnique({
      where: { id: contactId }
    })

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    // If this contact is marked as primary, unmark all other contacts
    if (contactData.isPrimary) {
      await this.db.userContact.updateMany({
        where: { userId: contact.userId },
        data: { isPrimary: false }
      })
    }

    // Подготавливаем данные для обновления (только разрешенные поля)
    const updateData: any = {}
    
    if (contactData.name !== undefined) {
      updateData.name = contactData.name
    }
    if (contactData.phone !== undefined) {
      updateData.phone = contactData.phone
    }
    if (contactData.email !== undefined) {
      updateData.email = contactData.email
    }
    if (contactData.relation !== undefined) {
      updateData.relation = contactData.relation
    }
    if (contactData.isPrimary !== undefined) {
      updateData.isPrimary = contactData.isPrimary
    }

    return this.db.userContact.update({
      where: { id: contactId },
      data: updateData
    })
  }

  public async deleteUserContact(contactId: string) {
    const contact = await this.db.userContact.findUnique({
      where: { id: contactId }
    })

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    await this.db.userContact.delete({
      where: { id: contactId }
    })

    return { message: 'Contact deleted successfully' }
  }

  // User Vacations Management
  public async getUserVacations(userId: string) {
    await this.findById(userId) // Check if user exists

    return this.db.userVacation.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    })
  }

  public async createUserVacation(userId: string, vacationData: any) {
    await this.findById(userId) // Check if user exists

    console.log('Received vacation data:', vacationData)
    console.log('startDate type:', typeof vacationData?.startDate, vacationData?.startDate)
    console.log('endDate type:', typeof vacationData?.endDate, vacationData?.endDate)

    // Валидация обязательных полей
    if (!vacationData || typeof vacationData !== 'object') {
      throw new BadRequestException('Invalid vacation data')
    }
    
    if (!vacationData.title || vacationData.title.trim() === '') {
      throw new BadRequestException('title is required')
    }
    
    if (!vacationData.startDate) {
      throw new BadRequestException('startDate is required')
    }
    
    if (!vacationData.endDate) {
      throw new BadRequestException('endDate is required')
    }

    return this.db.userVacation.create({
      data: {
        userId,
        title: vacationData.title,
        startDate: new Date(vacationData.startDate),
        endDate: new Date(vacationData.endDate),
        description: vacationData.description || null
      }
    })
  }

  public async updateUserVacation(vacationId: string, vacationData: any) {
    const vacation = await this.db.userVacation.findUnique({
      where: { id: vacationId }
    })

    if (!vacation) {
      throw new NotFoundException('Vacation not found')
    }

    // Подготавливаем данные для обновления (только разрешенные поля)
    const updateData: any = {}
    
    if (vacationData.title !== undefined) {
      updateData.title = vacationData.title
    }
    if (vacationData.startDate !== undefined) {
      updateData.startDate = new Date(vacationData.startDate)
    }
    if (vacationData.endDate !== undefined) {
      updateData.endDate = new Date(vacationData.endDate)
    }
    if (vacationData.description !== undefined) {
      updateData.description = vacationData.description
    }

    return this.db.userVacation.update({
      where: { id: vacationId },
      data: updateData
    })
  }

  public async deleteUserVacation(vacationId: string) {
    const vacation = await this.db.userVacation.findUnique({
      where: { id: vacationId }
    })

    if (!vacation) {
      throw new NotFoundException('Vacation not found')
    }

    await this.db.userVacation.delete({
      where: { id: vacationId }
    })

    return { message: 'Vacation deleted successfully' }
  }

  // User Alert Settings Management
  public async getUserAlertSettings(userId: string) {
    await this.findById(userId) // Check if user exists

    return this.db.userAlertSetting.findMany({
      where: { userId },
      orderBy: { category: 'asc' }
    })
  }

  public async updateUserAlertSetting(userId: string, alertData: any) {
    await this.findById(userId) // Check if user exists

    return this.db.userAlertSetting.upsert({
      where: {
        userId_alertType_category: {
          userId,
          alertType: alertData.alertType,
          category: alertData.category
        }
      },
      create: {
        userId,
        ...alertData
      },
      update: {
        isEnabled: alertData.isEnabled
      }
    })
  }
}
