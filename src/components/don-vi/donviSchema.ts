import * as z from "zod";
export const formSchema = z.object({
  ma_don_vi: z
    .string()
    .trim()
    .min(1, "Mã đơn vị phải nhập.")
    .max(3, "Mã đơn vị không được vượt quá 3 ký tự."),
  ten_don_vi: z
    .string()
    .trim()
    .min(1, "Tên đơn vị phải nhập.")
    .max(100, "Tên đơn vị không được vượt quá 100 ký tự."),
});

export type FormData = z.infer<typeof formSchema>;
