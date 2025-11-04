import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { StartTimerDto, StopTimerDto, TimerStatusDto } from './dto/timer.dto'
import { TimeEntriesService } from './time-entries.service'

@Injectable()
export class TimerService {
  constructor(
    private readonly db: PrismaService,
    private readonly timeEntriesService: TimeEntriesService
  ) {}

  async startTimer(userId: string, startDto: StartTimerDto): Promise<TimerStatusDto> {
    // Проверяем, нет ли уже активного таймера
    const activeTimer = await this.getActiveTimer(userId)
    if (activeTimer) {
      throw new BadRequestException('Timer is already running')
    }

    // Проверяем компанию если указана
    if (startDto.companyId) {
      const company = await this.db.company.findUnique({
        where: { id: startDto.companyId }
      })
      if (!company) {
        throw new BadRequestException('Company not found')
      }
    }

    const now = new Date()
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // Создаем новую запись времени в статусе DRAFT для таймера
    const timeEntry = await this.db.timeEntry.create({
      data: {
        userId,
        date: todayStart,
        startAt: now,
        endAt: null, // Будет установлено при остановке таймера
        breakMinutes: 0,
        durationMinutes: 0, // Будет рассчитано при остановке
        companyId: startDto.companyId,
        status: 'DRAFT',
        source: 'TIMER',
        notes: startDto.notes
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

    return this.mapToTimerStatus(timeEntry)
  }

  async stopTimer(userId: string, stopDto: StopTimerDto): Promise<TimerStatusDto> {
    const activeTimer = await this.getActiveTimer(userId)
    if (!activeTimer) {
      throw new BadRequestException('No active timer found')
    }

    const endTime = new Date()
    const startTime = activeTimer.startAt!
    
    // Рассчитываем общее время в минутах
    const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    const breakMinutes = stopDto.breakMinutes || 0
    const workMinutes = Math.max(0, totalMinutes - breakMinutes)

    // Обновляем запись времени
    const updatedEntry = await this.db.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endAt: endTime,
        breakMinutes,
        durationMinutes: workMinutes,
        notes: stopDto.notes || activeTimer.notes
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

    return this.mapToTimerStatus(updatedEntry, false)
  }

  async getTimerStatus(userId: string): Promise<TimerStatusDto | null> {
    const activeTimer = await this.getActiveTimer(userId)
    
    if (!activeTimer) {
      return null
    }

    return this.mapToTimerStatus(activeTimer)
  }

  async cancelTimer(userId: string): Promise<{ message: string }> {
    const activeTimer = await this.getActiveTimer(userId)
    if (!activeTimer) {
      throw new BadRequestException('No active timer found')
    }

    // Удаляем незавершенную запись таймера
    await this.db.timeEntry.delete({
      where: { id: activeTimer.id }
    })

    return { message: 'Timer cancelled successfully' }
  }

  async pauseTimer(userId: string): Promise<TimerStatusDto> {
    // В текущей реализации мы не поддерживаем паузу на уровне базы данных
    // Эта функциональность может быть реализована на клиенте
    throw new BadRequestException('Pause functionality not implemented')
  }

  async resumeTimer(userId: string): Promise<TimerStatusDto> {
    // В текущей реализации мы не поддерживаем паузу на уровне базы данных
    // Эта функциональность может быть реализована на клиенте
    throw new BadRequestException('Resume functionality not implemented')
  }

  // Приватные вспомогательные методы

  private async getActiveTimer(userId: string): Promise<any> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.db.timeEntry.findFirst({
      where: {
        userId,
        source: 'TIMER',
        startAt: { not: null },
        endAt: null, // Активный таймер имеет startAt но не имеет endAt
        date: {
          gte: today,
          lt: tomorrow
        }
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
  }

  private mapToTimerStatus(timeEntry: any, isActive: boolean = true): TimerStatusDto {
    const now = new Date()
    const startTime = timeEntry.startAt
    let elapsedMinutes = 0

    if (startTime) {
      const endTime = timeEntry.endAt || now
      elapsedMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    }

    return {
      isActive,
      timeEntryId: timeEntry.id,
      startedAt: timeEntry.startAt,
      endedAt: timeEntry.endAt,
      elapsedMinutes,
      currentDuration: Math.max(0, elapsedMinutes - (timeEntry.breakMinutes || 0)),
      companyId: timeEntry.companyId,
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