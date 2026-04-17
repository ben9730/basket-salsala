import { z } from 'zod';

const PUBLIC_URL_RE =
  /\/storage\/v1\/object\/public\/product-images\/[^/]+\/[^/]+\.(?:jpe?g|png|webp)$/i;

export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'שם נדרש').max(80, 'שם ארוך מדי'),
  price: z
    .number()
    .superRefine((n, ctx) => {
      if (!Number.isFinite(n)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'מחיר חייב להיות מספר' });
      } else if (n < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'מחיר לא יכול להיות שלילי' });
      }
    }),
  description: z
    .string()
    .trim()
    .max(500, 'תיאור ארוך מדי')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  is_available: z.boolean(),
  image_urls: z
    .array(z.string().regex(PUBLIC_URL_RE, 'כתובת תמונה לא חוקית'))
    .max(5, 'לכל היותר 5 תמונות'),
});

export type ProductInput = z.infer<typeof productSchema>;

export type ActionResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; fieldErrors?: Record<string, string>; message?: string };

export function parseProductForm(formData: FormData, id: string): ActionResult<ProductInput> {
  const rawImages = formData.get('image_urls');
  let imageUrls: unknown = [];
  if (typeof rawImages === 'string' && rawImages.length > 0) {
    try {
      imageUrls = JSON.parse(rawImages);
    } catch {
      return { ok: false, fieldErrors: { image_urls: 'רשימת תמונות לא חוקית' } };
    }
  }

  const result = productSchema.safeParse({
    id,
    name: formData.get('name'),
    price: Number(formData.get('price')),
    description: formData.get('description') ?? '',
    is_available: formData.get('is_available') === 'on',
    image_urls: imageUrls,
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form');
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, fieldErrors };
  }

  return { ok: true, data: result.data };
}
