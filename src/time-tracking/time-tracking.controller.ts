import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam
} from '@nestjs/swagger'
import { AuthGuard } from '@/auth/guards/auth.guard'
import { PermissionsGuard } from '@/rbac/guards/permissions.guard'
import { Permissions } from '@/rbac/decorators/permissions.decorator'
import { TimeEntriesService } from './time-entries.service'
import { TimerService } from './timer.service'
import { TimesheetsService } from './timesheets.service'
import {
  CreateTimeEntryDto,
  UpdateTimeEntryDto,
  TimeEntryResponseDto
} from './dto/time-entry.dto'
import {
  StartTimerDto,
  StopTimerDto,
  TimerStatusDto
} from './dto/timer.dto'
import {
  CreateTimesheetDto,
  TimesheetResponseDto,
  TimeReportQueryDto,
  TimeReportResponseDto
} from './dto/timesheet.dto'

@ApiTags('Time Tracking')
@ApiBearerAuth()
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('time-tracking')
export class TimeTrackingController {
  constructor(
    private readonly timeEntriesService: TimeEntriesService,
    private readonly timerService: TimerService,
    private readonly timesheetsService: TimesheetsService
  ) {}

  // === TIME ENTRIES ===

  @Post('entries')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Create time entry',
    description: 'Create a new time entry for work tracking' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Time entry created successfully',
    type: TimeEntryResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid time entry data' })
  @ApiResponse({ status: 409, description: 'Time overlap detected' })
  async createTimeEntry(@Body() createDto: CreateTimeEntryDto): Promise<TimeEntryResponseDto> {
    return this.timeEntriesService.createTimeEntry(createDto)
  }

