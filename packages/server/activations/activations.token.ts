import * as z from "zod";

export const activationTokenPayload = z.object({
	hardwareId: z.string(),
	activated: z.boolean(),
});

export type ActivationTokenPayload = z.infer<typeof activationTokenPayload>;
