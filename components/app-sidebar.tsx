"use client";

import {
  Users,
  Home,
  BookOpen,
  GraduationCap,
  Building,
  Presentation,
  Code,
} from "lucide-react";
import {
  SidebarContent,
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  role?: string[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    role: ["admin", "faculty", "student"],
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
    role: ["admin"],
  },
  {
    label: "Problems",
    href: "/problems",
    icon: BookOpen,
    role: ["admin", "faculty", "student"],
  },
  {
    label: "Semesters",
    href: "/semesters",
    icon: GraduationCap,
    role: ["admin"],
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building,
    role: ["admin"],
  },
  {
    label: "Sections",
    href: "/sections",
    icon: Presentation,
    role: ["admin"],
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
    role: ["admin"],
  },
  {
    label: "Editor",
    href: "/editor",
    icon: Code,
    role: ["admin", "faculty", "student"],
  },
];

export default function AppSidebar() {
  const { data: session } = useSession();
  if(!session?.user){
    return <h1>Please login first</h1>
  }
  const user = session?.user;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) =>
                !item.role || item.role.includes(user?.role || "") ? (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
