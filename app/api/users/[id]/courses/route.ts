import { requireAuth } from "@/lib/auth-helpers";
import { getMyCoursesForFaculty } from "@/repository/user.repository";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // get user id and role from server session
    const user = await requireAuth();
    
    // If requireAuth returns a NextResponse (error), return it
    if ('status' in user) {
        return user;
    }
    
    const { id: targetUserId } = params;
    
    // Authorization logic:
    // - Admins can view courses for any user
    // - Faculty can only view their own courses
    // - Students cannot access this endpoint
    if (user.role === "admin") {
        const courses = await getMyCoursesForFaculty(targetUserId);
        return new Response(JSON.stringify({ courses }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } else if (user.role === "faculty" && user.id === targetUserId) {
        const courses = await getMyCoursesForFaculty(user.id);
        return new Response(JSON.stringify({ courses }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } else {
        return new Response(JSON.stringify({ error: "Forbidden" }), { 
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }
}           