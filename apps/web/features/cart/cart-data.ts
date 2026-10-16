import { z } from 'zod';

export const maxCartQuantity = 99;
export const maxCartProducts = 30;
const savedCartSchema = z.object({
  branch: z.object({ id: z.uuid(), name: z.string().min(1), slug: z.string().min(1) }).nullable(),
  items: z
    .array(
      z.object({
        productId: z.uuid(),
        name: z.string().min(1),
        unitPrice: z.string().regex(/^\d{1,10}(\.\d{2})?$/),
        quantity: z.int().min(1).max(maxCartQuantity)
      })
    )
    .max(maxCartProducts)
});

export function readSavedCart(value: unknown): z.infer<typeof savedCartSchema> {
  const parsed = savedCartSchema.safeParse(value);
  if (
    !parsed.success ||
    (parsed.data.items.length > 0 && !parsed.data.branch) ||
    new Set(parsed.data.items.map((item) => item.productId)).size !== parsed.data.items.length
  ) {
    return { branch: null, items: [] };
  }
  return parsed.data.items.length === 0 ? { branch: null, items: [] } : parsed.data;
}
