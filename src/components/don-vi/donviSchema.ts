import * as z from "zod";
export const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tên đơn vị phải nhập.")
    .max(100, "Tên đơn vị không được vượt quá 100 ký tự."),
});

export type FormData = z.infer<typeof formSchema>;