  @Get('entries')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Get time entries',
    description: 'Retrieve time entries with optional filtering' 
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by entry status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time entries retrieved successfully',
    type: [TimeEntryResponseDto] 
  })
  async getTimeEntries(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('companyId') companyId?: string,
    @Query('status') status?: string
  ): Promise<TimeEntryResponseDto[]> {
    return this.timeEntriesService.findTimeEntries(userId, startDate, endDate, companyId, status)
  }

  @Get('entries/:id')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Get time entry by ID',
    description: 'Retrieve a specific time entry by its ID' 
  })
  @ApiParam({ name: 'id', description: 'Time entry ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time entry retrieved successfully',
    type: TimeEntryResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async getTimeEntry(@Param('id') id: string): Promise<TimeEntryResponseDto> {
    return this.timeEntriesService.findTimeEntryById(id)
  }

  @Put('entries/:id')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Update time entry',
    description: 'Update an existing time entry' 
  })
  @ApiParam({ name: 'id', description: 'Time entry ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time entry updated successfully',
    type: TimeEntryResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Cannot modify approved time entry' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async updateTimeEntry(
    @Param('id') id: string,
    @Body() updateDto: UpdateTimeEntryDto
  ): Promise<TimeEntryResponseDto> {
    return this.timeEntriesService.updateTimeEntry(id, updateDto)
  }

  @Delete('entries/:id')
  @Permissions('TIME_TRACKING:AUTHORIZED')
  @ApiOperation({ 
    summary: 'Delete time entry',
    description: 'Delete a time entry (requires AUTHORIZED permission)' 
  })
  @ApiParam({ name: 'id', description: 'Time entry ID' })
  @ApiResponse({ status: 200, description: 'Time entry deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete approved time entry' })
  @ApiResponse({ status: 404, description: 'Time entry not found' })
  async deleteTimeEntry(@Param('id') id: string): Promise<{ message: string }> {
    return this.timeEntriesService.deleteTimeEntry(id)
  }

  @Post('entries/:id/submit')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Submit time entry',
    description: 'Submit time entry for approval' 
  })
  @ApiParam({ name: 'id', description: 'Time entry ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time entry submitted successfully',
    type: TimeEntryResponseDto 
  })
  async submitTimeEntry(@Param('id') id: string): Promise<TimeEntryResponseDto> {
    return this.timeEntriesService.submitTimeEntry(id)
  }

  @Post('entries/:id/approve')
  @Permissions('TIME_TRACKING:AUTHORIZED')
  @ApiOperation({ 
    summary: 'Approve time entry',
    description: 'Approve a submitted time entry (requires AUTHORIZED permission)' 
  })
  @ApiParam({ name: 'id', description: 'Time entry ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time entry approved successfully',
    type: TimeEntryResponseDto 
  })
  async approveTimeEntry(@Param('id') id: string): Promise<TimeEntryResponseDto> {
    return this.timeEntriesService.approveTimeEntry(id)
  }

  @Post('entries/:id/reject')
  @Permissions('TIME_TRACKING:AUTHORIZED')
  @ApiOperation({ 
    summary: 'Reject time entry',
    description: 'Reject a submitted time entry (requires AUTHORIZED permission)' 
  })
  @ApiParam({ name: 'id', description: 'Time entry ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time entry rejected successfully',
    type: TimeEntryResponseDto 
  })
  async rejectTimeEntry(@Param('id') id: string): Promise<TimeEntryResponseDto> {
    return this.timeEntriesService.rejectTimeEntry(id)
  }

  // === TIMER ===

  @Post('timer/start')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Start timer',
    description: 'Start a new work timer for the current user' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Timer started successfully',
    type: TimerStatusDto 
  })
  @ApiResponse({ status: 400, description: 'Timer is already running' })
  async startTimer(@Request() req: any, @Body() startDto: StartTimerDto): Promise<TimerStatusDto> {
    return this.timerService.startTimer(req.user.id, startDto)
  }

  @Post('timer/stop')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Stop timer',
    description: 'Stop the active timer for the current user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Timer stopped successfully',
    type: TimerStatusDto 
  })
  @ApiResponse({ status: 400, description: 'No active timer found' })
  async stopTimer(@Request() req: any, @Body() stopDto: StopTimerDto): Promise<TimerStatusDto> {
    return this.timerService.stopTimer(req.user.id, stopDto)
  }

  @Get('timer/status')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Get timer status',
    description: 'Get current timer status for the user' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Timer status retrieved successfully',
    type: TimerStatusDto 
  })
  async getTimerStatus(@Request() req: any): Promise<TimerStatusDto | null> {
    return this.timerService.getTimerStatus(req.user.id)
  }

  @Delete('timer/cancel')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Cancel timer',
    description: 'Cancel the active timer without saving' 
  })
  @ApiResponse({ status: 200, description: 'Timer cancelled successfully' })
  @ApiResponse({ status: 400, description: 'No active timer found' })
  async cancelTimer(@Request() req: any): Promise<{ message: string }> {
    return this.timerService.cancelTimer(req.user.id)
  }

  // === TIMESHEETS ===

  @Post('timesheets')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Create timesheet',
    description: 'Create a weekly timesheet from time entries' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Timesheet created successfully',
    type: TimesheetResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Timesheet for this week already exists' })
  async createTimesheet(@Body() createDto: CreateTimesheetDto): Promise<TimesheetResponseDto> {
    return this.timesheetsService.createTimesheet(createDto)
  }

  @Get('timesheets')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Get timesheets',
    description: 'Retrieve timesheets with optional filtering' 
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by timesheet status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timesheets retrieved successfully',
    type: [TimesheetResponseDto] 
  })
  async getTimesheets(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ): Promise<TimesheetResponseDto[]> {
    return this.timesheetsService.findTimesheets(userId, startDate, endDate, status)
  }

  @Get('timesheets/:id')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Get timesheet by ID',
    description: 'Retrieve a specific timesheet by its ID' 
  })
  @ApiParam({ name: 'id', description: 'Timesheet ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timesheet retrieved successfully',
    type: TimesheetResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Timesheet not found' })
  async getTimesheet(@Param('id') id: string): Promise<TimesheetResponseDto> {
    return this.timesheetsService.findTimesheetById(id)
  }

  @Post('timesheets/:id/submit')
  @Permissions('TIME_TRACKING:LIMITED')
  @ApiOperation({ 
    summary: 'Submit timesheet',
    description: 'Submit timesheet for approval' 
  })
  @ApiParam({ name: 'id', description: 'Timesheet ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timesheet submitted successfully',
    type: TimesheetResponseDto 
  })
  async submitTimesheet(@Param('id') id: string): Promise<TimesheetResponseDto> {
    return this.timesheetsService.submitTimesheet(id)
  }

  @Post('timesheets/:id/approve')
  @Permissions('TIME_TRACKING:AUTHORIZED')
  @ApiOperation({ 
    summary: 'Approve timesheet',
    description: 'Approve a submitted timesheet (requires AUTHORIZED permission)' 
  })
  @ApiParam({ name: 'id', description: 'Timesheet ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timesheet approved successfully',
    type: TimesheetResponseDto 
  })
  async approveTimesheet(@Param('id') id: string): Promise<TimesheetResponseDto> {
    return this.timesheetsService.approveTimesheet(id)
  }

  @Post('timesheets/:id/reject')
  @Permissions('TIME_TRACKING:AUTHORIZED')
  @ApiOperation({ 
    summary: 'Reject timesheet',
    description: 'Reject a submitted timesheet (requires AUTHORIZED permission)' 
  })
  @ApiParam({ name: 'id', description: 'Timesheet ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Timesheet rejected successfully',
    type: TimesheetResponseDto 
  })
  async rejectTimesheet(@Param('id') id: string): Promise<TimesheetResponseDto> {
    return this.timesheetsService.rejectTimesheet(id)
  }

  // === REPORTS ===

  @Get('reports/time')
  @Permissions('TIME_TRACKING:AUTHORIZED')
  @ApiOperation({ 
    summary: 'Generate time report',
    description: 'Generate comprehensive time tracking report (requires AUTHORIZED permission)' 
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Report start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'Report end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'companyId', required: false, description: 'Filter by company ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by entry status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Time report generated successfully',
    type: TimeReportResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  async generateTimeReport(
    @Query() queryDto: TimeReportQueryDto
  ): Promise<TimeReportResponseDto> {
    return this.timesheetsService.generateTimeReport(queryDto)
  }
}