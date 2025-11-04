import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from '@react-email/components'

import { RecoveryTemplate } from '@/libs/mail/templates/recovery.template'
import { TwoFactorTemplate } from '@/libs/mail/templates/two-factor.template'
import { isDev } from '@/libs/common/utils/is-dev.utils'

import { ConfirmationTemplate } from './templates/confirmation.template'

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}

  public async sendConfirmationEmail(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

    const html = await render(ConfirmationTemplate({ token, domain }))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.sendEmail(email, 'Confirm your email', html)
  }

  public async sendRecoveryEmail(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

    const html = await render(RecoveryTemplate({ token, domain }))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.sendEmail(email, 'Reset your password', html)
  }

  private sendEmail(to: string, subject: string, html: string) {
    // Skip sending emails in development mode
    if (isDev(this.configService)) {
      this.logger.log(`[DEV MODE] Email would be sent to: ${to}`)
      this.logger.log(`[DEV MODE] Subject: ${subject}`)
      this.logger.log(`[DEV MODE] Email sending skipped in development`)
      return Promise.resolve({ messageId: 'dev-mode-skip' })
    }

    const from = this.configService.getOrThrow<string>('MAIL_FROM')

    return this.mailerService.sendMail({
      to,
      from,
      subject,
      html
    })
  }

  public async sendTwoFactorTokenEmail(email: string, token: string) {
    const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

    const html = await render(TwoFactorTemplate({ token, domain }))

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.sendEmail(email, 'Reset your password', html)
  }
}
