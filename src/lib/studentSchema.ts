import { z } from "zod";
import { parseDateOnly } from "./students";

/** Validation for the student form. Phone and DateOfBirth are optional. */
export const studentFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100, "Keep it under 100 characters"),
  lastName: z.string().trim().min(1, "Last name is required").max(100, "Keep it under 100 characters"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email address").max(255),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^[+()\-.\s\d]{6,20}$/.test(v), "Enter a valid phone number"),
  dateOfBirth: z.string().refine((v) => {
    if (v === "") return true;
    const d = parseDateOnly(v);
    return d !== null && d.getTime() < Date.now() && d.getFullYear() > 1900;
  }, "Enter a past date"),
  departmentId: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Choose a department"),
});
