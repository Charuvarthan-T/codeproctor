"use client";
import { ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { useSession } from "next-auth/react";

interface LayoutProps {
  children: ReactNode;
}

export default function CodeProctorLayout({ children }: LayoutProps) {
  const { data: session } = useSession();

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
