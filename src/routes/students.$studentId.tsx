import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Building2, CalendarDays, Clock, Hash, Mail, Pencil, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { ApiNotConfigured, EmptyState, ErrorState } from "@/components/common/States";
import { DepartmentBadge } from "@/components/students/DepartmentBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getHttpStatus, isApiConfigured } from "@/lib/api";
import {
  ageOn,
  departmentLabel,
  formatStudentId,
  fullName,
  parseDateOnly,
  parseDateTime,
  studentQueryOptions,
} from "@/lib/students";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile · Student Management System" },
      { name: "description", content: "Contact details, department and record history for a student." },
      { property: "og:title", content: "Student profile · Student Management System" },
      { property: "og:description", content: "Contact details, department and record history for a student." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentPage,
});

function StudentPage() {
  const { studentId } = Route.useParams();
  const id = Number(studentId);
  const query = useQuery(studentQueryOptions(id));

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link to="/students">
        <ArrowLeft /> All students
      </Link>
    </Button>
  );

  if (!isApiConfigured) return <div className="space-y-4">{back}<ApiNotConfigured /></div>;
  if (query.isError) {
    return (
      <div className="space-y-4">
        {back}
        {getHttpStatus(query.error) === 404 ? (
          <EmptyState title="Student not found" description={`No student with ID ${studentId}.`} />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </div>
    );
  }
  if (!query.data) {
    return (
      <div className="space-y-4">
        {back}
        <div className="surface-card flex items-center gap-4 p-6">
          <Skeleton className="size-16 rounded-full bg-surface-hover" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 bg-surface-hover" />
            <Skeleton className="h-4 w-64 bg-surface-hover" />
          </div>
        </div>
      </div>
    );
  }

  const s = query.data;
  const dob = parseDateOnly(s.dateOfBirth);
  const created = parseDateTime(s.createdAt);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {back}
      <section className="surface-card animate-fade-up relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-primary opacity-[0.08]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <StudentAvatar student={s} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{fullName(s)}</h1>
              <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {formatStudentId(s.studentId)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{s.email}</span>
              <DepartmentBadge student={s} />
            </div>
          </div>
          <Button asChild variant="premium">
            <Link to="/students/$studentId/edit" params={{ studentId }}>
              <Pencil /> Edit student
            </Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard title="Contact">
          <Row icon={<Mail />} label="Email">
            <a href={`mailto:${s.email}`} className="text-foreground hover:text-primary">{s.email}</a>
          </Row>
          <Row icon={<Phone />} label="Phone">{s.phone ?? <Muted>Not provided</Muted>}</Row>
        </InfoCard>
        <InfoCard title="Personal">
          <Row icon={<CalendarDays />} label="Date of birth">
            {dob ? (
              <>
                {format(dob, "d MMMM yyyy")}
                <span className="ml-2 text-xs text-subtle-foreground">{ageOn(dob, new Date())} years</span>
              </>
            ) : (
              <Muted>Not provided</Muted>
            )}
          </Row>
          <Row icon={<Hash />} label="Student ID">{s.studentId}</Row>
        </InfoCard>
        <InfoCard title="Enrollment">
          <Row icon={<Building2 />} label="Department">
            {departmentLabel(s)}
            <span className="ml-2 font-mono text-xs text-subtle-foreground">#{s.departmentId}</span>
          </Row>
        </InfoCard>
        <InfoCard title="Record">
          <Row icon={<Clock />} label="Created">
            {created ? format(created, "d MMM yyyy, HH:mm") : <Muted>Unknown</Muted>}
          </Row>
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="surface-card animate-fade-up p-5">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">{title}</h2>
      <dl className="divide-y divide-border">{children}</dl>
    </section>
  );
}

function Row({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3 text-sm">
      <span className="flex size-8 items-center justify-center rounded-lg bg-surface text-subtle-foreground [&_svg]:size-4">{icon}</span>
      <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate text-foreground">{children}</dd>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-subtle-foreground">{children}</span>;
}
