import 'reflect-metadata';

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { AppRole } from './app-role.enum';
import { ROLES_KEY } from './roles.decorator';
import { normalizeRoleName } from './role-normalizer';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.getAllowedRoles(context);

    if (allowedRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: { role?: string };
    }>();

    const userRole = normalizeRoleName(request.user?.role);

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para realizar esta accion',
      );
    }

    return true;
  }

  private getAllowedRoles(context: ExecutionContext): AppRole[] {
    const handlerRoles =
      Reflect.getMetadata(ROLES_KEY, context.getHandler()) as AppRole[] | undefined;

    if (handlerRoles?.length) {
      return handlerRoles;
    }

    const classRoles = Reflect.getMetadata(
      ROLES_KEY,
      context.getClass(),
    ) as AppRole[] | undefined;

    return classRoles ?? [];
  }
}

