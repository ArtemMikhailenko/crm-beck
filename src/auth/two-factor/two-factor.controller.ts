import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { IsEmail, IsNotEmpty } from 'class-validator'

import { TwoFactorService } from './two-factor.service'

class ResendDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string
}

@Controller('auth/2fa')
export class TwoFactorController {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  async resend(@Body() dto: ResendDto) {
    await this.twoFactorService.sendTwoFactorToken(dto.email)
    return {
      message: 'Код повторно отправлен на email'
    }
  }
}
