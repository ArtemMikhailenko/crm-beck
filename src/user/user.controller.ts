import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Post,
  Delete,
  Query,
  Patch,
  Req,
  UnauthorizedException
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { Request } from 'express'

import { Authorization } from '@/auth/decorators/auth.decorator'
import { Authorized } from '@/auth/decorators/authorizated.decorator'
import { Permissions } from '@/rbac/decorators/permissions.decorator'
import { ChangePasswordDto } from '@/user/dto/change-password.dto'
import { UserDto } from '@/user/dto/user.dto'
import { UserService } from '@/user/user.service'
import {
  UpdateUserRatesDto,
  CreateUserContactDto,
  UpdateUserContactDto,
  CreateUserVacationDto,
  UpdateUserVacationDto,
  UpdateUserAlertSettingsDto
} from '@/user/dto/user-extended.dto'

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled authorization - re-enable later with proper token system
  // @Authorization()
  @ApiOperation({ summary: 'Получить собственный профиль' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  public async findProfile() {
    // TODO: Return empty profile object for now - implement proper authentication later
    return {
      id: 'temp-user-id',
      email: 'user@example.com',
      name: 'Test User',
      message: 'Authentication not implemented yet'
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:view')
  @ApiOperation({ summary: 'Получить список всех пользователей' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Номер страницы' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Количество записей на странице' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Поисковый запрос' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Фильтр по статусу' })
  @ApiQuery({ name: 'companyId', required: false, type: String, description: 'Фильтр по компании' })
  @ApiResponse({ status: 200, description: 'Список пользователей с пагинацией' })
  public async findAll(@Query() query: any) {
    return this.userService.findAll(query)
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:view')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Детальная информация о пользователе' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  public async findById(@Param('id') id: string) {
    return this.userService.findById(id)
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Обновить данные пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно обновлен' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  public async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.updateUser(id, updateData)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:delete')
  @ApiOperation({ summary: 'Удалить пользователя' })
  @ApiResponse({ status: 200, description: 'Пользователь успешно удален' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  public async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id)
  }

  @Patch(':id/roles')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:assign_roles')
  @ApiOperation({ summary: 'Назначить роли пользователю' })
  @ApiResponse({ status: 200, description: 'Роли успешно назначены' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  public async assignRoles(@Param('id') id: string, @Body('roleIds') roleIds: string[]) {
    return this.userService.assignRoles(id, roleIds)
  }

  @Get('profile/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @ApiOperation({ summary: 'Получить профиль пользователя по ID (legacy)' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  public async findProfileById(@Param('id') id: string) {
    return this.userService.findById(id)
  }

  @Put('profile/:id')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @ApiOperation({ summary: 'Обновить профиль пользователя (legacy)' })
  public async updateProfile(@Param('id') id: string, @Body() dto: UserDto) {
    return this.userService.updateProfile(id, dto)
  }

  @Put('profile')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @ApiOperation({ summary: 'Обновить собственный профиль' })
  public async updateProfileUser(
    @Authorized('id') id: string,
    @Body() dto: UserDto
  ) {
    return this.userService.updateProfile(id, dto)
  }

  @Put('password')
  @HttpCode(HttpStatus.OK)
  @Authorization()
  @ApiOperation({ summary: 'Изменить пароль' })
  @ApiResponse({ status: 200, description: 'Пароль успешно изменен' })
  @ApiResponse({ status: 401, description: 'Неверный текущий пароль' })
  public async changePassword(
    @Authorized('id') id: string,
    @Body() dto: ChangePasswordDto
  ) {
    return this.userService.changePassword(id, dto)
  }

  // ========== Extended User Management Endpoints ==========

  // Rates and Schedule Management
  @Patch(':id/rates')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Обновить ставки оплаты и расписание пользователя' })
  @ApiResponse({ status: 200, description: 'Ставки успешно обновлены' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  public async updateUserRates(
    @Param('id') userId: string,
    @Body() dto: UpdateUserRatesDto
  ) {
    return this.userService.updateUserRates(userId, dto)
  }

  // User Contacts Management
  @Get(':id/contacts')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:view')
  @ApiOperation({ summary: 'Получить контакты пользователя' })
  @ApiResponse({ status: 200, description: 'Список контактов' })
  public async getUserContacts(@Param('id') userId: string) {
    return this.userService.getUserContacts(userId)
  }

  @Post(':id/contacts')
  @HttpCode(HttpStatus.CREATED)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Добавить контакт пользователя' })
  @ApiResponse({ status: 201, description: 'Контакт создан' })
  public async createUserContact(
    @Param('id') userId: string,
    @Body() dto: CreateUserContactDto
  ) {
    return this.userService.createUserContact(userId, dto)
  }

  @Patch('contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Обновить контакт пользователя' })
  @ApiResponse({ status: 200, description: 'Контакт обновлен' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  public async updateUserContact(
    @Param('contactId') contactId: string,
    @Body() dto: UpdateUserContactDto
  ) {
    return this.userService.updateUserContact(contactId, dto)
  }

  @Delete('contacts/:contactId')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:delete')
  @ApiOperation({ summary: 'Удалить контакт пользователя' })
  @ApiResponse({ status: 200, description: 'Контакт удален' })
  @ApiResponse({ status: 404, description: 'Контакт не найден' })
  public async deleteUserContact(@Param('contactId') contactId: string) {
    return this.userService.deleteUserContact(contactId)
  }

  // User Vacations Management
  @Get(':id/vacations')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:view')
  @ApiOperation({ summary: 'Получить отпуска пользователя' })
  @ApiResponse({ status: 200, description: 'Список отпусков' })
  public async getUserVacations(@Param('id') userId: string) {
    return this.userService.getUserVacations(userId)
  }

  @Post(':id/vacations')
  @HttpCode(HttpStatus.CREATED)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Создать отпуск для пользователя' })
  @ApiResponse({ status: 201, description: 'Отпуск создан' })
  public async createUserVacation(
    @Param('id') userId: string,
    @Body() dto: CreateUserVacationDto
  ) {
    return this.userService.createUserVacation(userId, dto)
  }

  @Patch('vacations/:vacationId')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Обновить отпуск пользователя' })
  @ApiResponse({ status: 200, description: 'Отпуск обновлен' })
  @ApiResponse({ status: 404, description: 'Отпуск не найден' })
  public async updateUserVacation(
    @Param('vacationId') vacationId: string,
    @Body() dto: UpdateUserVacationDto
  ) {
    return this.userService.updateUserVacation(vacationId, dto)
  }

  @Delete('vacations/:vacationId')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:delete')
  @ApiOperation({ summary: 'Удалить отпуск пользователя' })
  @ApiResponse({ status: 200, description: 'Отпуск удален' })
  @ApiResponse({ status: 404, description: 'Отпуск не найден' })
  public async deleteUserVacation(@Param('vacationId') vacationId: string) {
    return this.userService.deleteUserVacation(vacationId)
  }

  // User Alert Settings Management
  @Get(':id/alerts')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:view')
  @ApiOperation({ summary: 'Получить настройки уведомлений пользователя' })
  @ApiResponse({ status: 200, description: 'Настройки уведомлений' })
  public async getUserAlertSettings(@Param('id') userId: string) {
    return this.userService.getUserAlertSettings(userId)
  }

  @Patch(':id/alerts')
  @HttpCode(HttpStatus.OK)
  // TODO: Temporarily disabled for testing - re-enable later
  // @Authorization()
  // @Permissions('users:edit')
  @ApiOperation({ summary: 'Обновить настройку уведомлений пользователя' })
  @ApiResponse({ status: 200, description: 'Настройка обновлена' })
  public async updateUserAlertSetting(
    @Param('id') userId: string,
    @Body() dto: UpdateUserAlertSettingsDto
  ) {
    return this.userService.updateUserAlertSetting(userId, dto)
  }
}
