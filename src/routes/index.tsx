import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Cake,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ApiNotConfigured, EmptyState, ErrorState } from "@/components/common/States";
import { PageHeader } from "@/components/common/PageHeader";
import { DepartmentBadge, departmentDot } from "@/components/students/DepartmentBadge";
import { StudentAvatar } from "@/components/students/StudentAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiConfigured } from "@/lib/api";
import {
  computeStats,
  formatStudentId,
  fullName,
  parseDateTime,
  studentsQueryOptions,
} from "@/lib/students";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Student Management System" },
      { name: "description", content: "Live overview of students, departments and new registrations." },
      { property: "og:title", content: "Dashboard · Student Management System" },
      { property: "og:description", content: "Live overview of students, departments and new registrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const query = useQuery(studentsQueryOptions);
  const stats = useMemo(() => (query.data ? computeStats(query.data) : null), [query.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={format(new Date(), "EEEE, d MMMM yyyy")}
        title="Overview"
        description="A live snapshot of your student records from the API."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => void query.refetch()}
              disabled={!isApiConfigured || query.isFetching}
            >
              <RefreshCw className={cn(query.isFetching && "animate-spin")} /> Refresh
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
      ) : !stats ? (
        <DashboardSkeleton />
      ) : (
        <DashboardContent stats={stats} />
      )}
    </div>
  );
}

function DashboardContent({ stats }: { stats: ReturnType<typeof computeStats> }) {
  const delta = stats.newThisMonth - stats.newLastMonth;
  const maxDept = Math.max(1, ...stats.byDepartment.map((d) => d.count));

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users />} tone="primary" label="Total students" value={stats.total} hint="All records" />
        <StatCard
          icon={<UserPlus />}
          tone="info"
          label="New this month"
          value={stats.newThisMonth}
          hint={
            <span className={cn("inline-flex items-center gap-1", delta >= 0 ? "text-success" : "text-destructive")}>
              {delta >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {delta >= 0 ? "+" : ""}
              {delta} vs last month
            </span>
          }
        />
        <StatCard
          icon={<Building2 />}
          tone="success"
          label="Departments"
          value={stats.departments}
          hint="With enrolled students"
        />
        <StatCard
          icon={<Cake />}
          tone="warning"
          label="Average age"
          value={stats.averageAge ?? "—"}
          hint={stats.averageAge ? "From dates of birth" : "No dates of birth yet"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card animate-fade-up p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">New registrations</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Students added per month, last 6 months</p>
            </div>
            <span className="tabular rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted-foreground">
              {stats.monthly.reduce((a, m) => a + m.count, 0)} total
            </span>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthly} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="regFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--subtle-foreground)", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--subtle-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border-strong)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 10,
                    color: "var(--foreground)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "var(--muted-foreground)" }}
                  formatter={(v) => [v, "Students"]}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#regFill)"
                  activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="surface-card animate-fade-up p-5">
          <h2 className="text-sm font-semibold text-foreground">By department</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Share of all students</p>
          {stats.byDepartment.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {stats.byDepartment.slice(0, 6).map((d) => (
                <li key={d.departmentId}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={cn("size-2 shrink-0 rounded-full", departmentDot(d.departmentId))} />
                      <span className="truncate text-foreground">{d.name}</span>
                    </span>
                    <span className="tabular text-muted-foreground">
                      {d.count}
                      <span className="ml-1.5 text-xs text-subtle-foreground">
                        {Math.round((d.count / Math.max(1, stats.total)) * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", departmentDot(d.departmentId))}
                      style={{ width: `${(d.count / maxDept) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="surface-card animate-fade-up overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recently added</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest student records</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/students">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        {stats.recent.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No students yet"
              description="Add your first student to see them here."
              action={
                <Button asChild variant="premium">
                  <Link to="/students/new">
                    <UserPlus /> Add student
                  </Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {stats.recent.map((s) => {
              const created = parseDateTime(s.createdAt);
              return (
                <li key={s.studentId}>
                  <Link
                    to="/students/$studentId"
                    params={{ studentId: String(s.studentId) }}
                    className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover/50"
                  >
                    <StudentAvatar student={s} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{fullName(s)}</div>
                      <div className="truncate text-xs text-muted-foreground">{s.email}</div>
                    </div>
                    <DepartmentBadge student={s} className="hidden md:inline-flex" />
                    <span className="hidden w-16 font-mono text-xs text-subtle-foreground sm:block">
                      {formatStudentId(s.studentId)}
                    </span>
                    <span className="hidden w-28 text-right text-xs text-muted-foreground lg:block">
                      {created ? formatDistanceToNow(created, { addSuffix: true }) : "—"}
                    </span>
                    <ArrowUpRight className="size-4 text-subtle-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}

const TONES = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
} as const;

function StatCard({
  icon,
  tone,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  tone: keyof typeof TONES;
  label: string;
  value: ReactNode;
  hint: ReactNode;
}) {
  return (
    <div className="surface-card surface-interactive animate-fade-up p-5 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("flex size-8 items-center justify-center rounded-lg [&_svg]:size-4", TONES[tone])}>
          {icon}
        </span>
      </div>
      <div className="tabular mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1.5 text-xs text-subtle-foreground">{hint}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="surface-card space-y-3 p-5">
            <Skeleton className="h-4 w-24 bg-surface-hover" />
            <Skeleton className="h-8 w-16 bg-surface-hover" />
            <Skeleton className="h-3 w-32 bg-surface-hover" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card h-[340px] p-5 lg:col-span-2">
          <Skeleton className="h-full w-full bg-surface-hover" />
        </div>
        <div className="surface-card h-[340px] p-5">
          <Skeleton className="h-full w-full bg-surface-hover" />
        </div>
      </div>
    </>
  );
}
