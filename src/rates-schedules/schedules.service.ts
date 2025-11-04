import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateScheduleDto, UpdateScheduleDto, ScheduleResponseDto } from './dto/schedule.dto'

@Injectable()
export class SchedulesService {
  constructor(private readonly db: PrismaService) {}

  async createSchedule(createScheduleDto: CreateScheduleDto): Promise<ScheduleResponseDto> {
    // Проверяем существование пользователя
    const user = await this.db.user.findUnique({
      where: { id: createScheduleDto.userId }
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Валидируем дни недели
    this.validateScheduleDays(createScheduleDto.days)

    return await this.db.$transaction(async (prisma) => {
      // Если это расписание по умолчанию, сбрасываем флаг у других
      if (createScheduleDto.isDefault) {
        await prisma.schedule.updateMany({
          where: { 
            userId: createScheduleDto.userId,
            isDefault: true
          },
          data: { isDefault: false }
        })
      }

      // Создаем расписание
      const schedule = await prisma.schedule.create({
        data: {
          userId: createScheduleDto.userId,
          name: createScheduleDto.name,
          timezone: createScheduleDto.timezone || 'Europe/Kiev',
          isDefault: createScheduleDto.isDefault || false
        }
      })

      // Создаем дни расписания
      await prisma.scheduleDay.createMany({
        data: createScheduleDto.days.map(day => ({
          scheduleId: schedule.id,
          weekday: day.weekday,
          workStart: day.workStart || null,
          workEnd: day.workEnd || null,
          lunchStart: day.lunchStart || null,
          lunchEnd: day.lunchEnd || null,
          isDayOff: day.isDayOff || false
        }))
      })

      // Возвращаем полное расписание
      return await this.findScheduleById(schedule.id)
    })
  }

  async findAllSchedules(userId?: string): Promise<ScheduleResponseDto[]> {
    const where: any = {}
    if (userId) {
      where.userId = userId
    }

    const schedules = await this.db.schedule.findMany({
      where,
      include: {
        days: {
          orderBy: { weekday: 'asc' }
        },
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
        { isDefault: 'desc' },
        { name: 'asc' }
      ]
    })

    return schedules.map(schedule => this.mapToScheduleResponse(schedule))
  }

  async findScheduleById(id: string): Promise<ScheduleResponseDto> {
    const schedule = await this.db.schedule.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { weekday: 'asc' }
        },
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    })

    if (!schedule) {
      throw new NotFoundException('Schedule not found')
    }

