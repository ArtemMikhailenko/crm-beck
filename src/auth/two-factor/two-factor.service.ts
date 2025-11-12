import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TokenType } from '@prisma/client'
import { MailService } from '@/libs/mail/mail.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly userService: UserService,
    private readonly db: PrismaService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService
  ) {}

  public async sendTwoFactorToken(email: string) {
    const user = await this.userService.findByEmail(email)

    if (!user) {
      throw new NotFoundException(
        "User doesn't exist. Try to use different email."
      )
    }

    const tokenLength = this.configService.get<number>(
      'TWO_FACTOR_TOKEN_LENGTH',
      6
    )
    const token = Math.floor(Math.random() * Math.pow(10, tokenLength))
      .toString()
      .padStart(tokenLength, '0')

    const ttlMinutes = this.configService.get<number>(
      'TWO_FACTOR_TOKEN_TTL_MINUTES',
      10
    )
    const expiresIn = new Date(Date.now() + ttlMinutes * 60 * 1000)

    const existingToken = await this.db.token.findFirst({
      where: {
        email: email,
        type: TokenType.TWO_FACTOR
      }
    })

    if (existingToken) {
      // Check resend interval
      const resendIntervalSeconds = this.configService.get<number>(
        'TWO_FACTOR_RESEND_INTERVAL_SECONDS',
        60
      )
      const diffMs = Date.now() - new Date(existingToken.createdAt).getTime()
      if (diffMs < resendIntervalSeconds * 1000) {
        const waitSeconds = Math.ceil(
          (resendIntervalSeconds * 1000 - diffMs) / 1000
        )
        throw new BadRequestException(
          `Слишком рано для повторной отправки. Подождите ${waitSeconds} сек.`
        )
      }
      await this.db.token.delete({
        where: { id: existingToken.id, type: TokenType.TWO_FACTOR }
      })
    }

    const twoFactorToken = await this.db.token.create({
      data: {
        email: email,
        type: TokenType.TWO_FACTOR,
        token,
        expiresIn
      }
    })

    this.mailService.sendTwoFactorTokenEmail(email, token)

    return twoFactorToken
  }

  public async verificationTwoFactorCode(email: string, token: string) {
    const existingToken = await this.db.token.findFirst({
      where: {
        token,
        type: TokenType.TWO_FACTOR
      }
    })

    if (!existingToken) {
      throw new NotFoundException('Token not found')
    }

    const hasExpired = new Date(existingToken.expiresIn) < new Date()

    if (hasExpired) {
      throw new BadRequestException('Token has expired')
    }

    if (existingToken.email !== email) {
      throw new BadRequestException('Token is invalid')
    }

    await this.db.token.delete({
      where: {
        id: existingToken.id,
        type: TokenType.TWO_FACTOR
      }
    })

    return true
  }
}
