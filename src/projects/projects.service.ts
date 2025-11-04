import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/project.dto'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    // Verify client exists
    const client = await this.prisma.company.findUnique({
      where: { id: createProjectDto.clientId },
    })

    if (!client) {
      throw new NotFoundException(`Client company with ID '${createProjectDto.clientId}' not found`)
    }

    // Verify manager exists if provided
    if (createProjectDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: createProjectDto.managerId },
      })

      if (!manager) {
        throw new NotFoundException(`Manager with ID '${createProjectDto.managerId}' not found`)
      }
    }

    // Check if projectId is unique
    const existing = await this.prisma.project.findUnique({
      where: { projectId: createProjectDto.projectId },
    })

    if (existing) {
      throw new BadRequestException(`Project with ID '${createProjectDto.projectId}' already exists`)
    }

    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        startDate: createProjectDto.startDate ? new Date(createProjectDto.startDate) : null,
        endDate: createProjectDto.endDate ? new Date(createProjectDto.endDate) : null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
    })
  }

  async findAll(query: ProjectQueryDto) {
    const { clientId, managerId, status, search, page = 1, pageSize = 10, sort } = query

    const where: any = {}

    if (clientId) {
      where.clientId = clientId
    }

    if (managerId) {
      where.managerId = managerId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { projectId: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Parse sort
    let orderBy: any = { createdAt: 'desc' }
    if (sort) {
      const [field, direction] = sort.split(':')
      orderBy = { [field]: direction || 'asc' }
    }

    const skip = (page - 1) * pageSize
    const take = pageSize

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ])

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            type: true,
            taxId: true,
            address: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            phone: true,
          },
        },
        timeEntries: {
          take: 10,
          orderBy: { date: 'desc' },
          select: {
            id: true,
            date: true,
            durationMinutes: true,
            notes: true,
            user: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found`)
    }

    return project
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id } })

    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found`)
    }

    // Verify manager exists if provided
    if (updateProjectDto.managerId) {
      const manager = await this.prisma.user.findUnique({
        where: { id: updateProjectDto.managerId },
      })

      if (!manager) {
        throw new NotFoundException(`Manager with ID '${updateProjectDto.managerId}' not found`)
      }
    }

    // Check projectId uniqueness if changing
    if (updateProjectDto.projectId && updateProjectDto.projectId !== project.projectId) {
      const existing = await this.prisma.project.findUnique({
        where: { projectId: updateProjectDto.projectId },
      })

      if (existing) {
        throw new BadRequestException(`Project with ID '${updateProjectDto.projectId}' already exists`)
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...updateProjectDto,
        startDate: updateProjectDto.startDate ? new Date(updateProjectDto.startDate) : undefined,
        endDate: updateProjectDto.endDate ? new Date(updateProjectDto.endDate) : undefined,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
    })
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } })

    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found`)
    }

    await this.prisma.project.delete({ where: { id } })

    return { message: 'Project deleted successfully' }
  }

  // Get projects by client ID (for company detail page)
  async findByClient(clientId: string, query?: ProjectQueryDto) {
    const client = await this.prisma.company.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      throw new NotFoundException(`Client company with ID '${clientId}' not found`)
    }

    return this.findAll({ ...query, clientId })
  }
}

