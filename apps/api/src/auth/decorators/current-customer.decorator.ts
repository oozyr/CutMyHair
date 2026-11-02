import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Customer } from '@cutmyhair/shared';

export const CurrentCustomer = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Customer => {
    const request = ctx.switchToHttp().getRequest();
    return request.customer;
  },
);
