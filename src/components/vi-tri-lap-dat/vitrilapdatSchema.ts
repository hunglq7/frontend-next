import * as z from "zod";
export const formSchema = z.object({
  ma_vi_tri_lap_dat: z
    .string()
    .trim()
    .length(7, "Mã vị trí lắp đặt phải có đúng 7 ký tự."),
  ten_vi_tri: z
    .string()
    .trim()
    .min(1, "Tên vị trí phải nhập.")
    .max(100, "Tên vị trí không được vượt quá 100 ký tự."),
});

export type FormData = z.infer<typeof formSchema>;
