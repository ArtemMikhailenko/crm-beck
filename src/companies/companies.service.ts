import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CreateContactDto, 
  UpdateContactDto,
  CompanyQueryDto,
  UploadDocumentDto
} from './dto/company.dto'
import { randomBytes } from 'crypto'

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCompanyDto: CreateCompanyDto) {
    // Check if company with same name already exists
    const existingCompany = await this.prisma.company.findFirst({
      where: { name: createCompanyDto.name }
    })

    if (existingCompany) {
      throw new ConflictException(`Company with name '${createCompanyDto.name}' already exists`)
    }

    // Destructure only the fields that exist in the Prisma schema
    const { name, type, taxId, iban, address, status } = createCompanyDto

    return this.prisma.company.create({
      data: {
        name,
        type,
        taxId,
        iban,
        address,
        status,
      },
      include: {
        contacts: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            documents: true,
            timeEntries: true,
          }
        }
      }
    })
  }

  async findAll(query: CompanyQueryDto) {
    const { type, search, status, page = 1, pageSize = 20, sort = 'name:asc' } = query

    // Build where clause
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { taxId: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Parse sort
    const [sortField, sortOrder] = sort.split(':')
    const orderBy = { [sortField]: sortOrder || 'asc' }

    // Calculate pagination
    const skip = (page - 1) * pageSize
    const take = pageSize

    // Get companies and total count
    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          contacts: true,
          _count: {
            select: {
              members: true,
              documents: true,
              timeEntries: true,
            }
          }
        }
      }),
      this.prisma.company.count({ where })
    ])

    return {
      data: companies,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      }
    }
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        contacts: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
                phone: true,
              }
            }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        timeEntries: {
          include: {
            user: {
              select: {
                displayName: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })

    if (!company) {
      throw new NotFoundException(`Company with ID '${id}' not found`)
    }

    return company
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } })

    if (!company) {
      throw new NotFoundException(`Company with ID '${id}' not found`)
    }

    // Check for name conflicts if name is being updated
    if (updateCompanyDto.name && updateCompanyDto.name !== company.name) {
      const existingCompany = await this.prisma.company.findFirst({
        where: { 
          name: updateCompanyDto.name,
          id: { not: id }
        }
      })

      if (existingCompany) {
        throw new ConflictException(`Company with name '${updateCompanyDto.name}' already exists`)
      }
    }

    return this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      include: {
        contacts: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                displayName: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            documents: true,
            timeEntries: true,
          }
        }
      }
    })
  }

  async remove(id: string) {
    const company = await this.prisma.company.findUnique({ 
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            documents: true,
            timeEntries: true,
          }
        }
      }
    })

    if (!company) {
      throw new NotFoundException(`Company with ID '${id}' not found`)
    }

    // Check if company has associated data
    if (company._count.members > 0 || company._count.documents > 0 || company._count.timeEntries > 0) {
      throw new BadRequestException('Cannot delete company with associated users, documents, or time entries')
    }

    return this.prisma.company.delete({ where: { id } })
  }

  // Contacts management
  async createContact(companyId: string, createContactDto: CreateContactDto) {
    // Verify company exists
    const company = await this.prisma.company.findUnique({ where: { id: companyId } })
    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`)
    }

    return this.prisma.companyContact.create({
      data: {
        ...createContactDto,
        companyId,
      }
    })
  }

  async updateContact(contactId: string, updateContactDto: UpdateContactDto) {
    const contact = await this.prisma.companyContact.findUnique({ where: { id: contactId } })

    if (!contact) {
      throw new NotFoundException(`Contact with ID '${contactId}' not found`)
    }

    return this.prisma.companyContact.update({
      where: { id: contactId },
      data: updateContactDto,
    })
  }

  async removeContact(contactId: string) {
    const contact = await this.prisma.companyContact.findUnique({ where: { id: contactId } })

    if (!contact) {
      throw new NotFoundException(`Contact with ID '${contactId}' not found`)
    }

    return this.prisma.companyContact.delete({ where: { id: contactId } })
  }

  // Company summary/statistics
  async getSummary(id: string) {
    const company = await this.findOne(id)

    // Get time entries aggregation for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const timeStats = await this.prisma.timeEntry.aggregate({
      where: {
        companyId: id,
        date: { gte: thirtyDaysAgo }
      },
      _sum: {
        durationMinutes: true,
      },
      _count: {
        id: true,
      }
    })

    const totalHours = timeStats._sum.durationMinutes ? Math.round((timeStats._sum.durationMinutes / 60) * 100) / 100 : 0

    return {
      company: {
        id: company.id,
        name: company.name,
        type: company.type,
        status: company.status,
      },
      stats: {
        totalMembers: company.members.length,
        totalContacts: company.contacts.length,
        totalDocuments: company.documents.length,
        recentTimeEntries: timeStats._count.id,
        totalHoursLast30Days: totalHours,
      },
      recentDocuments: company.documents.slice(0, 5),
      recentTimeEntries: company.timeEntries.slice(0, 5),
    }
  }

  // Contact management
  async getContacts(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`)
    }

    return this.prisma.companyContact.findMany({
      where: { companyId },
    })
  }

  // Document management
  async getDocuments(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`)
    }

    return this.prisma.document.findMany({
      where: { 
        ownerType: 'company',
        ownerId: companyId 
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async initiateDocumentUpload(companyId: string, uploadDto: UploadDocumentDto) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`)
    }

    // Generate unique file key
    const fileKey = `companies/${companyId}/documents/${Date.now()}-${randomBytes(8).toString('hex')}-${uploadDto.fileName}`

    // Create document record (will be completed after upload confirmation)
    const document = await this.prisma.document.create({
      data: {
        ownerType: 'company',
        ownerId: companyId,
        title: uploadDto.title,
        storageKey: fileKey,
        mime: uploadDto.fileType,
        size: uploadDto.fileSize,
        createdBy: companyId, // TODO: use actual user ID when auth is enabled
      },
    })

    // TODO: Generate presigned URL for S3 upload
    // For now, return mock presigned URL
    const mockPresignedUrl = `https://mock-s3.amazonaws.com/${fileKey}?uploadId=${document.id}`

    return {
      documentId: document.id,
      uploadUrl: mockPresignedUrl,
      fileKey,
      expiresIn: 3600, // 1 hour
    }
  }

  async confirmDocumentUpload(companyId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID '${documentId}' not found`)
    }

    if (document.ownerId !== companyId || document.ownerType !== 'company') {
      throw new BadRequestException('Document does not belong to this company')
    }

    // Document is already created, just return it
    return document
  }

  async deleteDocument(companyId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new NotFoundException(`Document with ID '${documentId}' not found`)
    }

    if (document.ownerId !== companyId || document.ownerType !== 'company') {
      throw new BadRequestException('Document does not belong to this company')
    }

    // TODO: Delete file from S3

    await this.prisma.document.delete({
      where: { id: documentId },
    })

    return { message: 'Document deleted successfully' }
  }

  // Project management
  async getProjects(companyId: string, query?: any) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    })

    if (!company) {
      throw new NotFoundException(`Company with ID '${companyId}' not found`)
    }

    const { page = 1, pageSize = 10, status, sort } = query || {}

    const where: any = { clientId: companyId }

    if (status) {
      where.status = status
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
}
