"use client";
import { ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { useRoleAccess } from "@/hooks/use-role-access";

interface LayoutProps {
  children: ReactNode;
}

export default function CodeProctorLayout({ children }: LayoutProps) {
  const { role, isLoading } = useRoleAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!role || !["admin", "faculty", "student", "learner"].includes(role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Unauthorized Access
          </h1>
          <p className="text-muted-foreground">
            You don't have permission to access this application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppHeader />
        <main className="flex flex-1 flex-col p-2">{children}</main>
      </div>
    </SidebarProvider>
  );
}
