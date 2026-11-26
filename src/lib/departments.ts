import { queryOptions } from "@tanstack/react-query";
import { api, isApiConfigured, unwrapList } from "./api";

export interface Department {
  departmentId: number;
  departmentName: string;
  studentCount: number;
}

export interface DepartmentPayload {
  departmentName: string;
}

function pick(obj: Record<string, unknown>, key: string): unknown {
  if (key in obj) return obj[key];
  return obj[key.charAt(0).toUpperCase() + key.slice(1)];
}

export function normalizeDepartment(raw: unknown): Department {
  const obj = (raw ?? {}) as Record<string, unknown>;
  return {
    departmentId: Number(pick(obj, "departmentId") ?? 0),
    departmentName: String(pick(obj, "departmentName") ?? ""),
    studentCount: Number(pick(obj, "studentCount") ?? 0),
  };
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data } = await api.get("/api/Departments");
  return unwrapList<unknown>(data).map(normalizeDepartment);
}

export async function createDepartment(payload: DepartmentPayload): Promise<Department> {
  const { data } = await api.post("/api/Departments", payload);
  return normalizeDepartment(data);
}

export async function updateDepartment(id: number, payload: DepartmentPayload): Promise<Department> {
  const { data } = await api.put(`/api/Departments/${id}`, payload);
  return normalizeDepartment(data);
}

export async function deleteDepartment(id: number): Promise<void> {
  await api.delete(`/api/Departments/${id}`);
}

export const departmentKeys = {
  all: ["departments"] as const,
  detail: (id: number) => ["departments", id] as const,
};

export const departmentsQueryOptions = queryOptions({
  queryKey: departmentKeys.all,
  queryFn: fetchDepartments,
  enabled: isApiConfigured,
});

export const departmentQueryOptions = (id: number) =>
  queryOptions({
    queryKey: departmentKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/api/Departments/${id}`);
      return normalizeDepartment(data);
    },
    enabled: isApiConfigured && Number.isInteger(id) && id > 0,
  });
