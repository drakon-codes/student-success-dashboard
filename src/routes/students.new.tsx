import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ApiNotConfigured, ErrorState } from "@/components/common/States";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentForm } from "@/components/students/StudentForm";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiConfigured } from "@/lib/api";
import { departmentsQueryOptions } from "@/lib/departments";
import {
  createStudent,
  emptyFormValues,
  studentKeys,
  studentsQueryOptions,
  toCreatePayload,
} from "@/lib/students";

export const Route = createFileRoute("/students/new")({
  head: () => ({
    meta: [
      { title: "New student · Student Management System" },
      { name: "description", content: "Register a new student and assign their department." },
      { property: "og:title", content: "New student · Student Management System" },
      { property: "og:description", content: "Register a new student and assign their department." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewStudentPage,
});

function NewStudentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const departments = useQuery(departmentsQueryOptions);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader eyebrow="Students" title="New student" description="Create a record in your database." />
      {!isApiConfigured ? (
        <ApiNotConfigured />
      ) : departments.isError ? (
        <ErrorState error={departments.error} onRetry={() => void departments.refetch()} />
      ) : departments.isPending ? (
        <div className="surface-card h-80 p-6">
          <Skeleton className="h-full w-full bg-surface-hover" />
        </div>
      ) : (
        <StudentForm
          mode="create"
          defaultValues={emptyFormValues()}
          departments={departments.data}
          onCancel={() => void navigate({ to: "/students" })}
          onSubmit={async (values) => {
            const created = await createStudent(toCreatePayload(values));
            await queryClient.invalidateQueries({ queryKey: studentKeys.all });
            toast.success("Student created", { description: `${values.firstName} ${values.lastName}`.trim() });
            if (created?.studentId) {
              void navigate({ to: "/students/$studentId", params: { studentId: String(created.studentId) } });
            } else {
              void navigate({ to: "/students" });
            }
          }}
        />
      )}
    </div>
  );
}
