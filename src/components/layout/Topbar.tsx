import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

function crumbsFor(path: string): string[] {
  if (path === "/") return ["Dashboard"];
  if (path === "/settings") return ["System", "API connection"];
  if (path === "/students") return ["Students"];
  if (path === "/students/new") return ["Students", "New student"];
  if (/^\/students\/[^/]+\/edit$/.test(path)) return ["Students", "Edit"];
  if (path.startsWith("/students/")) return ["Students", "Profile"];
  return [];
}

export function Topbar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const crumbs = crumbsFor(path);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    void navigate({ to: "/students", search: q ? { q } : {} });
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <header className="glass sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border px-4 sm:px-6">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:bg-surface-hover hover:text-foreground" />
      <div className="h-5 w-px bg-border" />
      <nav className="hidden min-w-0 items-center gap-1.5 text-sm md:flex" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c} className="flex items-center gap-1.5">
            {i > 0 ? <ChevronRight className="size-3.5 text-subtle-foreground" /> : null}
            <span className={i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"}>
              {c}
            </span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <form onSubmit={onSubmit} className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students…"
            aria-label="Search students"
            className="h-9 w-56 rounded-lg border border-border bg-surface pl-9 pr-12 text-sm text-foreground placeholder:text-subtle-foreground transition-all hover:border-border-strong focus:w-72 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground">
            ⌘K
          </kbd>
        </form>
        <Button asChild variant="premium" size="sm" className="h-9 px-3">
          <Link to="/students/new">
            <Plus /> <span className="hidden sm:inline">New student</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
