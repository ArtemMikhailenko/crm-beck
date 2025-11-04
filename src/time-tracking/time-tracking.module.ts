import { Module } from '@nestjs/common'
import { PrismaModule } from '@/prisma/prisma.module'
import { RatesSchedulesModule } from '@/rates-schedules/rates-schedules.module'
import { UserModule } from '@/user/user.module'
import { TimeEntriesService } from './time-entries.service'
import { TimerService } from './timer.service'
import { TimesheetsService } from './timesheets.service'
import { TimeTrackingController } from './time-tracking.controller'

@Module({
  imports: [
    PrismaModule,
    RatesSchedulesModule,
    UserModule
  ],
  controllers: [TimeTrackingController],
  providers: [
    TimeEntriesService,
    TimerService,
    TimesheetsService
  ],
  exports: [
    TimeEntriesService,
    TimerService,
    TimesheetsService
  ]
})
export class TimeTrackingModule {}