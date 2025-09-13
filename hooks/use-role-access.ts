"use client";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

type UserRole = "admin" | "student" | "faculty" | "learner" | "manager";

interface RolePermissions {
  canAccessAdmin: boolean;
  canAccessProblems: boolean;
  canAccessFacultyFeatures: boolean;
  canAccessDashboard: boolean;
  canManageUsers: boolean;
  canManageCourses: boolean;
  canManageSemesters: boolean;
  canManageDepartments: boolean;
  canManageSections: boolean;
  canViewAllSections: boolean;
}

export function useRoleAccess(): RolePermissions & {
  role: UserRole | null;
  isLoading: boolean;
  hasAccess: (requiredRoles: UserRole[]) => boolean;
} {
  const { data: session, status } = useSession();

  const permissions = useMemo(() => {
    const role = session?.user?.role as UserRole;

    switch (role) {
      case "admin":
        return {
          canAccessAdmin: true,
          canAccessProblems: true,
          canAccessFacultyFeatures: true,
          canAccessDashboard: true,
          canManageUsers: true,
          canManageCourses: true,
          canManageSemesters: true,
          canManageDepartments: true,
          canManageSections: true,
          canViewAllSections: true,
        };

      case "faculty":
        return {
          canAccessAdmin: false,
          canAccessProblems: true,
          canAccessFacultyFeatures: true,
          canAccessDashboard: true,
          canManageUsers: false,
          canManageCourses: false,
          canManageSemesters: false,
          canManageDepartments: false,
          canManageSections: true, // Faculty can manage their own sections
          canViewAllSections: false,
        };

      case "student":
      case "learner":
        return {
          canAccessAdmin: false,
          canAccessProblems: true,
          canAccessFacultyFeatures: false,
          canAccessDashboard: true,
          canManageUsers: false,
          canManageCourses: false,
          canManageSemesters: false,
          canManageDepartments: false,
          canManageSections: false,
          canViewAllSections: false,
        };

      default:
        return {
          canAccessAdmin: false,
          canAccessProblems: false,
          canAccessFacultyFeatures: false,
          canAccessDashboard: false,
          canManageUsers: false,
          canManageCourses: false,
          canManageSemesters: false,
          canManageDepartments: false,
          canManageSections: false,
          canViewAllSections: false,
        };
    }
  }, [session?.user?.role]);

  const hasAccess = useMemo(() => {
    return (requiredRoles: UserRole[]) => {
      const userRole = session?.user?.role as UserRole;
      return requiredRoles.includes(userRole);
    };
  }, [session?.user?.role]);

  return {
    ...permissions,
    role: session?.user?.role as UserRole | null,
    isLoading: status === "loading",
    hasAccess,
  };
}
