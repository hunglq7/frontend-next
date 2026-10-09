import * as z from "zod";
export const formSchema = z.object({
  ten_vi_tri: z
    .string()
    .trim()
    .min(1, "Tên vị trí phải nhập.")
    .max(100, "Tên vị trí không được vượt quá 100 ký tự."),
});

export type FormData = z.infer<typeof formSchema>;
