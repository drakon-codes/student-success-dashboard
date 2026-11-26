import { queryOptions } from "@tanstack/react-query";
import type { Department } from "./departments";
import { api, isApiConfigured, unwrapList } from "./api";
export type { Department } from "./departments";

/** Mirrors the C# Student entity (camelCase JSON). CreatedAt is read-only in the UI. */
export interface Student {
  studentId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  departmentId: number;
  createdAt: string;
  department: Pick<Department, "departmentId" | "departmentName"> | null;
}

/** Form state. The Department navigation object is never part of a form. */
export interface StudentFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // yyyy-MM-dd or ""
  departmentId: string; // numeric string
}

/** Body sent to POST / PUT /api/Students. Uses DepartmentId, never the Department object. */
export interface StudentPayload {
  studentId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  departmentId: number;
  createdAt?: string;
}

// ---------- normalisation (tolerates camelCase or PascalCase JSON) ----------

function pick(obj: Record<string, unknown>, key: string): unknown {
  if (key in obj) return obj[key];
  const pascal = key.charAt(0).toUpperCase() + key.slice(1);
  return obj[pascal];
}

function str(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function optStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

export function normalizeStudent(raw: unknown): Student {
  const o = (raw ?? {}) as Record<string, unknown>;
  const deptRaw = pick(o, "department");
  let department: Pick<Department, "departmentId" | "departmentName"> | null = null;
  if (deptRaw && typeof deptRaw === "object") {
    const d = deptRaw as Record<string, unknown>;
    department = {
      departmentId: Number(pick(d, "departmentId") ?? 0),
      departmentName: str(pick(d, "departmentName")),
    };
  }
  const departmentId = Number(pick(o, "departmentId") ?? department?.departmentId ?? 0);
  const departmentName = str(pick(o, "departmentName") ?? department?.departmentName);
  if (!department && (departmentId > 0 || departmentName)) {
    department = { departmentId, departmentName };
  } else if (department && !department.departmentName && departmentName) {
    department.departmentName = departmentName;
  }
  return {
    studentId: Number(pick(o, "studentId") ?? 0),
    firstName: str(pick(o, "firstName")),
    lastName: str(pick(o, "lastName")),
    email: str(pick(o, "email")),
    phone: optStr(pick(o, "phone")),
    dateOfBirth: optStr(pick(o, "dateOfBirth")),
    departmentId,
    createdAt: str(pick(o, "createdAt")),
    department,
  };
}

// ---------- API calls ----------

export async function fetchStudents(): Promise<Student[]> {
  const { data } = await api.get("/api/Students");
  return unwrapList<unknown>(data).map(normalizeStudent);
}

export async function fetchStudent(id: number): Promise<Student> {
  const { data } = await api.get(`/api/Students/${id}`);
  return normalizeStudent(data);
}

export async function createStudent(payload: StudentPayload): Promise<Student | null> {
  const { data } = await api.post("/api/Students", payload);
  return data && typeof data === "object" ? normalizeStudent(data) : null;
}

/** PUT /api/Students/{id}. */
export async function updateStudent(id: number, payload: StudentPayload): Promise<void> {
  await api.put(`/api/Students/${id}`, payload);
}

/** DELETE /api/Students/{id}. A 204 response is a successful Axios response. */
export async function deleteStudent(id: number): Promise<void> {
  await api.delete(`/api/Students/${id}`);
}

export const studentKeys = {
  all: ["students"] as const,
  detail: (id: number) => ["students", id] as const,
};

export const studentsQueryOptions = queryOptions({
  queryKey: studentKeys.all,
  queryFn: fetchStudents,
  enabled: isApiConfigured,
});

export const studentQueryOptions = (id: number) =>
  queryOptions({
    queryKey: studentKeys.detail(id),
    queryFn: () => fetchStudent(id),
    enabled: isApiConfigured && Number.isFinite(id),
  });

// ---------- form <-> payload ----------

function toDateOnly(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function emptyFormValues(): StudentFormValues {
  return { firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", departmentId: "" };
}

export function toFormValues(s: Student): StudentFormValues {
  return {
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phone: s.phone ?? "",
    dateOfBirth: toDateOnly(s.dateOfBirth),
    departmentId: s.departmentId ? String(s.departmentId) : "",
  };
}

function baseFields(v: StudentFormValues) {
  const phone = v.phone;
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    email: v.email.trim(),
    phone: phone === "" ? null : phone,
    dateOfBirth: v.dateOfBirth ? v.dateOfBirth : null,
    departmentId: Number.parseInt(v.departmentId, 10),
  };
}

export function toCreatePayload(v: StudentFormValues): StudentPayload {
  return baseFields(v);
}

/** Keeps the original StudentId and read-only CreatedAt so the update never resets them. */
export function toUpdatePayload(original: Student, v: StudentFormValues): StudentPayload {
  return { studentId: original.studentId, ...baseFields(v), createdAt: original.createdAt };
}

// ---------- display helpers ----------

export function fullName(s: Pick<Student, "firstName" | "lastName">): string {
  return `${s.firstName} ${s.lastName}`.trim() || "Unnamed student";
}

export function initials(s: Pick<Student, "firstName" | "lastName">): string {
  return `${s.firstName.charAt(0)}${s.lastName.charAt(0)}`.toUpperCase() || "?";
}

export function departmentLabel(s: Pick<Student, "department" | "departmentId">): string {
  const name = s.department?.departmentName?.trim();
  if (name) return name;
  return s.departmentId ? `Department #${s.departmentId}` : "No department";
}

export function formatStudentId(id: number): string {
  return `#${String(id).padStart(4, "0")}`;
}

/** Parses yyyy-MM-dd(…) as a local calendar date so birthdays never shift by timezone. */
export function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== Number(m[1]) ||
    d.getMonth() !== Number(m[2]) - 1 ||
    d.getDate() !== Number(m[3])
  ) {
    return null;
  }
  return d;
}