    return this.mapToScheduleResponse(schedule)
  }

  async updateSchedule(id: string, updateScheduleDto: UpdateScheduleDto): Promise<ScheduleResponseDto> {
    const existingSchedule = await this.findScheduleById(id)

    // Валидируем дни недели если они обновляются
    if (updateScheduleDto.days) {
      this.validateScheduleDays(updateScheduleDto.days)
    }

    return await this.db.$transaction(async (prisma) => {
      // Если устанавливается флаг по умолчанию, сбрасываем у других
      if (updateScheduleDto.isDefault === true) {
        await prisma.schedule.updateMany({
          where: { 
            userId: existingSchedule.userId,
            id: { not: id },
            isDefault: true
          },
          data: { isDefault: false }
        })
      }

      // Обновляем основную информацию расписания
      const updateData: any = {}
      if (updateScheduleDto.name !== undefined) updateData.name = updateScheduleDto.name
      if (updateScheduleDto.timezone !== undefined) updateData.timezone = updateScheduleDto.timezone
      if (updateScheduleDto.isDefault !== undefined) updateData.isDefault = updateScheduleDto.isDefault

      if (Object.keys(updateData).length > 0) {
        await prisma.schedule.update({
          where: { id },
          data: updateData
        })
      }

      // Обновляем дни расписания если они переданы
      if (updateScheduleDto.days) {
        // Удаляем существующие дни
        await prisma.scheduleDay.deleteMany({
          where: { scheduleId: id }
        })

        // Создаем новые дни
        await prisma.scheduleDay.createMany({
          data: updateScheduleDto.days.map(day => ({
            scheduleId: id,
            weekday: day.weekday,
            workStart: day.workStart || null,
            workEnd: day.workEnd || null,
            lunchStart: day.lunchStart || null,
            lunchEnd: day.lunchEnd || null,
            isDayOff: day.isDayOff || false
          }))
        })
      }

      return await this.findScheduleById(id)
    })
  }

  async deleteSchedule(id: string): Promise<{ message: string }> {
    const schedule = await this.findScheduleById(id)

    await this.db.$transaction(async (prisma) => {
      // Удаляем дни расписания
      await prisma.scheduleDay.deleteMany({
        where: { scheduleId: id }
      })

      // Удаляем само расписание
      await prisma.schedule.delete({
        where: { id }
      })
    })

    return { message: 'Schedule deleted successfully' }
  }

  async getDefaultSchedule(userId: string): Promise<ScheduleResponseDto | null> {
    const schedule = await this.db.schedule.findFirst({
      where: {
        userId,
        isDefault: true
      },
      include: {
        days: {
          orderBy: { weekday: 'asc' }
        },
        user: {
          select: {
            id: true,
            displayName: true,
            email: true
          }
        }
      }
    })

    return schedule ? this.mapToScheduleResponse(schedule) : null
  }

  async getWorkingHoursForDate(userId: string, date: Date): Promise<{ workStart: string, workEnd: string, lunchStart?: string, lunchEnd?: string } | null> {
    const weekday = date.getDay() || 7 // Воскресенье = 7, остальные дни как обычно

    const defaultSchedule = await this.getDefaultSchedule(userId)
    if (!defaultSchedule) {
      return null
    }

    const daySchedule = defaultSchedule.days.find(day => day.weekday === weekday)
    if (!daySchedule || daySchedule.isDayOff || !daySchedule.workStart || !daySchedule.workEnd) {
      return null
    }

    return {
      workStart: daySchedule.workStart,
      workEnd: daySchedule.workEnd,
      lunchStart: daySchedule.lunchStart || undefined,
      lunchEnd: daySchedule.lunchEnd || undefined
    }
  }

  private validateScheduleDays(days: any[]) {
    const weekdays = days.map(day => day.weekday)
    const uniqueWeekdays = new Set(weekdays)

    if (weekdays.length !== uniqueWeekdays.size) {
      throw new BadRequestException('Duplicate weekdays are not allowed')
    }

    for (const day of days) {
      if (day.weekday < 1 || day.weekday > 7) {
        throw new BadRequestException('Weekday must be between 1 and 7')
      }

      if (!day.isDayOff) {
        if (day.workStart && day.workEnd) {
          if (day.workStart >= day.workEnd) {
            throw new BadRequestException('Work start time must be before work end time')
          }
        }

        if (day.lunchStart && day.lunchEnd) {
          if (day.lunchStart >= day.lunchEnd) {
            throw new BadRequestException('Lunch start time must be before lunch end time')
          }

          if (day.workStart && day.workEnd) {
            if (day.lunchStart <= day.workStart || day.lunchEnd >= day.workEnd) {
              throw new BadRequestException('Lunch time must be within working hours')
            }
          }
        }
      }
    }
  }

  private mapToScheduleResponse(schedule: any): ScheduleResponseDto {
    return {
      id: schedule.id,
      userId: schedule.userId,
      name: schedule.name,
      timezone: schedule.timezone,
      isDefault: schedule.isDefault,
      days: schedule.days.map((day: any) => ({
        weekday: day.weekday,
        workStart: day.workStart,
        workEnd: day.workEnd,
        lunchStart: day.lunchStart,
        lunchEnd: day.lunchEnd,
        isDayOff: day.isDayOff
      })),
      user: schedule.user ? {
        id: schedule.user.id,
        displayName: schedule.user.displayName,
        email: schedule.user.email
      } : undefined
    }
  }
}