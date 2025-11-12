import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const result = await prisma.user.updateMany({
      data: { isTwoFactorEnabled: true },
      where: { isTwoFactorEnabled: false },
    })
    console.log(`Updated users count: ${result.count}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
