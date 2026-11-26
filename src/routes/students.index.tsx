import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight, Eye, Pencil, RefreshCw, Search, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiNotConfigured, EmptyState, ErrorState } from "@/components/common/States";
import { PageHeader } from "@/components/common/PageHeader";
import { DepartmentBadge } from "@/components/students/DepartmentBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage, isApiConfigured } from "@/lib/api";
import { departmentsQueryOptions } from "@/lib/departments";
import {
  formatStudentId,
  fullName,
  deleteStudent,
  parseDateOnly,
  parseDateTime,
  studentKeys,
  studentsQueryOptions,
  type Student,
} from "@/lib/students";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "name" | "id";
type StudentsSearch = { q?: string; dept?: number; sort?: SortKey };

const SORTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "name", label: "Name A–Z" },
  { value: "id", label: "Student ID" },
];

const PAGE_SIZE = 10;

export const Route = createFileRoute("/students/")({
  validateSearch: (raw: Record<string, unknown>): StudentsSearch => {
    const out: StudentsSearch = {};
    if (typeof raw["q"] === "string" && raw["q"].trim()) out.q = raw["q"];
    const dept = Number(raw["dept"]);
    if (Number.isInteger(dept) && dept > 0) out.dept = dept;
    const sort = raw["sort"];
    if (sort === "oldest" || sort === "name" || sort === "id" || sort === "newest") out.sort = sort;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Students · Student Management System" },
      { name: "description", content: "Search, filter and manage every student record." },
      { property: "og:title", content: "Students · Student Management System" },
      { property: "og:description", content: "Search, filter and manage every student record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentsPage,
});

function sortStudents(list: Student[], sort: SortKey): Student[] {
  const time = (s: Student) => parseDateTime(s.createdAt)?.getTime() ?? 0;
  const copy = [...list];
  switch (sort) {
    case "oldest":
      return copy.sort((a, b) => time(a) - time(b) || a.studentId - b.studentId);
    case "name":
      return copy.sort((a, b) => fullName(a).localeCompare(fullName(b)));
    case "id":
      return copy.sort((a, b) => a.studentId - b.studentId);
    default:
      return copy.sort((a, b) => time(b) - time(a) || b.studentId - a.studentId);
  }
}

function StudentsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/students/" });
  const query = useQuery(studentsQueryOptions);
  const departmentsQuery = useQuery(departmentsQueryOptions);
  const [text, setText] = useState(search.q ?? "");
  const [page, setPage] = useState(1);
  const sort = search.sort ?? "newest";

  useEffect(() => setText(search.q ?? ""), [search.q]);

  const setSearch = (patch: Partial<Record<keyof StudentsSearch, string | number | undefined>>) => {
    void navigate({
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === "") delete next[k];
        return next as StudentsSearch;
      },
      replace: true,
    });
    setPage(1);
  };

  // Debounce typing into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== text.trim()) setSearch({ q: text.trim() || undefined });
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const students = query.data ?? [];
  const departments = departmentsQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = (search.q ?? "").toLowerCase().trim();
    const list = students.filter((s) => {
      if (search.dept && s.departmentId !== search.dept) return false;
      if (!q) return true;
      return [fullName(s), s.email, s.phone ?? "", String(s.studentId), s.department?.departmentName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    return sortStudents(list, sort);
  }, [students, search.q, search.dept, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const hasFilters = Boolean(search.q || search.dept);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Records"
        title="Students"
        description={
          query.data ? `${students.length} student${students.length === 1 ? "" : "s"} in your database.` : "All student records from your API."
        }
        actions={
          <>
            <Button variant="outline" size="icon" aria-label="Refresh" onClick={() => void query.refetch()} disabled={!isApiConfigured || query.isFetching}>
              <RefreshCw className={cn(query.isFetching && "animate-spin")} />
            </Button>
            <Button asChild variant="premium">
              <Link to="/students/new">
                <UserPlus /> Add student
              </Link>
            </Button>
          </>
        }
      />

      {!isApiConfigured ? (
        <ApiNotConfigured />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <section className="surface-card animate-fade-up overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search by name, email, phone or ID…"
                aria-label="Search students"
                className="h-10 w-full rounded-lg border border-input bg-surface pl-9 pr-9 text-sm text-foreground placeholder:text-subtle-foreground transition-all hover:border-border-strong focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
              />
              {text ? (
                <button
                  type="button"
                  onClick={() => setText("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <div className="flex gap-3">
              <Select
                value={search.dept ? String(search.dept) : "all"}
                onValueChange={(v) => setSearch({ dept: v === "all" ? undefined : Number(v) })}
              >
                <SelectTrigger className="w-full lg:w-52" aria-label="Filter by department">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => (
                    <SelectItem key={d.departmentId} value={String(d.departmentId)}>
                      {d.departmentName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSearch({ sort: v === "newest" ? undefined : v })}>
                <SelectTrigger className="w-full lg:w-40" aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {departmentsQuery.isError ? (
            <p className="border-t border-border px-4 py-2 text-xs text-destructive" role="alert">
              Department filters are unavailable. {getApiErrorMessage(departmentsQuery.error)}
            </p>
          ) : null}

          {query.isPending ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={hasFilters ? "No matching students" : "No students yet"}
                description={hasFilters ? "Try a different search or department." : "Add your first student to get started."}
                action={
                  hasFilters ? (
                    <Button variant="outline" onClick={() => { setText(""); setSearch({ q: undefined, dept: undefined }); }}>
                      Clear filters
                    </Button>
                  ) : (
                    <Button asChild variant="premium">
                      <Link to="/students/new"><UserPlus /> Add student</Link>
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-subtle-foreground">
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-3 py-3 font-medium">Student</th>
                      <th className="px-3 py-3 font-medium">Phone</th>
                      <th className="px-3 py-3 font-medium">Date of birth</th>
                      <th className="px-3 py-3 font-medium">Department</th>
                      <th className="px-3 py-3 font-medium">Added</th>
                      <th className="px-5 py-3 text-right font-medium">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((s) => (
                      <StudentRow key={s.studentId} student={s} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
                <span className="tabular">
                  Showing {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Previous page" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                    <ChevronLeft />
                  </Button>
                  <span className="tabular px-2">
                    {current} / {pageCount}
                  </span>
                  <Button variant="ghost" size="icon" className="size-8" aria-label="Next page" disabled={current >= pageCount} onClick={() => setPage(current + 1)}>
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function StudentRow({ student: s }: { student: Student }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dob = parseDateOnly(s.dateOfBirth);
  const created = parseDateTime(s.createdAt);
  const open = () => void navigate({ to: "/students/$studentId", params: { studentId: String(s.studentId) } });
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(s.studentId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentKeys.all }),
        queryClient.invalidateQueries({ queryKey: studentKeys.detail(s.studentId) }),
      ]);
      toast.success(`${fullName(s)} deleted`);
      setDeleteOpen(false);
    } catch (error) {
      toast.error(`Could not delete ${fullName(s)}: ${getApiErrorMessage(error)}`);
    } finally {
      setDeleting(false);
    }
  };
  return (
    <tr onClick={open} className="group cursor-pointer transition-colors hover:bg-surface-hover/40">
      <td className="px-5 py-3 font-mono text-xs text-subtle-foreground">{formatStudentId(s.studentId)}</td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <StudentAvatar student={s} size="sm" />
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{fullName(s)}</div>
            <div className="truncate text-xs text-muted-foreground">{s.email}</div>
          </div>
        </div>
      </td>
      <td className="tabular px-3 py-3 text-muted-foreground">{s.phone ?? <span className="text-subtle-foreground">—</span>}</td>
      <td className="tabular px-3 py-3 text-muted-foreground">
        {dob ? format(dob, "d MMM yyyy") : <span className="text-subtle-foreground">—</span>}
      </td>
      <td className="px-3 py-3">
        <DepartmentBadge student={s} />
      </td>
      <td className="px-3 py-3 text-xs text-muted-foreground">
        {created ? formatDistanceToNow(created, { addSuffix: true }) : "—"}
      </td>
      <td className="px-5 py-3">
        <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
          <Button asChild variant="ghost" size="icon" className="size-8" aria-label={`View ${fullName(s)}`}>
            <Link to="/students/$studentId" params={{ studentId: String(s.studentId) }}>
              <Eye />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" className="size-8" aria-label={`Edit ${fullName(s)}`}>
            <Link to="/students/$studentId/edit" params={{ studentId: String(s.studentId) }}>
              <Pencil />
            </Link>
          </Button>
          <AlertDialog open={deleteOpen} onOpenChange={(open) => !deleting && setDeleteOpen(open)}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              aria-label={`Delete ${fullName(s)}`}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {fullName(s)}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently deletes this student record. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <Button variant="destructive" onClick={() => void confirmDelete()} disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete student"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
          <Skeleton className="h-3 w-10 bg-surface-hover" />
          <Skeleton className="size-8 rounded-full bg-surface-hover" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-40 bg-surface-hover" />
            <Skeleton className="h-3 w-56 bg-surface-hover" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full bg-surface-hover" />
        </div>
      ))}
    </div>
  );
}
