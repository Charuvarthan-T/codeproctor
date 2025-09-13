"use client";
import { RoleGuard } from "@/components/auth/role-guard";

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin", "faculty"]} fallbackPath="/dashboard">
      {children}
    </RoleGuard>
  );
}
