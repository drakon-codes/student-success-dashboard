import { Link } from "@tanstack/react-router";
import { AlertTriangle, PlugZap, RefreshCw, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api";

function Shell({
  icon,
  tone,
  title,
  children,
  actions,
}: {
  icon: ReactNode;
  tone: "primary" | "destructive" | "muted";
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary-soft text-primary"
      : tone === "destructive"
        ? "bg-destructive-soft text-destructive"
        : "bg-surface-hover text-muted-foreground";
  return (
    <div className="surface-card flex animate-fade-up flex-col items-center px-6 py-14 text-center">
      <div className={`mb-4 flex size-11 items-center justify-center rounded-xl ${toneClass}`}>{icon}</div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children ? <div className="mt-1.5 max-w-md text-sm text-muted-foreground">{children}</div> : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function ApiNotConfigured() {
  return (
    <Shell
      icon={<PlugZap className="size-5" />}
      tone="primary"
      title="Connect your API"
      actions={
        <Button asChild variant="premium">
          <Link to="/settings">Open connection guide</Link>
        </Button>
      }
    >
      Set <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">VITE_API_BASE_URL</code>{" "}
      to your ASP.NET Core API address (replace <span className="font-mono text-xs">YOUR_PORT</span>) to load students.
    </Shell>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Shell
      icon={<AlertTriangle className="size-5" />}
      tone="destructive"
      title="Couldn't load data"
      actions={
        <>
          {onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw /> Try again
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link to="/settings">Connection help</Link>
          </Button>
        </>
      }
    >
      {getApiErrorMessage(error)}
    </Shell>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Shell icon={<SearchX className="size-5" />} tone="muted" title={title} actions={action}>
      {description}
    </Shell>
  );
}
