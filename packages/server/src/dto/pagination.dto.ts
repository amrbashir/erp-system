import z from "zod";

export const PaginationDto = z
  .object({
    page: z.number().default(0),
    pageSize: z.number().default(30),
  })
  .transform((data) => ({
    skip: data.page * data.pageSize,
    take: data.pageSize,
  }));

export type PaginationDto = z.output<typeof PaginationDto>;

export type PaginatedOutput<T> = {
  data: T;
  totalCount: number;
};
