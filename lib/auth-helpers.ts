import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";

type UserRole = "admin" | "student" | "faculty" | "learner" | "manager";

export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function requireAuth() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  return user;
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ session: any; user: any } | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized - Please log in" },
      { status: 401 }
    );
  }

  const userRole = session.user.role as UserRole;

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      {
        error: "Forbidden - You don't have permission to access this resource",
        requiredRoles: allowedRoles,
        userRole: userRole,
      },
      { status: 403 }
    );
  }

  return { session, user: session.user };
}

export async function requireAdmin() {
  return await requireRole(["admin"]);
}

export async function requireFaculty() {
  return await requireRole(["admin", "faculty"]);
}

export async function requireAuthenticated() {
  return await requireRole(["admin", "faculty", "student", "learner"]);
}
