import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { CompanyType } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateProjectDto, UpdateProjectDto, ProjectQueryDto } from './dto/project.dto'

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}
// Create a new project
  async create(createProjectDto: CreateProjectDto) {
    // Resolve client: accept either existing company ID or a free-text name to auto-create CUSTOMER
    let clientId = createProjectDto.clientId
    let client = await this.prisma.company.findUnique({ where: { id: clientId } })

    if (!client) {
      // Treat provided value as a name; find by name or create a new CUSTOMER company
      const asName = clientId.trim()
      client = await this.prisma.company.findFirst({ where: { name: asName } })
      if (!client) {
        client = await this.prisma.company.create({
          data: { name: asName, type: CompanyType.CUSTOMER },
        })
      }
      clientId = client.id
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

    const created = await this.prisma.project.create({
      data: {
        projectId: createProjectDto.projectId,
        name: createProjectDto.name,
        clientId,
        managerId: createProjectDto.managerId ?? null,
        status: createProjectDto.status,
        description: createProjectDto.description,
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
        // @ts-ignore - prisma types may lag before generate
        subcontractors: {
          select: {
            subcontractor: { select: { id: true, name: true } }
          }
        }
      },
    })

    // Handle subcontractors assignment
    if (createProjectDto.subcontractorIds && createProjectDto.subcontractorIds.length > 0) {
      const uniqueIds = Array.from(new Set(createProjectDto.subcontractorIds))

      const subs = await this.prisma.company.findMany({
        where: { id: { in: uniqueIds }, type: CompanyType.SUBCONTRACTOR }
      })

      if (subs.length !== uniqueIds.length) {
        throw new BadRequestException('One or more subcontractors not found or not of type SUBCONTRACTOR')
      }

      // @ts-ignore - prisma types may lag before generate
      await this.prisma.projectSubcontractor.createMany({
        data: uniqueIds.map((sid) => ({ projectId: created.id, subcontractorId: sid }))
      })
    }

    return this.findOne(created.id)
  }

  async findAll(query: ProjectQueryDto) {
  const { clientId, managerId, status, search, page = 1, pageSize = 10, sort, subcontractorId } = query

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

    if (subcontractorId) {
      where.subcontractors = { some: { subcontractorId } }
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

  const pageNum = typeof page === 'string' ? parseInt(page as any, 10) : page
  const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize as any, 10) : pageSize
  const skip = (pageNum - 1) * pageSizeNum
  const take = pageSizeNum

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
          // @ts-ignore - prisma types may lag before generate
          subcontractors: {
            select: {
              subcontractor: { select: { id: true, name: true } }
            }
          }
        },
      }),
      this.prisma.project.count({ where }),
    ])

    return {
      data,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
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
        // @ts-ignore - prisma types may lag before generate
        subcontractors: {
          select: {
            subcontractor: { select: { id: true, name: true, type: true } }
          }
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

  // ===== Subcontractor Management =====
  async getProjectSubcontractors(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found`)
    }
    // @ts-ignore
    const links = await this.prisma.projectSubcontractor.findMany({
      where: { projectId },
      include: { subcontractor: { select: { id: true, name: true, type: true } } }
    })
    return links.map(l => l.subcontractor)
  }

  async addSubcontractors(projectId: string, subcontractorIds: string[]) {
    if (!Array.isArray(subcontractorIds) || subcontractorIds.length === 0) {
      throw new BadRequestException('subcontractorIds must be a non-empty array')
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found`)
    }

    const uniqueIds = Array.from(new Set(subcontractorIds))
    const subs = await this.prisma.company.findMany({
      where: { id: { in: uniqueIds }, type: CompanyType.SUBCONTRACTOR }
    })
    if (subs.length !== uniqueIds.length) {
      throw new BadRequestException('One or more subcontractors not found or not of type SUBCONTRACTOR')
    }

    // Remove already existing links to avoid duplicate id constraint errors
    // @ts-ignore
    const existingLinks = await this.prisma.projectSubcontractor.findMany({
      where: { projectId, subcontractorId: { in: uniqueIds } },
      select: { subcontractorId: true }
    })
    const existingIds = new Set(existingLinks.map(l => l.subcontractorId))
    const toCreate = uniqueIds.filter(id => !existingIds.has(id))

    if (toCreate.length > 0) {
      // @ts-ignore
      await this.prisma.projectSubcontractor.createMany({
        data: toCreate.map(sid => ({ projectId, subcontractorId: sid }))
      })
    }

    return this.getProjectSubcontractors(projectId)
  }

  async removeSubcontractor(projectId: string, subcontractorId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } })
    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found`)
    }
    // @ts-ignore
    const link = await this.prisma.projectSubcontractor.findUnique({
      where: { projectId_subcontractorId: { projectId, subcontractorId } }
    })
    if (!link) {
      throw new NotFoundException('Subcontractor link not found')
    }
    // @ts-ignore
    await this.prisma.projectSubcontractor.delete({
      where: { projectId_subcontractorId: { projectId, subcontractorId } }
    })
    return { message: 'Subcontractor removed', subcontractors: await this.getProjectSubcontractors(projectId) }
  }
}