export function parseDateTime(value: string | null): Date | null {
  if (!value || value.startsWith("0001-01-01")) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function ageOn(dob: Date, now: Date): number {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

// ---------- dashboard stats ----------

export interface DashboardStats {
  total: number;
  newThisMonth: number;
  newLastMonth: number;
  departments: number;
  averageAge: number | null;
  monthly: { key: string; label: string; count: number }[];
  byDepartment: { departmentId: number; name: string; count: number }[];
  recent: Student[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function computeStats(students: Student[], now: Date = new Date(), months = 6): DashboardStats {
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const thisKey = monthKey(now);
  const lastKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const monthly: DashboardStats["monthly"] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthly.push({ key: monthKey(d), label: MONTHS[d.getMonth()] ?? "", count: 0 });
  }
  const monthIndex = new Map(monthly.map((m, i) => [m.key, i]));

  let newThisMonth = 0;
  let newLastMonth = 0;
  let ageSum = 0;
  let ageCount = 0;
  const deptCounts = new Map<number, { name: string; count: number }>();

  for (const s of students) {
    const created = parseDateTime(s.createdAt);
    if (created) {
      const k = monthKey(created);
      if (k === thisKey) newThisMonth++;
      if (k === lastKey) newLastMonth++;
      const idx = monthIndex.get(k);
      if (idx !== undefined) {
        const bucket = monthly[idx];
        if (bucket) bucket.count++;
      }
    }
    const dob = parseDateOnly(s.dateOfBirth);
    if (dob) {
      const age = ageOn(dob, now);
      if (age > 0 && age < 120) {
        ageSum += age;
        ageCount++;
      }
    }
    const entry = deptCounts.get(s.departmentId) ?? { name: departmentLabel(s), count: 0 };
    if (s.department?.departmentName) entry.name = s.department.departmentName;
    entry.count++;
    deptCounts.set(s.departmentId, entry);
  }

  const byDepartment = [...deptCounts.entries()]
    .map(([departmentId, v]) => ({ departmentId, ...v }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const recent = [...students]
    .sort(
      (a, b) =>
        (parseDateTime(b.createdAt)?.getTime() ?? 0) - (parseDateTime(a.createdAt)?.getTime() ?? 0) ||
        b.studentId - a.studentId,
    )
    .slice(0, 6);

  return {
    total: students.length,
    newThisMonth,
    newLastMonth,
    departments: byDepartment.filter((d) => d.departmentId).length,
    averageAge: ageCount ? Math.round((ageSum / ageCount) * 10) / 10 : null,
    monthly,
    byDepartment,
    recent,
  };
}
