import { SetMetadata } from "@nestjs/common"
import { Roles } from "src/roles/dtos/enums/roles.enum"

export const ROLES_KEY = 'roles'

export const ROLES = (...roles: Roles[]) => SetMetadata(ROLES_KEY,roles)