import { createParamDecorator } from "@nestjs/common";

import type { ExecutionContext } from "@nestjs/common";

import type { User } from "../prisma/generated/client";

export const AuthUser = createParamDecorator((data: keyof User, ctx: ExecutionContext) => {
  const user = ctx.switchToHttp().getRequest().user as User;
  return data ? user && user[data] : user;
});
