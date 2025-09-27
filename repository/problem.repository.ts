import sql from "@/lib/db";

export interface testCase {
  input: string;
  output: string;
}

export interface createProblem {
  problemid: string;
  title: string;
  description: string;
  created_by: string;
  course?: string; // Optional course ID for course-specific problems
}

export async function getAllProblems() {
  try {
    // Only return general problems (course is NULL)
    const problems = await sql`SELECT * FROM problems WHERE course IS NULL`;
    return problems;
  } catch (error) {
    console.error("Error getting all problems:", error);
    throw error;
  }
}

export async function getProblemsWithPagination(
  page: number,
  pageSize: number,
  search: string,
  sortBy: string,
  sortOrder: string,
  userId: string
) {
  try {    
    const offset = (page - 1) * pageSize;

    const allowedSortColumns = ["id", "title", "description", "created_at"];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : "id";
    const safeSortOrder = sortOrder === "desc" ? "DESC" : "ASC";

    let problems, totalResult;

    if (search) {
      const searchPattern = `%${search}%`;

      problems = await sql`
        SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, up.is_completed
        FROM problems p INNER JOIN users u ON p.created_by = u.id
        LEFT JOIN problems_users up ON p.id = up.problemid AND up.userid = ${userId}
        WHERE p.course IS NULL AND (p.title ILIKE ${searchPattern} OR p.description ILIKE ${searchPattern} OR p.id::text ILIKE ${searchPattern} OR up.is_completed::text ILIKE ${searchPattern})
        ORDER BY ${sql.unsafe(safeSortBy)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      totalResult = await sql`
        SELECT COUNT(*) as count FROM problems p
        WHERE p.course IS NULL AND (p.title ILIKE ${searchPattern} OR p.description ILIKE ${searchPattern} OR p.id::text ILIKE ${searchPattern})
      `;
    } else {
      problems = await sql`
        SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, up.is_completed
        FROM problems p INNER JOIN users u ON p.created_by = u.id
        LEFT JOIN problems_users up ON p.id = up.problemid AND up.userid = ${userId}
        WHERE p.course IS NULL
        ORDER BY ${sql.unsafe(safeSortBy)} ${sql.unsafe(safeSortOrder)}
        LIMIT ${pageSize} OFFSET ${offset}
      `;

      totalResult = await sql`
        SELECT COUNT(*) as count FROM problems WHERE course IS NULL
      `;
    }

    const total = parseInt(totalResult[0].count);

    return {
      data: problems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error getting paginated problems:", error);
    throw error;
  }
}

export async function createProblem(newProblem: createProblem) {
  try {
    const result = await sql`
      INSERT INTO problems (id, title, description, created_by, course) 
      VALUES (${newProblem.problemid}, ${newProblem.title}, ${newProblem.description}, ${newProblem.created_by}, ${newProblem.course || null}) 
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error creating problem:", error);
    throw error;
  }
}

export async function getProblemById(id: string) {
  try {
    const problem = await sql`SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by
      FROM problems p INNER JOIN users u ON p.created_by = u.id
      WHERE p.id = ${id}`;
      
    return problem[0] || null;
  } catch (error) {
    console.error("Error getting problem by id:", error);
    throw error;
  }
}

export async function deleteProblem(id: string) {
  try {
    const result = await sql`DELETE FROM problems WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  } catch (error) {
    console.error("Error deleting problem:", error);
    throw error;
  }
}

interface updateProblemDTO {
  title?: string;
  description?: string;
}

export async function editProblem(
  id: string,
  updatedProblem: updateProblemDTO
) {
  try {
    const result =
      await sql`UPDATE problems SET title = ${updatedProblem.title}, description = ${updatedProblem.description} WHERE id = ${id} RETURNING *`;
    return result[0] || null;
  } catch (error) {
    console.error("Error editing problem:", error);
    throw error;
  }
}

export async function MarkProblemCompletedUser(
  userId: string,
  problemId: string,
  isCompleted: string,
) {
  await sql`INSERT INTO problems_users (userid, problemid, is_completed) 
  VALUES (${userId}, ${problemId}, ${isCompleted})
  ON CONFLICT (userid, problemid)
  DO UPDATE SET is_completed = ${isCompleted}`;
}

export async function CheckProblemCompletedUser(
  userId: string,
  problemId: string
) {
  const result = await sql`SELECT is_completed FROM problems_users WHERE userid = ${userId} AND problemid = ${problemId}`;
  return result[0]?.is_completed || "unsolved";
}

// Get course-specific problems
export async function getCourseSpecificProblems(courseId: string) {
  try {
    const problems = await sql`
      SELECT p.id, p.title, p.description, p.created_at, u.name AS created_by, p.course
      FROM problems p 
      INNER JOIN users u ON p.created_by = u.id
      WHERE p.course = ${courseId}
      ORDER BY p.created_at DESC
    `;
    return problems;
  } catch (error) {
    console.error("Error getting course-specific problems:", error);
    throw error;
  }
}

// Create problem with test cases
export async function createProblemWithTestCases(
  problemData: createProblem,
  testCases: { input: string; output: string }[]
) {
  try {
    // Create the problem
    const problem = await createProblem(problemData);
    
    // Create and link test cases
    for (const testCase of testCases) {
      const testCaseResult = await sql`
        INSERT INTO testcases (input, output) 
        VALUES (${testCase.input}, ${testCase.output}) 
        RETURNING id
      `;
      
      const testCaseId = testCaseResult[0].id;
      
      // Link test case to problem
      await sql`
        INSERT INTO problems_testcases (problem_id, testcase_id) 
        VALUES (${problem.id}, ${testCaseId})
      `;
    }
    
    return problem;
  } catch (error) {
    console.error("Error creating problem with test cases:", error);
    throw error;
  }
}

