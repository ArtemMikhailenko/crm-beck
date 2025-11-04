import { SetMetadata } from '@nestjs/common'
import { PermissionLevel } from '@prisma/client'

export const PERMISSIONS_KEY = 'permissions'

export interface PermissionRequirement {
  key: string
  level?: PermissionLevel
}

export const Permissions = (...requirements: (string | PermissionRequirement)[]) => {
  // Convert strings to PermissionRequirement objects
  const normalizedRequirements = requirements.map(req => 
    typeof req === 'string' 
      ? { key: req, level: PermissionLevel.AUTHORIZED }
      : req
  )
  
  return SetMetadata(PERMISSIONS_KEY, normalizedRequirements)
}