import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateRateDto, UpdateRateDto, RateResponseDto } from './dto/rate.dto'

@Injectable()
export class RatesService {
  constructor(private readonly db: PrismaService) {}

  async createRate(createRateDto: CreateRateDto): Promise<RateResponseDto> {
    // Проверяем существование пользователя
    const user = await this.db.user.findUnique({
      where: { id: createRateDto.userId }
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Проверяем пересечение дат с существующими ставками того же типа
    const overlappingRate = await this.findOverlappingRate(
      createRateDto.userId,
      createRateDto.type,
      new Date(createRateDto.validFrom),
      createRateDto.validTo ? new Date(createRateDto.validTo) : null
    )

    if (overlappingRate) {
      throw new ConflictException('Rate period overlaps with existing rate')
    }

    const rate = await this.db.rate.create({
      data: {
        userId: createRateDto.userId,
        type: createRateDto.type,
        value: createRateDto.value,
        currency: createRateDto.currency || 'USD',
        validFrom: new Date(createRateDto.validFrom),
        validTo: createRateDto.validTo ? new Date(createRateDto.validTo) : null
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    })

    return this.mapToRateResponse(rate)
  }

  async findAllRates(userId?: string): Promise<RateResponseDto[]> {
    const where: any = {}
    if (userId) {
      where.userId = userId
    }

    const rates = await this.db.rate.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: [
        { userId: 'asc' },
        { type: 'asc' },
        { validFrom: 'desc' }
      ]
    })

    return rates.map(rate => this.mapToRateResponse(rate))
  }

  async findRateById(id: string): Promise<RateResponseDto> {
    const rate = await this.db.rate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    })

    if (!rate) {
      throw new NotFoundException('Rate not found')
    }

    return this.mapToRateResponse(rate)
  }

  async updateRate(id: string, updateRateDto: UpdateRateDto): Promise<RateResponseDto> {
    const existingRate = await this.findRateById(id)

    // Если изменяются даты, проверяем пересечения
    if (updateRateDto.validFrom || updateRateDto.validTo) {
      const newValidFrom = updateRateDto.validFrom ? new Date(updateRateDto.validFrom) : new Date(existingRate.validFrom)
      const newValidTo = updateRateDto.validTo ? new Date(updateRateDto.validTo) : existingRate.validTo

      const overlappingRate = await this.findOverlappingRate(
        existingRate.userId,
        updateRateDto.type || existingRate.type,
        newValidFrom,
        newValidTo,
        id // исключаем текущую ставку из проверки
      )

      if (overlappingRate) {
        throw new ConflictException('Updated rate period overlaps with existing rate')
      }
    }

    const updateData: any = {}
    if (updateRateDto.type !== undefined) updateData.type = updateRateDto.type
    if (updateRateDto.value !== undefined) updateData.value = updateRateDto.value
    if (updateRateDto.currency !== undefined) updateData.currency = updateRateDto.currency
    if (updateRateDto.validFrom !== undefined) updateData.validFrom = new Date(updateRateDto.validFrom)
    if (updateRateDto.validTo !== undefined) updateData.validTo = updateRateDto.validTo ? new Date(updateRateDto.validTo) : null

    const rate = await this.db.rate.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    })

    return this.mapToRateResponse(rate)
  }

  async deleteRate(id: string): Promise<{ message: string }> {
    await this.findRateById(id) // проверяем существование

    await this.db.rate.delete({
      where: { id }
    })

    return { message: 'Rate deleted successfully' }
  }

  async getCurrentRate(userId: string, rateType: any, date: Date = new Date()): Promise<RateResponseDto | null> {
    const rate = await this.db.rate.findFirst({
      where: {
        userId,
        type: rateType,
        validFrom: { lte: date },
        OR: [
          { validTo: null },
          { validTo: { gte: date } }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      },
      orderBy: { validFrom: 'desc' }
    })

    return rate ? this.mapToRateResponse(rate) : null
  }

  private async findOverlappingRate(
    userId: string,
    rateType: any,
    validFrom: Date,
    validTo: Date | null,
    excludeRateId?: string
  ) {
    const where: any = {
      userId,
      type: rateType,
      AND: [
        {
          OR: [
            // новая ставка начинается до окончания существующей
            {
              validTo: null, // существующая ставка бессрочная
              validFrom: { lte: validTo || new Date('2099-12-31') }
            },
            {
              validTo: { gte: validFrom } // существующая ставка заканчивается после начала новой
            }
          ]
        },
        {
          OR: [
            // новая ставка заканчивается после начала существующей
            {
              validFrom: { lte: validTo || new Date('2099-12-31') }
            }
          ]
        }
      ]
    }

    if (excludeRateId) {
      where.id = { not: excludeRateId }
    }

    return await this.db.rate.findFirst({ where })
  }

  private mapToRateResponse(rate: any): RateResponseDto {
    return {
      id: rate.id,
      userId: rate.userId,
      type: rate.type,
      value: parseFloat(rate.value.toString()),
      currency: rate.currency,
      validFrom: rate.validFrom,
      validTo: rate.validTo,
      user: rate.user ? {
        id: rate.user.id,
        displayName: rate.user.displayName,
        email: rate.user.email
      } : undefined
    }
  }
}