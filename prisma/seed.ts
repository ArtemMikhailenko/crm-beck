import { PrismaClient } from '@prisma/client'
import { hash } from 'argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create system roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'System administrator with full access',
      isSystem: true,
    },
  })

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Manager with team management capabilities',
      isSystem: true,
    },
  })

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      description: 'Regular employee',
      isSystem: true,
    },
  })

  // Create permissions
  const permissions = [
    { key: 'users:list', description: 'List users' },
    { key: 'users:view', description: 'View user details' },
    { key: 'users:create', description: 'Create new users' },
    { key: 'users:update', description: 'Update user information' },
    { key: 'users:delete', description: 'Delete users' },
    { key: 'companies:list', description: 'List companies' },
    { key: 'companies:view', description: 'View company details' },
    { key: 'companies:create', description: 'Create new companies' },
    { key: 'companies:update', description: 'Update company information' },
    { key: 'companies:delete', description: 'Delete companies' },
    { key: 'time:list', description: 'List time entries' },
    { key: 'time:create', description: 'Create time entries' },
    { key: 'time:update', description: 'Update time entries' },
    { key: 'time:approve', description: 'Approve time entries' },
    { key: 'vacations:list', description: 'List vacation requests' },
    { key: 'vacations:create', description: 'Create vacation requests' },
    { key: 'vacations:approve', description: 'Approve vacation requests' },
    { key: 'vacations:update', description: 'Update vacation requests' },
    { key: 'vacations:delete', description: 'Delete vacation requests' },
    { key: 'schedules:list', description: 'List schedules' },
    { key: 'schedules:create', description: 'Create schedules' },
    { key: 'schedules:update', description: 'Update schedules' },
    { key: 'schedules:delete', description: 'Delete schedules' },
    { key: 'rates:list', description: 'List rates' },
    { key: 'rates:create', description: 'Create rates' },
    { key: 'rates:update', description: 'Update rates' },
    { key: 'rates:delete', description: 'Delete rates' },
    { key: 'documents:upload', description: 'Upload documents' },
    { key: 'documents:view', description: 'View documents' },
    { key: 'documents:delete', description: 'Delete documents' },
  ]

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: {},
      create: perm,
    })
  }

  // Assign all permissions to Admin role with AUTHORIZED level
  const allPermissions = await prisma.permission.findMany()
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
        level: 'AUTHORIZED',
      },
    })
  }

  // Assign limited permissions to Manager role
  const managerPermissions = allPermissions.filter(p => 
    p.key.includes('users:') || 
    p.key.includes('companies:') || 
    p.key.includes('time:') || 
    p.key.includes('vacations:approve') ||
    p.key.includes('schedules:') ||
    p.key.includes('documents:')
  )
  
  for (const permission of managerPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: managerRole.id,
        permissionId: permission.id,
        level: permission.key.includes('delete') ? 'LIMITED' : 'AUTHORIZED',
      },
    })
  }

  // Assign basic permissions to Employee role
  const employeePermissions = allPermissions.filter(p => 
    p.key.includes('time:list') || 
    p.key.includes('time:create') ||
    p.key.includes('vacations:list') ||
    p.key.includes('vacations:create') ||
    p.key.includes('schedules:list') ||
    p.key.includes('documents:view') ||
    p.key.includes('users:view')
  )
  
  for (const permission of employeePermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: employeeRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: employeeRole.id,
        permissionId: permission.id,
        level: 'LIMITED',
      },
    })
  }

  // Create test companies
  const existingCompany = await prisma.company.findFirst({
    where: { name: 'Test Construction Co.' }
  })
  
  const testCompany = existingCompany || await prisma.company.create({
    data: {
      name: 'Test Construction Co.',
      type: 'SUBCONTRACTOR',
      taxId: '123456789',
      iban: 'UA123456789012345678901234567',
      address: '123 Test Street, Kyiv, Ukraine',
      status: 'active',
    },
  })

  // Create test admin user
  const hashedPassword = await hash('admin123')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      passwordHash: hashedPassword,
      displayName: 'Admin User',
      firstName: 'Admin',
      lastName: 'User',
      legacyRole: 'ADMIN',
      method: 'CREDENTIALS',
      isVerified: true,
    },
  })

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  })

  // Create test employee user
  const employeePassword = await hash('employee123')
  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@test.com' },
    update: {},
    create: {
      email: 'employee@test.com',
      passwordHash: employeePassword,
      displayName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+380123456789',
      legacyRole: 'REGULAR',
      method: 'CREDENTIALS',
      isVerified: true,
    },
  })

  // Assign employee role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: employeeUser.id,
        roleId: employeeRole.id,
      },
    },
    update: {},
    create: {
      userId: employeeUser.id,
      roleId: employeeRole.id,
    },
  })

  // Create company membership for employee
  await prisma.userCompanyMembership.upsert({
    where: {
      userId_companyId: {
        userId: employeeUser.id,
        companyId: testCompany.id,
      },
    },
    update: {},
    create: {
      userId: employeeUser.id,
      companyId: testCompany.id,
      position: 'Construction Worker',
      isPrimary: true,
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log(`📧 Admin user: admin@test.com / admin123`)
  console.log(`📧 Employee user: employee@test.com / employee123`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })