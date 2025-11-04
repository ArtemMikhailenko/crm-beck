import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { SchedulesService } from '@/rates-schedules/schedules.service'
import { CreateTimeEntryDto, UpdateTimeEntryDto, TimeEntryResponseDto } from './dto/time-entry.dto'

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly db: PrismaService,
    private readonly schedulesService: SchedulesService
  ) {}

  async createTimeEntry(createDto: CreateTimeEntryDto): Promise<TimeEntryResponseDto> {
    // Проверяем существование пользователя
    const user = await this.db.user.findUnique({
      where: { id: createDto.userId }
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Проверяем существование компании если указана
    if (createDto.companyId) {
      const company = await this.db.company.findUnique({
        where: { id: createDto.companyId }
      })
      if (!company) {
        throw new BadRequestException('Company not found')
      }
    }

    // Валидируем и рассчитываем продолжительность
    const { startAt, endAt, durationMinutes } = await this.validateAndCalculateDuration(
      createDto.startAt,
      createDto.endAt,
      createDto.durationMinutes,
      createDto.breakMinutes || 0
    )

    // Проверяем пересечения с существующими записями
    await this.checkTimeOverlap(
      createDto.userId,
      new Date(createDto.date),
      startAt,
      endAt
    )

    // Валидируем против рабочего расписания
    await this.validateAgainstSchedule(
      createDto.userId,
      new Date(createDto.date),
      startAt,
      endAt
    )

    const timeEntry = await this.db.timeEntry.create({
      data: {
        userId: createDto.userId,
        date: new Date(createDto.date),
        startAt,
        endAt,
        breakMinutes: createDto.breakMinutes || 0,
        durationMinutes,
        companyId: createDto.companyId,
        status: 'DRAFT',
        source: createDto.source || 'MANUAL',
        notes: createDto.notes
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return this.mapToTimeEntryResponse(timeEntry)
  }

  async findTimeEntries(
    userId?: string,
    startDate?: string,
    endDate?: string,
    companyId?: string,
    status?: string
  ): Promise<TimeEntryResponseDto[]> {
    const where: any = {}

    if (userId) where.userId = userId
    if (companyId) where.companyId = companyId
    if (status) where.status = status
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.date = { gte: new Date(startDate) }
    } else if (endDate) {
      where.date = { lte: new Date(endDate) }
    }

    const timeEntries = await this.db.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { startAt: 'desc' }
      ]
    })

    return timeEntries.map(entry => this.mapToTimeEntryResponse(entry))
  }

  async findTimeEntryById(id: string): Promise<TimeEntryResponseDto> {
    const timeEntry = await this.db.timeEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    if (!timeEntry) {
      throw new NotFoundException('Time entry not found')
    }

    return this.mapToTimeEntryResponse(timeEntry)
  }

  async updateTimeEntry(id: string, updateDto: UpdateTimeEntryDto): Promise<TimeEntryResponseDto> {
    const existingEntry = await this.findTimeEntryById(id)

    // Проверяем, можно ли редактировать запись
    if (existingEntry.status === 'APPROVED') {
      throw new BadRequestException('Cannot modify approved time entry')
    }

    // Проверяем компанию если изменяется
    if (updateDto.companyId) {
      const company = await this.db.company.findUnique({
        where: { id: updateDto.companyId }
      })
      if (!company) {
        throw new BadRequestException('Company not found')
      }
    }

    // Валидируем и рассчитываем продолжительность если изменяется время
    let startAt = existingEntry.startAt
    let endAt = existingEntry.endAt
    let durationMinutes = existingEntry.durationMinutes

    if (updateDto.startAt || updateDto.endAt || updateDto.durationMinutes !== undefined || updateDto.breakMinutes !== undefined) {
      const result = await this.validateAndCalculateDuration(
        updateDto.startAt || (existingEntry.startAt ? existingEntry.startAt.toISOString() : undefined),
        updateDto.endAt || (existingEntry.endAt ? existingEntry.endAt.toISOString() : undefined),
        updateDto.durationMinutes ?? existingEntry.durationMinutes,
        updateDto.breakMinutes ?? existingEntry.breakMinutes
      )
      startAt = result.startAt
      endAt = result.endAt
      durationMinutes = result.durationMinutes

      // Проверяем пересечения (исключая текущую запись)
      await this.checkTimeOverlap(
        existingEntry.userId,
        existingEntry.date,
        startAt,
        endAt,
        id
      )
    }

    const updateData: any = {}
    if (updateDto.startAt !== undefined) updateData.startAt = startAt
    if (updateDto.endAt !== undefined) updateData.endAt = endAt
    if (updateDto.breakMinutes !== undefined) updateData.breakMinutes = updateDto.breakMinutes
    if (updateDto.durationMinutes !== undefined) updateData.durationMinutes = durationMinutes
    if (updateDto.companyId !== undefined) updateData.companyId = updateDto.companyId
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes
    if (updateDto.status !== undefined) updateData.status = updateDto.status

    const timeEntry = await this.db.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    })

    return this.mapToTimeEntryResponse(timeEntry)
  }

  async deleteTimeEntry(id: string): Promise<{ message: string }> {
    const timeEntry = await this.findTimeEntryById(id)

    if (timeEntry.status === 'APPROVED') {
      throw new BadRequestException('Cannot delete approved time entry')
    }

    await this.db.timeEntry.delete({
      where: { id }
    })

    return { message: 'Time entry deleted successfully' }
  }

  async submitTimeEntry(id: string): Promise<TimeEntryResponseDto> {
    return this.updateTimeEntry(id, { status: 'SUBMITTED' as any })
  }

  async approveTimeEntry(id: string): Promise<TimeEntryResponseDto> {
    return this.updateTimeEntry(id, { status: 'APPROVED' as any })
  }

  async rejectTimeEntry(id: string): Promise<TimeEntryResponseDto> {
    return this.updateTimeEntry(id, { status: 'REJECTED' as any })
  }

  // Приватные вспомогательные методы

  private async validateAndCalculateDuration(
    startAt?: string,
    endAt?: string,
    manualDuration?: number,
    breakMinutes: number = 0
  ): Promise<{ startAt?: Date, endAt?: Date, durationMinutes: number }> {
    if (manualDuration !== undefined && manualDuration >= 0) {
      // Если указана продолжительность вручную
      return {
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        durationMinutes: manualDuration
      }
    }

    if (startAt && endAt) {
      // Рассчитываем продолжительность по времени начала и окончания
      const start = new Date(startAt)
      const end = new Date(endAt)

      if (start >= end) {
        throw new BadRequestException('End time must be after start time')
      }

      const totalMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
      const durationMinutes = Math.max(0, totalMinutes - breakMinutes)

      return {
        startAt: start,
        endAt: end,
        durationMinutes
      }
    }

    if (startAt || endAt) {
      throw new BadRequestException('Both start and end time must be provided, or specify duration manually')
    }

    throw new BadRequestException('Either provide start/end times or manual duration')
  }

  private async checkTimeOverlap(
    userId: string,
    date: Date,
    startAt?: Date,
    endAt?: Date,
    excludeEntryId?: string
  ): Promise<void> {
    if (!startAt || !endAt) return

    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)

    const where: any = {
      userId,
      date: {
        gte: dateStart,
        lte: dateEnd
      },
      AND: [
        { startAt: { not: null } },
        { endAt: { not: null } },
        {
          OR: [
            // Новая запись начинается до окончания существующей
            {
              AND: [
                { startAt: { lte: endAt } },
                { endAt: { gte: startAt } }
              ]
            }
          ]
        }
      ]
    }

    if (excludeEntryId) {
      where.id = { not: excludeEntryId }
    }

    const overlappingEntry = await this.db.timeEntry.findFirst({ where })

    if (overlappingEntry) {
      throw new ConflictException('Time entry overlaps with existing entry')
    }
  }

  private async validateAgainstSchedule(
    userId: string,
    date: Date,
    startAt?: Date,
    endAt?: Date
  ): Promise<void> {
    if (!startAt || !endAt) return

    try {
      const workingHours = await this.schedulesService.getWorkingHoursForDate(userId, date)
      
      if (!workingHours) {
        // Нет расписания или выходной день - разрешаем любые записи
        return
      }

      // Извлекаем время из Date объектов для сравнения
      const startTime = `${startAt.getHours().toString().padStart(2, '0')}:${startAt.getMinutes().toString().padStart(2, '0')}`
      const endTime = `${endAt.getHours().toString().padStart(2, '0')}:${endAt.getMinutes().toString().padStart(2, '0')}`

      // Проверяем, что время работы в пределах расписания (с небольшим допуском)
      if (startTime < workingHours.workStart || endTime > workingHours.workEnd) {
        console.warn(`Time entry outside working hours: ${startTime}-${endTime} vs ${workingHours.workStart}-${workingHours.workEnd}`)
        // Пока только предупреждение, не блокируем
      }
    } catch (error) {
      // Если не удается проверить расписание, не блокируем создание записи
      console.warn('Could not validate against schedule:', error)
    }
  }

  private mapToTimeEntryResponse(timeEntry: any): TimeEntryResponseDto {
    return {
      id: timeEntry.id,
      userId: timeEntry.userId,
      date: timeEntry.date,
      startAt: timeEntry.startAt,
      endAt: timeEntry.endAt,
      breakMinutes: timeEntry.breakMinutes || 0,
      durationMinutes: timeEntry.durationMinutes || 0,
      companyId: timeEntry.companyId,
      status: timeEntry.status,
      source: timeEntry.source,
      notes: timeEntry.notes,
      user: timeEntry.user ? {
        id: timeEntry.user.id,
        displayName: timeEntry.user.displayName,
        email: timeEntry.user.email
      } : undefined,
      company: timeEntry.company ? {
        id: timeEntry.company.id,
        name: timeEntry.company.name,
        type: timeEntry.company.type
      } : undefined
    }
  }
}