import { describe, expect, it } from "vitest";
import { studentFormSchema } from "@/lib/studentSchema";

const validForm = {
  firstName: "Asha",
  lastName: "Rao",
  email: "asha.rao@example.edu",
  phone: "",
  dateOfBirth: "",
  departmentId: "1",
};

function validatePhone(phone: string) {
  return studentFormSchema.safeParse({ ...validForm, phone });
}

describe("student form validation", () => {
  it.each(["9876543210", "+919876543210", ""])("accepts optional phone value %s", (phone) => {
    expect(validatePhone(phone).success).toBe(true);
  });

  it.each([
    "5876543210",
    "987654321",
    "09876543210",
    "98765432101",
    "+915876543210",
    "+9198765432101",
    "+91 9876543210",
    "98765 43210",
    "98765-43210",
    "987654321a",
    "9876543210\n",
  ])("rejects invalid phone value %j", (phone) => {
    const result = validatePhone(phone);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.phone).toContain(
        "Enter a valid 10-digit Indian mobile number, optionally with +91.",
      );
    }
  });

  it("rejects whitespace-only and numeric-only names but permits mixed names", () => {
    expect(studentFormSchema.safeParse({ ...validForm, firstName: "   " }).success).toBe(false);
    expect(studentFormSchema.safeParse({ ...validForm, firstName: "१२३" }).success).toBe(false);
    expect(studentFormSchema.safeParse({ ...validForm, firstName: "Asha2" }).success).toBe(true);
  });

  it("trims names and emails and rejects impossible or future birth dates", () => {
    const trimmed = studentFormSchema.safeParse({
      ...validForm,
      firstName: " Asha ",
      email: " asha.rao@example.edu ",
      dateOfBirth: new Date().toISOString().slice(0, 10),
    });
    expect(trimmed.success).toBe(true);
    if (trimmed.success) {
      expect(trimmed.data.firstName).toBe("Asha");
      expect(trimmed.data.email).toBe("asha.rao@example.edu");
    }

    expect(studentFormSchema.safeParse({ ...validForm, dateOfBirth: "2023-02-30" }).success).toBe(false);
    expect(studentFormSchema.safeParse({ ...validForm, dateOfBirth: "2023-02-28invalid" }).success).toBe(false);
    expect(studentFormSchema.safeParse({ ...validForm, dateOfBirth: "2999-01-01" }).success).toBe(false);
  });
});
