
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, GraduationCap, LayoutDashboard, UserPlus, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const APP_NAME = "Student Management System";

type NavItem = {
  title: string;
  to: "/" | "/students" | "/students/new" | "/departments";
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
  {
    title: "Add student",
    to: "/students/new",
    icon: UserPlus,
    match: (p) => p === "/students/new",
  },
  {
    title: "Departments",
    to: "/departments",
    icon: Building2,
    match: (p) => p.startsWith("/departments"),
  },
];

function NavGroup({
  label,
  items,
  path,
}: {
  label: string;
  items: NavItem[];
  path: string;
}) {
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
            <div className="text-[13px] font-semibold text-foreground">
              Student Management
            </div>
            <div className="text-[11px] text-subtle-foreground">System</div>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 pt-2">
        <NavGroup label="Workspace" items={workspace} path={path} />
      </SidebarContent>
    </Sidebar>
  );
}
