import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { roles?: string[] };
    if (!user?.roles?.includes('admin')) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
