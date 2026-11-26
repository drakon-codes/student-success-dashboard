import { z } from "zod";
import { parseDateOnly } from "./students";

const phonePattern = /^(?:\+91)?[6-9][0-9]{9}$/;

const studentName = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be 50 characters or fewer`)
    .refine((value) => !/^\p{N}+$/u.test(value), `${label} cannot contain only numbers`);

/** Validation for the student form. Phone and DateOfBirth are optional. */
export const studentFormSchema = z.object({
  firstName: studentName("First name"),
  lastName: studentName("Last name"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .max(150, "Email must be 150 characters or fewer"),
  phone: z.string().refine(
    (value) => value === "" || ((value.length === 10 || value.length === 13) && phonePattern.test(value)),
    "Enter a valid 10-digit Indian mobile number, optionally with +91.",
  ),
  dateOfBirth: z.string().refine((v) => {
    if (v === "") return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
    const d = parseDateOnly(v);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d !== null && d.getTime() <= today.getTime();
  }, "Enter a valid date that is not in the future"),
  departmentId: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v) && Number(v) > 0, "Choose a department"),
});
