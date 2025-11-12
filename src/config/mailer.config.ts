import { MailerOptions } from '@nestjs-modules/mailer'
import { ConfigService } from '@nestjs/config'

import { isDev } from '@/libs/common/utils/is-dev.utils'

export const getMailConfig = (configService: ConfigService): MailerOptions => {
  const provider = (configService.get<string>('MAIL_PROVIDER') || 'resend').toLowerCase()

  const isDevelopment = isDev(configService)

  const transport = provider === 'mailtrap'
    ? {
        host: configService.getOrThrow<string>('MAILTRAP_HOST'),
        port: configService.getOrThrow<number>('MAILTRAP_PORT'),
        secure: false,
        auth: {
          user: configService.getOrThrow<string>('MAILTRAP_USER'),
          pass: configService.getOrThrow<string>('MAILTRAP_PASS')
        }
      }
    : {
        host: configService.getOrThrow<string>('MAIL_HOST'),
        port: configService.getOrThrow<number>('MAIL_PORT'),
        secure: !isDevelopment,
        auth: {
          user: configService.getOrThrow<string>('MAIL_LOGIN'),
          pass: configService.getOrThrow<string>('MAIL_PASSWORD')
        }
      }

  return {
    transport,
    defaults: {
      from: configService.getOrThrow<string>('MAIL_FROM')
    }
  }
}
