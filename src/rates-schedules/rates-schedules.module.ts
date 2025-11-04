import { Module } from '@nestjs/common'
import { PrismaModule } from '@/prisma/prisma.module'
import { RbacModule } from '@/rbac/rbac.module'
import { UserModule } from '@/user/user.module'
import { RatesSchedulesController } from './rates-schedules.controller'
import { RatesService } from './rates.service'
import { SchedulesService } from './schedules.service'

@Module({
  imports: [PrismaModule, RbacModule, UserModule],
  controllers: [RatesSchedulesController],
  providers: [RatesService, SchedulesService],
  exports: [RatesService, SchedulesService]
})
export class RatesSchedulesModule {}