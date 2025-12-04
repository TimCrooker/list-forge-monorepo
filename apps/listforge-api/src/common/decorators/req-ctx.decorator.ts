import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../interfaces/request-context.interface';

export const ReqCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.context;
  },
);

