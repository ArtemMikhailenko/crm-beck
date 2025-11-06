import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { AuthMethod, User } from '@prisma/client'
import { verify } from 'argon2'
import { Request, Response } from 'express'

import { LoginDto } from '@/auth/dto/login.dto'
import { RegisterDto } from '@/auth/dto/register.dto'
import { EmailConfirmationService } from '@/auth/email-confirmation/email-confirmation.service'
import { ProviderService } from '@/auth/provider/provider.service'
import { PrismaService } from '@/prisma/prisma.service'
import { UserService } from '@/user/user.service'

import { TwoFactorService } from './two-factor/two-factor.service'

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly providerService: ProviderService,
    private readonly db: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(forwardRef(() => EmailConfirmationService))
    private readonly emailConfirmationService: EmailConfirmationService,
    private readonly twoFactorService: TwoFactorService
  ) {}

  public async register(dto: RegisterDto) {
    const isExists = await this.userService.findByEmail(dto.email)

    if (isExists) {
      throw new ConflictException(
        'User already exists. Use another email or login.'
      )
    }

    const newUser = await this.userService.create(
      dto.email,
      dto.password,
      dto.name,
      null,
      AuthMethod.CREDENTIALS,
      true // TODO: Temporarily set to true - change back to false when email verification is re-enabled
    )

    // TODO: Temporarily disabled email verification - re-enable later  
    // await this.emailConfirmationService.sendVerificationToken(newUser)

    const tokens = await this.generateTokens(newUser)

    return {
      message: 'User created successfully. You can now login with your credentials.',
      ...tokens,
      user: this.sanitizeUser(newUser)
    }
  }

  public async login(req: Request, dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email)

    if (!user || !user.passwordHash) {
      throw new NotFoundException('User not found or password is not set')
    }

    const isPasswordValid = await verify(user.passwordHash, dto.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password')
    }

    // TODO: Temporarily disabled email verification - re-enable later
    // if (!user.isVerified) {
    //   await this.emailConfirmationService.sendVerificationToken(user)

    //   throw new UnauthorizedException(
    //     'Email is not verified. Please confirm your email.'
    //   )
    // }

    if (user.isTwoFactorEnabled) {
      if (!dto.token) {
        await this.twoFactorService.sendTwoFactorToken(user.email)

        return {
          message: 'Two-factor authentication required. Token sent to email.'
        }
      }

      await this.twoFactorService.verificationTwoFactorCode(
        user.email,
        dto.token
      )
    }

    await this.saveSession(req, user)

    const tokens = await this.generateTokens(user)

    return {
      ...tokens,
      user: this.sanitizeUser(user)
    }
  }

  public async extractProfileFromCode(
    req: Request,
    provider: string,
    code: string
  ) {
    const providerInstance = this.providerService.findByService(provider)

    const profile = await providerInstance.findUserByCode(code)

    const account = await this.db.account.findFirst({
      where: {
        id: profile.id,
        provider: profile.provider
      }
    })

    let user = account?.userId
      ? await this.userService.findById(account.userId)
      : null

    if (user) {
      await this.saveSession(req, user)
      return user
    }

    user = await this.userService.create(
      profile.email,
      null,
      profile.name,
      profile.picture,
      AuthMethod[profile.provider.toUpperCase()] as AuthMethod,
      true
    )

    if (!account) {
      await this.db.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: profile.provider,
          accessToken: profile.access_token,
          refreshToken: profile.refresh_token,
          expiresAt: profile.expires_at
        }
      })
    }

    await this.saveSession(req, user)
    return user
  }

  public async logout(req: Request, res: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      req.session.destroy(err => {
        if (err) {
          return reject(
            new InternalServerErrorException('Failed to destroy session')
          )
        }

        res.clearCookie(this.configService.getOrThrow<string>('SESSION_NAME'))

        resolve()
      })
    })
  }

  public async saveSession(req: Request, user: User) {
    return new Promise((resolve, reject) => {
      req.session.userId = user.id

      req.session.save(err => {
        if (err) {
          return reject(
            new InternalServerErrorException('Failed to save session')
          )
        }

        resolve({ user })
      })
    })
  }

  public async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.displayName
    }

    const accessToken = await this.jwtService.signAsync(payload)

    return {
      accessToken,
      tokenType: 'Bearer'
    }
  }

  public sanitizeUser(user: User) {
    const { passwordHash, ...sanitizedUser } = user
    return sanitizedUser
  }
}
