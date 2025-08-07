import z from "zod";

export const OrgSlugDto = z.object({
  orgSlug: z.string().nonempty("Organization slug is required"),
});

export const CreateOrgDto = z.object({
  name: z.string().min(3),
  slug: z
    .string()
    .regex(/^[!-~]+$/, "Slug must be ASCII")
    .optional(),
  username: z
    .string()
    .min(3)
    .regex(/^[a-zA-Z0-9]+$/, "Username must be alphanumeric"),
  password: z
    .string()
    .min(8)
    .regex(/^[!-~]+$/, "Password must be ASCII"),
});

export type CreateOrgDto = z.infer<typeof CreateOrgDto>;

export const AddBalanceDto = z.object({
  amount: z.string().nonempty("Amount is required"),
});

export type AddBalanceDto = z.infer<typeof AddBalanceDto>;
