import { departmentLabel, type Student } from "@/lib/students";
import { cn } from "@/lib/utils";

const DOTS = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

export function departmentDot(departmentId: number): string {
  return DOTS[Math.abs(departmentId) % DOTS.length] ?? "bg-chart-1";
}

export function DepartmentBadge({
  student,
  className,
}: {
  student: Pick<Student, "department" | "departmentId">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-medium text-foreground",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", departmentDot(student.departmentId))} />
      <span className="truncate">{departmentLabel(student)}</span>
    </span>
  );
}
