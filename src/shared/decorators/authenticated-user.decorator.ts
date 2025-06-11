import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IDecodedJwtToken } from '../strategies';

export const AuthenticatedUser = createParamDecorator(
  (data: never, ctx: ExecutionContext) => {
    if (ctx.getType() === 'http') {
      return ctx.switchToHttp().getRequest().user as IDecodedJwtToken;
    }
  },
);
