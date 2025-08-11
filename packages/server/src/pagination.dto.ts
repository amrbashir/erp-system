import z from "zod";

export const PaginationDto = z
  .object({
    pageIndex: z.number().default(0),
    pageSize: z.number().default(50),
  })
  .transform((data) => ({
    skip: data.pageIndex * data.pageSize,
    take: data.pageSize,
  }));

export type PaginationDto = z.infer<typeof PaginationDto>;
