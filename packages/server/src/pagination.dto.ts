import z from "zod";

export const PaginationDto = z.object({
  skip: z.number().default(0),
  take: z.number().default(30),
});

export type PaginationDto = z.infer<typeof PaginationDto>;
