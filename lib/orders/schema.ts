import { z } from 'zod';

const name = z.string().trim().min(1, 'שם נדרש').max(80, 'שם ארוך מדי');

const phone = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^05\d{8}$/, 'מספר טלפון לא תקין'));

const dueDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך לא תקין');

const note = z
  .string()
  .trim()
  .max(500, 'הערה ארוכה מדי')
  .optional()
  .transform((v) => (v ? v : undefined));

const quantity = z
  .number()
  .int('כמות לא תקינה')
  .min(1, 'כמות לא תקינה')
  .max(99, 'כמות לא תקינה');

export const placeOrderSchema = z.object({
  name,
  phone,
  dueDate,
  note,
  items: z
    .array(z.object({ id: z.string().uuid('מוצר לא תקין'), quantity }))
    .min(1, 'הסל ריק')
    .max(30, 'יותר מדי מוצרים בהזמנה'),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

export const ORDER_STATUSES = ['new', 'confirmed', 'ready', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'חדשה',
  confirmed: 'אושרה',
  ready: 'מוכנה',
  cancelled: 'בוטלה',
};

export const adminOrderSchema = z.object({
  name,
  phone,
  dueDate,
  note,
  status: z.enum(ORDER_STATUSES, 'סטטוס לא תקין'),
  isPaid: z.boolean(),
  lines: z
    .array(
      z.object({
        productId: z.string().uuid().nullable(),
        productName: z.string().trim().min(1, 'שם מוצר נדרש').max(80, 'שם ארוך מדי'),
        unitPrice: z.number().min(0, 'מחיר לא יכול להיות שלילי'),
        quantity,
      }),
    )
    .min(1, 'צריך לפחות מוצר אחד'),
});

export type AdminOrderInput = z.infer<typeof adminOrderSchema>;
