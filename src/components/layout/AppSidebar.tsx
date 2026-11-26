import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, GraduationCap, LayoutDashboard, PlugZap, UserPlus, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { API_BASE_URL, isApiConfigured } from "@/lib/api";
import { studentsQueryOptions } from "@/lib/students";
import { cn } from "@/lib/utils";

export const APP_NAME = "Student Management System";

type NavItem = {
  title: string;
  to: "/" | "/students" | "/students/new" | "/departments" | "/settings";
  icon: typeof Users;
  match: (path: string) => boolean;
};

const workspace: NavItem[] = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard, match: (p) => p === "/" },
  {
    title: "Students",
    to: "/students",
    icon: Users,
    match: (p) => p.startsWith("/students") && p !== "/students/new",
  },
  { title: "Add student", to: "/students/new", icon: UserPlus, match: (p) => p === "/students/new" },
  { title: "Departments", to: "/departments", icon: Building2, match: (p) => p.startsWith("/departments") },
];

const system: NavItem[] = [
  { title: "API connection", to: "/settings", icon: PlugZap, match: (p) => p === "/settings" },
];

function NavGroup({ label, items, path }: { label: string; items: NavItem[]; path: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => {
            const active = item.match(path);
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className="h-9 transition-colors data-[active=true]:shadow-[inset_0_0_0_1px_var(--sidebar-border)]"
                >
                  <Link to={item.to}>
                    <item.icon className={cn(active && "text-primary")} />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ApiStatus() {
  const { isSuccess, isError, isFetching } = useQuery(studentsQueryOptions);
  const state = !isApiConfigured
    ? { label: "Not configured", dot: "bg-warning", ring: "bg-warning/30" }
    : isError
      ? { label: "Unreachable", dot: "bg-destructive", ring: "bg-destructive/30" }
      : isSuccess
        ? { label: "Connected", dot: "bg-success", ring: "bg-success/30" }
        : { label: isFetching ? "Connecting…" : "Idle", dot: "bg-muted-foreground", ring: "bg-muted-foreground/30" };

  let host = "VITE_API_BASE_URL";
  if (isApiConfigured) {
    try {
      host = new URL(API_BASE_URL).host;
    } catch {
      host = API_BASE_URL;
    }
  }

  return (
    <Link
      to="/settings"
      className="group/status block rounded-lg border border-sidebar-border bg-background/40 p-3 transition-colors hover:border-border-strong group-data-[collapsible=icon]:hidden"
    >
      <div className="flex items-center gap-2 text-xs font-medium text-foreground">
        <span className="relative flex size-2">
          <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-60", state.ring)} />
          <span className={cn("relative inline-flex size-2 rounded-full", state.dot)} />
        </span>
        {state.label}
      </div>
      <div className="mt-1 truncate font-mono text-[11px] text-subtle-foreground">{host}</div>
    </Link>
  );
}

export function AppSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 pb-2 pt-4">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-primary">
            <GraduationCap className="size-4" />
          </div>
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <div className="text-[13px] font-semibold text-foreground">Student Management</div>
            <div className="text-[11px] text-subtle-foreground">System</div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-1 pt-2">
        <NavGroup label="Workspace" items={workspace} path={path} />
        <NavGroup label="System" items={system} path={path} />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <ApiStatus />
      </SidebarFooter>
    </Sidebar>
  );
}
