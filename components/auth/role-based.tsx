"use client";
import { useRoleAccess } from "@/hooks/use-role-access";

type UserRole = "admin" | "student" | "faculty" | "learner" | "manager";

interface RoleBasedProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleBased({
  children,
  allowedRoles,
  fallback = null,
}: RoleBasedProps) {
  const { hasAccess } = useRoleAccess();

  if (!hasAccess(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Specific role components for convenience
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleBased allowedRoles={["admin"]} fallback={fallback}>
      {children}
    </RoleBased>
  );
}

export function FacultyOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleBased allowedRoles={["admin", "faculty"]} fallback={fallback}>
      {children}
    </RoleBased>
  );
}

export function StudentOnly({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return (
    <RoleBased allowedRoles={["student", "learner"]} fallback={fallback}>
      {children}
    </RoleBased>
  );
}
