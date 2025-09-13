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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import Link from "next/link";
import { useRoleAccess } from "@/hooks/use-role-access";

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  category?: string;
}

const sidebarItems: SidebarItem[] = [
  // Common items
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["admin", "faculty", "student", "learner"],
    category: "general",
  },
  {
    label: "Problems",
    href: "/problems",
    icon: Code,
    roles: ["admin", "faculty", "student", "learner"],
    category: "general",
  },

  // Faculty-specific items
  {
    label: "My Sections",
    href: "/sections",
    icon: Presentation,
    roles: ["admin", "faculty"],
    category: "faculty",
  },

  // Admin-only items
  {
    label: "Users",
    href: "/users",
    icon: Users,
    roles: ["admin"],
    category: "admin",
  },
  {
    label: "Courses",
    href: "/courses",
    icon: BookOpen,
    roles: ["admin"],
    category: "admin",
  },
  {
    label: "Semesters",
    href: "/semesters",
    icon: GraduationCap,
    roles: ["admin"],
    category: "admin",
  },
  {
    label: "Departments",
    href: "/departments",
    icon: Building,
    roles: ["admin"],
    category: "admin",
  },
  {
    label: "All Sections",
    href: "/sections",
    icon: Presentation,
    roles: ["admin"],
    category: "admin",
  },
  {
    label: "Editor",
    href: "/editor",
    icon: Code,
    roles: ["admin"],
    category: "admin",
  },
];

export default function AppSidebar() {
  const { role } = useRoleAccess();

  const filteredItems = sidebarItems.filter(
    (item) => role && item.roles.includes(role)
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || "general";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SidebarItem[]>);

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "admin":
        return "Administration";
      case "faculty":
        return "Faculty Tools";
      case "general":
      default:
        return null;
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {Object.entries(groupedItems).map(([category, items]) => (
          <SidebarGroup key={category}>
            {getCategoryLabel(category) && (
              <SidebarGroupLabel>
                {getCategoryLabel(category)}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
