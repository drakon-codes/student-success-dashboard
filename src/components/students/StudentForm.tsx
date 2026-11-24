import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Building2, CalendarDays, Hash, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage, getValidationErrors } from "@/lib/api";
import { studentFormSchema } from "@/lib/studentSchema";
import { parseDateTime, type Department, type StudentFormValues } from "@/lib/students";
import { cn } from "@/lib/utils";

const MANUAL = "__manual__";
const FIELDS: (keyof StudentFormValues)[] = ["firstName", "lastName", "email", "phone", "dateOfBirth", "departmentId"];

export function StudentForm({
  mode,
  defaultValues,
  departments,
  createdAt,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  defaultValues: StudentFormValues;
  departments: Department[];
  createdAt?: string;
  onSubmit: (values: StudentFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { register, handleSubmit, control, formState, setError, setValue } = form;
  const { errors, isSubmitting, isDirty } = formState;

  const known = departments.some((d) => String(d.departmentId) === defaultValues.departmentId);
  const [manual, setManual] = useState(departments.length === 0 || (defaultValues.departmentId !== "" && !known));

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      const fieldErrors = getValidationErrors(error);
      let mapped = false;
      for (const [field, message] of Object.entries(fieldErrors)) {
        if ((FIELDS as string[]).includes(field)) {
          setError(field as keyof StudentFormValues, { message });
          mapped = true;
        }
      }
      toast.error(mode === "create" ? "Couldn't create student" : "Couldn't save changes", {
        description: mapped ? "Please fix the highlighted fields." : getApiErrorMessage(error),
      });
    }
  });

  const created = parseDateTime(createdAt ?? null);

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Section title="Personal details" description="The student's legal name and date of birth.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" error={errors.firstName?.message} icon={<User />}>
            <Input id="firstName" autoComplete="given-name" placeholder="Aarav" className="pl-9" aria-invalid={!!errors.firstName} {...register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message} icon={<User />}>
            <Input id="lastName" autoComplete="family-name" placeholder="Sharma" className="pl-9" aria-invalid={!!errors.lastName} {...register("lastName")} />
          </Field>
          <Field label="Date of birth" optional htmlFor="dateOfBirth" error={errors.dateOfBirth?.message} icon={<CalendarDays />}>
            <Input
              id="dateOfBirth"
              type="date"
              max={format(new Date(), "yyyy-MM-dd")}
              className="pl-9 [color-scheme:dark]"
              aria-invalid={!!errors.dateOfBirth}
              {...register("dateOfBirth")}
            />
          </Field>
        </div>
      </Section>

      <Section title="Contact" description="How the department can reach this student.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="email" error={errors.email?.message} icon={<Mail />}>
            <Input id="email" type="email" autoComplete="email" placeholder="aarav.sharma@university.edu" className="pl-9" aria-invalid={!!errors.email} {...register("email")} />
          </Field>
          <Field label="Phone" optional htmlFor="phone" error={errors.phone?.message} icon={<Phone />}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" className="pl-9" aria-invalid={!!errors.phone} {...register("phone")} />
          </Field>
        </div>
      </Section>

      <Section title="Enrollment" description="Department the student belongs to.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Department"
            htmlFor="departmentId"
            error={errors.departmentId?.message}
            icon={manual ? <Hash /> : undefined}
            hint={
              manual
                ? departments.length
                  ? undefined
                  : "Enter the DepartmentId from your database."
                : undefined
            }
          >
            {manual ? (
              <div className="flex gap-2">
                <Input
                  id="departmentId"
                  inputMode="numeric"
                  placeholder="Department ID, e.g. 1"
                  className="pl-9"
                  aria-invalid={!!errors.departmentId}
                  {...register("departmentId")}
                />
                {departments.length ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setManual(false);
                      setValue("departmentId", "", { shouldDirty: true });
                    }}
                  >
                    List
                  </Button>
                ) : null}
              </div>
            ) : (
              <Controller
                control={control}
                name="departmentId"
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => {
                      if (v === MANUAL) {
                        setManual(true);
                        field.onChange("");
                        return;
                      }
                      field.onChange(v);
                    }}
                  >
                    <SelectTrigger id="departmentId" aria-invalid={!!errors.departmentId} onBlur={field.onBlur}>
                      <span className="flex items-center gap-2 truncate">
                        <Building2 className="size-4 text-subtle-foreground" />
                        <SelectValue placeholder="Choose a department" />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.departmentId} value={String(d.departmentId)}>
                          {d.departmentName}
                          <span className="ml-2 font-mono text-xs text-subtle-foreground">#{d.departmentId}</span>
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem value={MANUAL}>Enter a department ID…</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>

          {mode === "edit" ? (
            <Field label="Created" htmlFor="createdAt" icon={<Lock />} hint="Set by the system and can't be changed.">
              <Input
                id="createdAt"
                readOnly
                disabled
                value={created ? format(created, "d MMM yyyy, HH:mm") : "—"}
                className="pl-9"
              />
            </Field>
          ) : null}
        </div>
      </Section>

      <div className="glass sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border p-3 shadow-elevated">
        <span className="hidden pl-2 text-xs text-muted-foreground sm:block">
          {mode === "edit" ? (isDirty ? "You have unsaved changes" : "No changes yet") : "Fields marked optional can be left blank"}
        </span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="premium" disabled={isSubmitting || (mode === "edit" && !isDirty)}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : null}
            {mode === "create" ? "Create student" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="surface-card animate-fade-up grid gap-6 p-5 md:grid-cols-[220px_1fr] md:p-6">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  error,
  hint,
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  error?: string | undefined;
  hint?: string | undefined;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {label}
        {optional ? <span className="font-normal text-subtle-foreground">Optional</span> : null}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-3 z-[1] text-subtle-foreground [&_svg]:size-4">{icon}</span>
        ) : null}
        {children}
      </div>
      {error ? (
        <p className={cn("animate-fade-up text-xs text-destructive")}>{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
