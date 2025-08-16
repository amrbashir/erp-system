import { TRPCError } from "@trpc/server";
import z from "zod";

import { PaginationDto } from "@/dto/pagination.dto.ts";
import { SortingDto } from "@/dto/sorting.dto.ts";
import { router } from "@/trpc/index.ts";

import { admingOrgProcedure } from "./admin.procedure.ts";
import { CreateUserDto, DeleteUserDto } from "./user.dto.ts";

export const userRouter = router({
  getAll: admingOrgProcedure
    .input(z.object({ pagination: PaginationDto.optional(), sorting: SortingDto.optional() }))
    .query(({ ctx, input }) =>
      ctx.userService.getAll(input.orgSlug, {
        pagination: input.pagination,
        orderBy: input.sorting,
      }),
    ),

  create: admingOrgProcedure
    .input(CreateUserDto)
    .mutation(({ ctx, input }) => ctx.userService.create(input, input.orgSlug)),

  delete: admingOrgProcedure.input(DeleteUserDto).mutation(({ ctx, input }) => {
    if (ctx.user.id === input.userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You cannot delete your own account",
      });
    }

    return ctx.userService.delete(input.userId, input.orgSlug);
  }),
});
