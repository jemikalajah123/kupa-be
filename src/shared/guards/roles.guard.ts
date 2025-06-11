import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators';
import { IDecodedJwtToken } from '../strategies';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride(Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true; // If no specific roles are required, allow access

    const request = context.switchToHttp().getRequest();
    const user = request.user as IDecodedJwtToken;

    if (!user || !user.role) return false;

    return requiredRoles.includes(user.role);
  }
}
