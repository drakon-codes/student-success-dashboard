import { cn } from "@/lib/utils";
import { initials, type Student } from "@/lib/students";

const TONES = [
  "bg-primary-soft text-primary",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
];

export function StudentAvatar({
  student,
  size = "md",
}: {
  student: Pick<Student, "studentId" | "firstName" | "lastName">;
  size?: "sm" | "md" | "lg";
}) {
  const tone = TONES[Math.abs(student.studentId) % TONES.length];
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-border",
        tone,
        size === "sm" && "size-8 text-xs",
        size === "md" && "size-9 text-xs",
        size === "lg" && "size-16 text-lg",
      )}
      aria-hidden
    >
      {initials(student)}
    </div>
  );
}
