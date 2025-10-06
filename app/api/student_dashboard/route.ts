import { requireAuth } from "@/lib/auth-helpers";
import sql from "@/lib/db";
import { getMyCoursesForStudent } from "@/repository/user.repository";

export async function GET() {
  try {
    const user = await requireAuth();

    // If user is not authenticated, requireAuth returns a NextResponse
    if ("json" in user) {
      return user;
    }

    // Get student courses
    const studentCourses = await getMyCoursesForStudent(user.id);

    // Get student's current section info
    const sectionInfo = await sql`
            SELECT DISTINCT s.id as section_id, s.name as section_name, 
                   sm.name as semester_name, sm.year, d.name as department_name
            FROM sections_users su
            JOIN sections s ON su.sectionid = s.id
            JOIN semesters sm ON s.semesterid = sm.id
            JOIN departments d ON s.departmentid = d.id
            WHERE su.userid = ${user.id}
            LIMIT 1
        `;

    // Get problems solved statistics
    const problemsStats = await sql`
            SELECT 
                COUNT(CASE WHEN pu.is_completed = 'solved' THEN 1 END) as solved_count,
                COUNT(*) as total_attempted
            FROM problems_users pu
            WHERE pu.userid = ${user.id}
        `;

    // Get total available problems in student's courses
    const availableProblems = await sql`
            SELECT COUNT(DISTINCT p.id) as total_available
            FROM sections_users su
            JOIN sections s ON su.sectionid = s.id
            JOIN semesters sm ON s.semesterid = sm.id
            JOIN semesters_courses sc ON sm.id = sc.sem_id
            JOIN problems_courses pc ON sc.course_id = pc.courseid
            JOIN problems p ON pc.problemid = p.id
            WHERE su.userid = ${user.id}
        `;

    // Get course progress for each enrolled course
    const courseProgress = await Promise.all(
      studentCourses.map(async (course: any) => {
        const progress = await sql`
                    SELECT 
                        COUNT(DISTINCT p.id) as total_problems,
                        COUNT(DISTINCT CASE WHEN pu.is_completed = 'solved' THEN p.id END) as solved_problems
                    FROM problems_courses pc
                    JOIN problems p ON pc.problemid = p.id
                    LEFT JOIN problems_users pu ON p.id = pu.problemid AND pu.userid = ${user.id}
                    WHERE pc.courseid = ${course.id}
                `;

        return {
          ...course,
          total_problems: progress[0]?.total_problems || 0,
          solved_problems: progress[0]?.solved_problems || 0,
        };
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          student_info: {
            section: sectionInfo[0] || null,
          },
          courses: courseProgress,
          statistics: {
            problems_solved: problemsStats[0]?.solved_count || 0,
            problems_attempted: problemsStats[0]?.total_attempted || 0,
            total_available: availableProblems[0]?.total_available || 0,
          },
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Student dashboard API error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Failed to fetch student dashboard data",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
