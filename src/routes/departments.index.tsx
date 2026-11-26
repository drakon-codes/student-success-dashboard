import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Pencil, Plus, RefreshCw, Trash2, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ApiNotConfigured, EmptyState, ErrorState } from "@/components/common/States";
import { PageHeader } from "@/components/common/PageHeader";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiConfigured, getApiErrorMessage } from "@/lib/api";
import {
  createDepartment,
  deleteDepartment,
  departmentKeys,
  departmentsQueryOptions,
  updateDepartment,
  type Department,
} from "@/lib/departments";
import { studentKeys } from "@/lib/students";

export const Route = createFileRoute("/departments/")({
  head: () => ({
    meta: [
      { title: "Departments · Student Management System" },
      { name: "description", content: "Manage departments and their student enrollments." },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const queryClient = useQueryClient();
  const query = useQuery(departmentsQueryOptions);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const refreshRelatedData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: departmentKeys.all }),
      queryClient.invalidateQueries({ queryKey: studentKeys.all }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: ({ id, departmentName }: { id?: number; departmentName: string }) =>
      id === undefined
        ? createDepartment({ departmentName })
        : updateDepartment(id, { departmentName }),
    onSuccess: async (_, variables) => {
      await refreshRelatedData();
      toast.success(variables.id === undefined ? "Department created" : "Department updated");
      setEditorOpen(false);
      setEditing(null);
    },
    onError: (error) => toast.error("Couldn't save department", { description: getApiErrorMessage(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (department: Department) => deleteDepartment(department.departmentId),
    onSuccess: async (_, department) => {
      await refreshRelatedData();
      toast.success(`${department.departmentName} deleted`);
      setDeleting(null);
    },
    onError: (error) => toast.error("Couldn't delete department", { description: getApiErrorMessage(error) }),
  });

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (department: Department) => {
    setEditing(department);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Departments"
        description="Manage departments and see how many students belong to each one."
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="Refresh departments"
              onClick={() => void query.refetch()}
              disabled={!isApiConfigured || query.isFetching}
            >
              <RefreshCw className={query.isFetching ? "animate-spin" : undefined} />
            </Button>
            <Button variant="premium" onClick={openCreate} disabled={!isApiConfigured}>
              <Plus /> Add department
            </Button>
          </>
        }
      />

      {!isApiConfigured ? (
        <ApiNotConfigured />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : query.isPending ? (
        <DepartmentTableSkeleton />
      ) : query.data.length === 0 ? (
        <EmptyState
          title="No departments yet"
          description="Add a department before assigning students to it."
          action={<Button variant="premium" onClick={openCreate}><Plus /> Add department</Button>}
        />
      ) : (
        <section className="surface-card animate-fade-up overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-subtle-foreground">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-3 py-3 font-medium">Department</th>
                  <th className="px-3 py-3 font-medium">Students</th>
                  <th className="px-5 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {query.data.map((department) => (
                  <tr key={department.departmentId} className="transition-colors hover:bg-surface-hover/40">
                    <td className="px-5 py-3 font-mono text-xs text-subtle-foreground">
                      #{String(department.departmentId).padStart(4, "0")}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <Building2 className="size-4" />
                        </span>
                        <span className="font-medium text-foreground">{department.departmentName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">
                      <span className="inline-flex items-center gap-2"><Users className="size-4" /> {department.studentCount}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Edit ${department.departmentName}`}
                          onClick={() => openEdit(department)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          aria-label={`Delete ${department.departmentName}`}
                          onClick={() => setDeleting(department)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <DepartmentEditorDialog
        open={editorOpen}
        onOpenChange={(open) => {
          if (!saveMutation.isPending) {
            setEditorOpen(open);
            if (!open) setEditing(null);
          }
        }}
        department={editing}
        isSaving={saveMutation.isPending}
        onSubmit={(departmentName) =>
          saveMutation.mutate(
            editing
              ? { id: editing.departmentId, departmentName }
              : { departmentName },
          )
        }
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending && !open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.departmentName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Departments with assigned students cannot be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!deleting || deleteMutation.isPending}
              onClick={() => deleting && deleteMutation.mutate(deleting)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete department"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DepartmentEditorDialog({
  open,
  onOpenChange,
  department,
  isSaving,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: Department | null;
  isSaving: boolean;
  onSubmit: (departmentName: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(department?.departmentName ?? "");
      setError("");
    }
  }, [department, open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = name.trim();
    if (!normalized) {
      setError("Department name is required.");
      return;
    }
    if (normalized.length > 100) {
      setError("Department name must be 100 characters or fewer.");
      return;
    }
    setError("");
    onSubmit(normalized);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle>{department ? "Edit department" : "Add department"}</DialogTitle>
            <DialogDescription>
              Department names are trimmed and must be unique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label htmlFor="departmentName" className="text-xs font-medium text-muted-foreground">Department name</label>
            <Input
              id="departmentName"
              autoFocus
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "departmentName-error" : undefined}
              placeholder="e.g. Computer Science"
            />
            {error ? <p id="departmentName-error" className="text-xs text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" variant="premium" disabled={isSaving}>
              {isSaving ? "Saving…" : department ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DepartmentTableSkeleton() {
  return (
    <section className="surface-card divide-y divide-border overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="h-3 w-12 bg-surface-hover" />
          <Skeleton className="h-8 w-8 rounded-lg bg-surface-hover" />
          <Skeleton className="h-3 w-48 flex-1 bg-surface-hover" />
          <Skeleton className="h-3 w-12 bg-surface-hover" />
        </div>
      ))}
    </section>
  );
}
