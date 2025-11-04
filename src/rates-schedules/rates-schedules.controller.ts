import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'

import { Authorization } from '@/auth/decorators/auth.decorator'
import { Permissions } from '@/rbac/decorators/permissions.decorator'
import { RatesService } from './rates.service'
import { SchedulesService } from './schedules.service'
import { CreateRateDto, UpdateRateDto, RateResponseDto } from './dto/rate.dto'
import { CreateScheduleDto, UpdateScheduleDto, ScheduleResponseDto } from './dto/schedule.dto'

@ApiTags('rates-schedules')
@Controller('rates-schedules')
export class RatesSchedulesController {
  constructor(
    private readonly ratesService: RatesService,
    private readonly schedulesService: SchedulesService
  ) {}

  // ===== RATES ENDPOINTS =====

  @Post('rates')
  @HttpCode(HttpStatus.CREATED)
  @Authorization()
  @Permissions('rates:create')
  @ApiOperation({ summary: 'Создать новую ставку' })
  @ApiResponse({ status: 201, description: 'Ставка успешно создана', type: RateResponseDto })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Период ставки пересекается с существующей' })
  async createRate(@Body() createRateDto: CreateRateDto): Promise<RateResponseDto> {
    return this.ratesService.createRate(createRateDto)
  }

  @Get('rates')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('rates:view')
  @ApiOperation({ summary: 'Получить список ставок' })
  @ApiQuery({ name: 'userId', required: false, description: 'Фильтр по пользователю' })
  @ApiResponse({ status: 200, description: 'Список ставок', type: [RateResponseDto] })
  async findAllRates(@Query('userId') userId?: string): Promise<RateResponseDto[]> {
    return this.ratesService.findAllRates(userId)
  }

  @Get('rates/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('rates:view')
  @ApiOperation({ summary: 'Получить ставку по ID' })
  @ApiResponse({ status: 200, description: 'Детали ставки', type: RateResponseDto })
  @ApiResponse({ status: 404, description: 'Ставка не найдена' })
  async findRateById(@Param('id') id: string): Promise<RateResponseDto> {
    return this.ratesService.findRateById(id)
  }

  @Patch('rates/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('rates:edit')
  @ApiOperation({ summary: 'Обновить ставку' })
  @ApiResponse({ status: 200, description: 'Ставка успешно обновлена', type: RateResponseDto })
  @ApiResponse({ status: 404, description: 'Ставка не найдена' })
  @ApiResponse({ status: 409, description: 'Обновленный период пересекается с существующей ставкой' })
  async updateRate(@Param('id') id: string, @Body() updateRateDto: UpdateRateDto): Promise<RateResponseDto> {
    return this.ratesService.updateRate(id, updateRateDto)
  }

  @Delete('rates/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('rates:delete')
  @ApiOperation({ summary: 'Удалить ставку' })
  @ApiResponse({ status: 200, description: 'Ставка успешно удалена' })
  @ApiResponse({ status: 404, description: 'Ставка не найдена' })
  async deleteRate(@Param('id') id: string): Promise<{ message: string }> {
    return this.ratesService.deleteRate(id)
  }

  @Get('rates/current/:userId/:rateType')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('rates:view')
  @ApiOperation({ summary: 'Получить текущую действующую ставку пользователя' })
  @ApiResponse({ status: 200, description: 'Текущая ставка или null', type: RateResponseDto })
  async getCurrentRate(
    @Param('userId') userId: string,
    @Param('rateType') rateType: string,
    @Query('date') date?: string
  ): Promise<RateResponseDto | null> {
    const targetDate = date ? new Date(date) : new Date()
    return this.ratesService.getCurrentRate(userId, rateType, targetDate)
  }

  // ===== SCHEDULES ENDPOINTS =====

  @Post('schedules')
  @HttpCode(HttpStatus.CREATED)
  @Authorization()
  @Permissions('schedules:create')
  @ApiOperation({ summary: 'Создать новое расписание' })
  @ApiResponse({ status: 201, description: 'Расписание успешно создано', type: ScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 400, description: 'Некорректные данные расписания' })
  async createSchedule(@Body() createScheduleDto: CreateScheduleDto): Promise<ScheduleResponseDto> {
    return this.schedulesService.createSchedule(createScheduleDto)
  }

  @Get('schedules')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('schedules:view')
  @ApiOperation({ summary: 'Получить список расписаний' })
  @ApiQuery({ name: 'userId', required: false, description: 'Фильтр по пользователю' })
  @ApiResponse({ status: 200, description: 'Список расписаний', type: [ScheduleResponseDto] })
  async findAllSchedules(@Query('userId') userId?: string): Promise<ScheduleResponseDto[]> {
    return this.schedulesService.findAllSchedules(userId)
  }

  @Get('schedules/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('schedules:view')
  @ApiOperation({ summary: 'Получить расписание по ID' })
  @ApiResponse({ status: 200, description: 'Детали расписания', type: ScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  async findScheduleById(@Param('id') id: string): Promise<ScheduleResponseDto> {
    return this.schedulesService.findScheduleById(id)
  }

  @Patch('schedules/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('schedules:edit')
  @ApiOperation({ summary: 'Обновить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание успешно обновлено', type: ScheduleResponseDto })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  @ApiResponse({ status: 400, description: 'Некорректные данные расписания' })
  async updateSchedule(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto): Promise<ScheduleResponseDto> {
    return this.schedulesService.updateSchedule(id, updateScheduleDto)
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('schedules:delete')
  @ApiOperation({ summary: 'Удалить расписание' })
  @ApiResponse({ status: 200, description: 'Расписание успешно удалено' })
  @ApiResponse({ status: 404, description: 'Расписание не найдено' })
  async deleteSchedule(@Param('id') id: string): Promise<{ message: string }> {
    return this.schedulesService.deleteSchedule(id)
  }

  @Get('schedules/default/:userId')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('schedules:view')
  @ApiOperation({ summary: 'Получить расписание по умолчанию для пользователя' })
  @ApiResponse({ status: 200, description: 'Расписание по умолчанию или null', type: ScheduleResponseDto })
  async getDefaultSchedule(@Param('userId') userId: string): Promise<ScheduleResponseDto | null> {
    return this.schedulesService.getDefaultSchedule(userId)
  }

  @Get('schedules/working-hours/:userId')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @Permissions('schedules:view')
  @ApiOperation({ summary: 'Получить рабочие часы пользователя на конкретную дату' })
  @ApiQuery({ name: 'date', required: false, description: 'Дата в формате YYYY-MM-DD (по умолчанию сегодня)' })
  @ApiResponse({ status: 200, description: 'Рабочие часы на дату или null если выходной' })
  async getWorkingHoursForDate(
    @Param('userId') userId: string,
    @Query('date') date?: string
  ): Promise<{ workStart: string, workEnd: string, lunchStart?: string, lunchEnd?: string } | null> {
    const targetDate = date ? new Date(date) : new Date()
    return this.schedulesService.getWorkingHoursForDate(userId, targetDate)
  }
}