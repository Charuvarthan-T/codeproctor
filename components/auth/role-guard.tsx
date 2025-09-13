"use client";
import { useRoleAccess } from "@/hooks/use-role-access";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type UserRole = "admin" | "student" | "faculty" | "learner" | "manager";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallbackPath = "/dashboard",
  showUnauthorized = false,
}: RoleGuardProps) {
  const { role, isLoading } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      if (!showUnauthorized) {
        router.push(fallbackPath);
      }
    }
  }, [role, isLoading, allowedRoles, fallbackPath, router, showUnauthorized]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    if (showUnauthorized) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              Unauthorized Access
            </h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  return <>{children}</>;
}
