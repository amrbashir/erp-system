import { z } from "zod";

export const ProductIdDto = z.object({
  productId: z.string().nonempty("Product ID is required"),
});
export type ProductIdDto = z.infer<typeof ProductIdDto>;

export const UpdateProductDto = z.object({
  barcode: z.string().optional(),
  description: z.string().optional(),
  purchasePrice: z.string().optional(),
  sellingPrice: z.string().optional(),
  stockQuantity: z.number().int().optional(),
});

export type UpdateProductDto = z.infer<typeof UpdateProductDto>;
