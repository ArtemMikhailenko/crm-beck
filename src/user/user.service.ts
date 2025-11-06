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

    // Создаем пользователя
    const user = await this.db.user.create({
      data: {
        email: userData.email,
        passwordHash,
        displayName: userData.displayName || userData.email,
        picture: userData.picture || '',
        method: userData.method || 'credentials',
        isVerified: userData.isVerified || false,
        companyId: userData.companyId || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        middleName: userData.middleName || null,
        phone: userData.phone || null,
        dateOfBirth: userData.dateOfBirth || null,
        hireDate: userData.hireDate || null,
        position: userData.position || null,
        employmentType: userData.employmentType || null,
        status: userData.status || 'active'
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
    }

    return user
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

  public async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.findById(userId)

    // Удаляем старые роли и добавляем новые
    await this.db.$transaction(async (prisma) => {
      await prisma.userRole.deleteMany({
        where: { userId }
      })

      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId,
            roleId
          }))
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
        ...contactData
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

    return this.db.userContact.update({
      where: { id: contactId },
      data: contactData
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

    return this.db.userVacation.create({
      data: {
        userId,
        ...vacationData
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

    return this.db.userVacation.update({
      where: { id: vacationId },
      data: vacationData
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
