import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';
import { jwtPayloadDto } from '../dtos/jwtPayload.dto';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const ctx = GqlExecutionContext.create(context);
    const req: Request = ctx.getContext().req;
    const userToken = req.user as jwtPayloadDto;
    if (!userToken) {
      console.log('no token found');
      return false;
    }
    const userRole = userToken.role;
    const hasRequiredRole = requiredRoles.some((role) => userRole === role);
    return hasRequiredRole
  }
}
