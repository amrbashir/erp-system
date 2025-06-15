import { z } from "zod/v4";

export type CreateCustomerDto = z.infer<typeof CreateCustomerDto>;
export const CreateCustomerDto = z.object({
  name: z.string().nonempty(),
  email: z.email().optional(),
  phone: z.string().optional(),
  organizationId: z.uuid().nonempty(),
});
