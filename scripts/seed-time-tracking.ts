import { PrismaService } from '../src/prisma/prisma.service'
import { PermissionLevel } from '@prisma/client'

async function seedTimeTrackingPermissions() {
  const prisma = new PrismaService()

  try {
    console.log('🌱 Добавляем разрешения для учёта времени...')

    // Создаём разрешения для учёта времени
    const permissions = [
      {
        key: 'TIME_TRACKING:LIMITED',
        description: 'Ограниченный доступ к учёту времени (свои записи)'
      },
      {
        key: 'TIME_TRACKING:AUTHORIZED',
        description: 'Полный доступ к учёту времени (управление всеми записями)'
      }
    ]

    for (const permissionData of permissions) {
      await prisma.permission.upsert({
        where: { key: permissionData.key },
        update: {
          description: permissionData.description
        },
        create: permissionData
      })
    }

    // Находим или создаём роли
    const employeeRole = await prisma.role.upsert({
      where: { name: 'Employee' },
      update: {},
      create: {
        name: 'Employee',
        description: 'Стандартная роль сотрудника',
        isSystem: false
      }
    })

    const managerRole = await prisma.role.upsert({
      where: { name: 'Manager' },
      update: {},
      create: {
        name: 'Manager',
        description: 'Роль менеджера',
        isSystem: false
      }
    })

    const adminRole = await prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: {
        name: 'Admin',
        description: 'Роль администратора',
        isSystem: true
      }
    })

    // Назначаем разрешения для роли Employee
    const timeTrackingPermission = await prisma.permission.findUnique({
      where: { key: 'TIME_TRACKING:LIMITED' }
    })

    if (timeTrackingPermission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: employeeRole.id,
            permissionId: timeTrackingPermission.id
          }
        },
        update: {
          level: PermissionLevel.LIMITED
        },
        create: {
          roleId: employeeRole.id,
          permissionId: timeTrackingPermission.id,
          level: PermissionLevel.LIMITED
        }
      })
    }

    // Назначаем разрешения для роли Manager
    const timeTrackingAuthPermission = await prisma.permission.findUnique({
      where: { key: 'TIME_TRACKING:AUTHORIZED' }
    })

    if (timeTrackingAuthPermission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: timeTrackingAuthPermission.id
          }
        },
        update: {
          level: PermissionLevel.AUTHORIZED
        },
        create: {
          roleId: managerRole.id,
          permissionId: timeTrackingAuthPermission.id,
          level: PermissionLevel.AUTHORIZED
        }
      })

      // Назначаем также LIMITED для Manager
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: timeTrackingPermission!.id
          }
        },
        update: {
          level: PermissionLevel.AUTHORIZED
        },
        create: {
          roleId: managerRole.id,
          permissionId: timeTrackingPermission!.id,
          level: PermissionLevel.AUTHORIZED
        }
      })
    }

    // Назначаем разрешения для роли Admin (все разрешения)
    if (timeTrackingPermission && timeTrackingAuthPermission) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: timeTrackingPermission.id
          }
        },
        update: {
          level: PermissionLevel.AUTHORIZED
        },
        create: {
          roleId: adminRole.id,
          permissionId: timeTrackingPermission.id,
          level: PermissionLevel.AUTHORIZED
        }
      })

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: timeTrackingAuthPermission.id
          }
        },
        update: {
          level: PermissionLevel.AUTHORIZED
        },
        create: {
          roleId: adminRole.id,
          permissionId: timeTrackingAuthPermission.id,
          level: PermissionLevel.AUTHORIZED
        }
      })
    }

    console.log('✅ Разрешения для учёта времени успешно добавлены!')
    console.log('📊 Созданы роли: Employee, Manager, Admin')
    console.log('🔐 Назначены соответствующие разрешения')

  } catch (error) {
    console.error('❌ Ошибка при добавлении разрешений:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTimeTrackingPermissions()