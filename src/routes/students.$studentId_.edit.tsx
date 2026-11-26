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
  fullName,
  studentKeys,
  studentQueryOptions,
  toFormValues,
  toUpdatePayload,
  updateStudent,
} from "@/lib/students";

export const Route = createFileRoute("/students/$studentId_/edit")({
  head: () => ({
    meta: [
      { title: "Edit student · Student Management System" },
      { name: "description", content: "Update a student's details and department." },
      { property: "og:title", content: "Edit student · Student Management System" },
      { property: "og:description", content: "Update a student's details and department." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditStudentPage,
});

function EditStudentPage() {
  const { studentId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useQuery(studentQueryOptions(Number(studentId)));
  const departments = useQuery(departmentsQueryOptions);
  const toProfile = () => void navigate({ to: "/students/$studentId", params: { studentId } });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Students"
        title={query.data ? `Edit ${fullName(query.data)}` : "Edit student"}
        description="Changes are saved to your database."
      />
      {!isApiConfigured ? (
        <ApiNotConfigured />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : departments.isError ? (
        <ErrorState error={departments.error} onRetry={() => void departments.refetch()} />
      ) : !query.data || departments.isPending ? (
        <div className="surface-card h-80 p-6">
          <Skeleton className="h-full w-full bg-surface-hover" />
        </div>
      ) : (
        <StudentForm
          key={query.data.studentId}
          mode="edit"
          defaultValues={toFormValues(query.data)}
          departments={departments.data}
          createdAt={query.data.createdAt}
          onCancel={toProfile}
          onSubmit={async (values) => {
            const original = query.data;
            if (!original) return;
            await updateStudent(original.studentId, toUpdatePayload(original, values));
            await queryClient.invalidateQueries({ queryKey: studentKeys.all });
            toast.success("Changes saved");
            toProfile();
          }}
        />
      )}
    </div>
  );
}
