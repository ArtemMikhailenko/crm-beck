import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateTimesheetDto, TimesheetResponseDto, TimeReportQueryDto, TimeReportResponseDto } from './dto/timesheet.dto'

interface TimeEntrySummary {
  totalMinutes: number
  totalHours: number
  entriesCount: number
  byStatus: {
    DRAFT: number
    SUBMITTED: number
    APPROVED: number
    REJECTED: number
  }
  byCompany: Array<{
    companyId: string | null
    companyName: string | null
    minutes: number
    hours: number
  }>
}

@Injectable()
export class TimesheetsService {
  constructor(private readonly db: PrismaService) {}

  async createTimesheet(createDto: CreateTimesheetDto): Promise<TimesheetResponseDto> {
    // Проверяем существование пользователя
    const user = await this.db.user.findUnique({
      where: { id: createDto.userId }
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    // Проверяем, нет ли уже табеля на эту неделю
    const weekStart = this.getWeekStart(new Date(createDto.weekStartDate))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const existingTimesheet = await this.db.timesheet.findFirst({
      where: {
        userId: createDto.userId,
        weekStartDate: weekStart
      }
    })

    if (existingTimesheet) {
      throw new BadRequestException('Timesheet for this week already exists')
    }

    // Получаем записи времени за неделю
    const timeEntries = await this.getTimeEntriesForWeek(createDto.userId, weekStart, weekEnd)
    const summary = this.calculateSummary(timeEntries)

    const timesheet = await this.db.timesheet.create({
      data: {
        userId: createDto.userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalMinutes: summary.totalMinutes,
        totalHours: summary.totalHours,
        status: 'DRAFT'
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

    return this.mapToTimesheetResponse(timesheet, timeEntries)
  }

  async findTimesheets(
    userId?: string,
    startDate?: string,
    endDate?: string,
    status?: string
  ): Promise<TimesheetResponseDto[]> {
    const where: any = {}

    if (userId) where.userId = userId
    if (status) where.status = status
    
    if (startDate && endDate) {
      where.weekStartDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } else if (startDate) {
      where.weekStartDate = { gte: new Date(startDate) }
    } else if (endDate) {
      where.weekStartDate = { lte: new Date(endDate) }
    }

    const timesheets = await this.db.timesheet.findMany({
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
      orderBy: { weekStartDate: 'desc' }
    })

    // Для каждого табеля получаем связанные записи времени
    const result: TimesheetResponseDto[] = []
    for (const timesheet of timesheets) {
      const timeEntries = await this.getTimeEntriesForWeek(
        timesheet.userId,
        timesheet.weekStartDate,
        timesheet.weekEndDate
      )
      result.push(this.mapToTimesheetResponse(timesheet, timeEntries))
    }

    return result
  }

  async findTimesheetById(id: string): Promise<TimesheetResponseDto> {
    const timesheet = await this.db.timesheet.findUnique({
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

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found')
    }

    const timeEntries = await this.getTimeEntriesForWeek(
      timesheet.userId,
      timesheet.weekStartDate,
      timesheet.weekEndDate
    )

    return this.mapToTimesheetResponse(timesheet, timeEntries)
  }

  async submitTimesheet(id: string): Promise<TimesheetResponseDto> {
    const timesheet = await this.db.timesheet.findUnique({
      where: { id }
    })

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found')
    }

    if (timesheet.status !== 'DRAFT') {
      throw new BadRequestException('Only draft timesheets can be submitted')
    }

    const updatedTimesheet = await this.db.timesheet.update({
      where: { id },
      data: { status: 'SUBMITTED' },
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

    const timeEntries = await this.getTimeEntriesForWeek(
      updatedTimesheet.userId,
      updatedTimesheet.weekStartDate,
      updatedTimesheet.weekEndDate
    )

    return this.mapToTimesheetResponse(updatedTimesheet, timeEntries)
  }

  async approveTimesheet(id: string): Promise<TimesheetResponseDto> {
    const timesheet = await this.db.timesheet.findUnique({
      where: { id }
    })

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found')
    }

    if (timesheet.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted timesheets can be approved')
    }

    const updatedTimesheet = await this.db.timesheet.update({
      where: { id },
      data: { status: 'APPROVED' },
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

    const timeEntries = await this.getTimeEntriesForWeek(
      updatedTimesheet.userId,
      updatedTimesheet.weekStartDate,
      updatedTimesheet.weekEndDate
    )

    return this.mapToTimesheetResponse(updatedTimesheet, timeEntries)
  }

  async rejectTimesheet(id: string): Promise<TimesheetResponseDto> {
    const timesheet = await this.db.timesheet.findUnique({
      where: { id }
    })

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found')
    }

    if (timesheet.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted timesheets can be rejected')
    }

    const updatedTimesheet = await this.db.timesheet.update({
      where: { id },
      data: { status: 'REJECTED' },
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

    const timeEntries = await this.getTimeEntriesForWeek(
      updatedTimesheet.userId,
      updatedTimesheet.weekStartDate,
      updatedTimesheet.weekEndDate
    )

    return this.mapToTimesheetResponse(updatedTimesheet, timeEntries)
  }

  async generateTimeReport(queryDto: TimeReportQueryDto): Promise<TimeReportResponseDto> {
    const where: any = {
      date: {
        gte: new Date(queryDto.startDate),
        lte: new Date(queryDto.endDate)
      }
    }

    if (queryDto.userId) where.userId = queryDto.userId
    if (queryDto.companyId) where.companyId = queryDto.companyId
    if (queryDto.status) where.status = queryDto.status

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
        { date: 'asc' },
        { startAt: 'asc' }
      ]
    })

    // Группируем по пользователям
    const userGroups = timeEntries.reduce((acc, entry) => {
      if (!acc[entry.userId]) {
        acc[entry.userId] = {
          user: entry.user,
          entries: []
        }
      }
      acc[entry.userId].entries.push(entry)
      return acc
    }, {} as any)

    const users = Object.values(userGroups).map((group: any) => {
      const summary = this.calculateSummary(group.entries)
      return {
        user: group.user,
        summary,
        entries: group.entries.map((entry: any) => ({
          id: entry.id,
          date: entry.date,
          startAt: entry.startAt,
          endAt: entry.endAt,
          durationMinutes: entry.durationMinutes || 0,
          breakMinutes: entry.breakMinutes || 0,
          status: entry.status,
          company: entry.company,
          notes: entry.notes
        }))
      }
    })

    const overallSummary = this.calculateSummary(timeEntries)

    return {
      period: {
        startDate: new Date(queryDto.startDate),
        endDate: new Date(queryDto.endDate)
      },
      summary: overallSummary,
      users,
      filters: {
        userId: queryDto.userId,
        companyId: queryDto.companyId,
        status: queryDto.status
      }
    }
  }

  // Приватные вспомогательные методы

  private getWeekStart(date: Date): Date {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Понедельник как начало недели
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  private async getTimeEntriesForWeek(userId: string, weekStart: Date, weekEnd: Date): Promise<any[]> {
    return this.db.timeEntry.findMany({
      where: {
        userId,
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startAt: 'asc' }
      ]
    })
  }

  private calculateSummary(timeEntries: any[]): TimeEntrySummary {
    const summary: TimeEntrySummary = {
      totalMinutes: 0,
      totalHours: 0,
      entriesCount: timeEntries.length,
      byStatus: {
        DRAFT: 0,
        SUBMITTED: 0,
        APPROVED: 0,
        REJECTED: 0
      },
      byCompany: []
    }

    const companyTotals = new Map<string, { name: string; minutes: number }>()

    for (const entry of timeEntries) {
      const minutes = entry.durationMinutes || 0
      summary.totalMinutes += minutes
      summary.byStatus[entry.status as keyof typeof summary.byStatus] += minutes

      const companyKey = entry.companyId || 'none'
      const companyName = entry.company?.name || 'No Company'
      
      if (!companyTotals.has(companyKey)) {
        companyTotals.set(companyKey, { name: companyName, minutes: 0 })
      }
      companyTotals.get(companyKey)!.minutes += minutes
    }

    summary.totalHours = Math.round((summary.totalMinutes / 60) * 100) / 100

    summary.byCompany = Array.from(companyTotals.entries()).map(([id, data]) => ({
      companyId: id === 'none' ? null : id,
      companyName: data.name,
      minutes: data.minutes,
      hours: Math.round((data.minutes / 60) * 100) / 100
    }))

    return summary
  }

  private mapToTimesheetResponse(timesheet: any, timeEntries: any[]): TimesheetResponseDto {
    const summary = this.calculateSummary(timeEntries)

    return {
      id: timesheet.id,
      userId: timesheet.userId,
      weekStartDate: timesheet.weekStartDate,
      weekEndDate: timesheet.weekEndDate,
      status: timesheet.status,
      summary,
      user: timesheet.user,
      entries: timeEntries.map(entry => ({
        id: entry.id,
        date: entry.date,
        startAt: entry.startAt,
        endAt: entry.endAt,
        durationMinutes: entry.durationMinutes || 0,
        breakMinutes: entry.breakMinutes || 0,
        status: entry.status,
        company: entry.company,
        notes: entry.notes
      }))
    }
  }
}