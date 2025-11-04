import { Module } from '@nestjs/common'
import { CompaniesService } from './companies.service'
import { CompaniesController } from './companies.controller'
import { PrismaModule } from '@/prisma/prisma.module'
import { RbacModule } from '@/rbac/rbac.module'
import { UserModule } from '@/user/user.module'

@Module({
  imports: [PrismaModule, RbacModule, UserModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}