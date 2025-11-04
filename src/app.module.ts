import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { AuthModule } from './auth/auth.module'
import { CompaniesModule } from './companies/companies.module'
import { EmailConfirmationModule } from './auth/email-confirmation/email-confirmation.module'
import { ProviderModule } from './auth/provider/provider.module'
import { HealthModule } from './health/health.module'
import { IS_DEV_ENV } from './libs/common/utils/is-dev.utils'
import { MailModule } from './libs/mail/mail.module'
import { PrismaModule } from './prisma/prisma.module'
import { RatesSchedulesModule } from './rates-schedules/rates-schedules.module'
import { RbacModule } from './rbac/rbac.module'
import { TimeTrackingModule } from './time-tracking/time-tracking.module'
import { UserModule } from './user/user.module'
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: !IS_DEV_ENV
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    RbacModule,
    CompaniesModule,
    RatesSchedulesModule,
    TimeTrackingModule,
    HealthModule,
    ProviderModule,
    MailModule,
    EmailConfirmationModule,
    ProjectsModule
  ]
})
export class AppModule {}
