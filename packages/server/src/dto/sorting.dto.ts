import z from "zod";

import { SortOrderInput } from "@/prisma/index.ts";

export const SortingDto = z
  .array(
    z.object({
      orderBy: z.string(),
      desc: z.boolean(),
    }),
  )
  .transform((data) => {
    if (data.length === 0) return undefined;

    return data.map((data) => {
      const sortOrder: SortOrderInput["sort"] = data.desc ? "desc" : "asc";
      return { [data.orderBy]: sortOrder };
    });
  });

export type SortingDto = z.output<typeof SortingDto>;
