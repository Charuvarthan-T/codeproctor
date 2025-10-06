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

/**
 * Award points to a user for a problem if not already awarded.
 * - If the user has already solved the problem (problems_users.is_completed = 'solved'), do nothing.
 * - Otherwise mark the problem as solved and increment users.points_earned by the provided points.
 */
export async function awardPointsForProblem(
  userId: string,
  problemId: string,
  points: number
) {
  try {
    // Sequentially perform the operations (Neon client doesn't expose a .begin transaction helper here)
    // Check if already marked as solved
    const existing = await sql`SELECT is_completed FROM problems_users WHERE userid = ${userId} AND problemid = ${problemId}`;
    if (existing[0]?.is_completed === 'solved') {
      // Already solved — return not awarded but include current total points if available
      try {
        const totals = await sql`SELECT points_earned FROM users WHERE id = ${userId}`;
        const totalPoints = totals[0]?.points_earned ?? null;
        return { awarded: false, totalPoints };
      } catch (e) {
        // If querying totals fails (migration not applied), still return not awarded
        return { awarded: false, totalPoints: null };
      }
    }

    // Upsert problems_users to mark as solved
    await sql`INSERT INTO problems_users (userid, problemid, is_completed) VALUES (${userId}, ${problemId}, 'solved') ON CONFLICT (userid, problemid) DO UPDATE SET is_completed = 'solved'`;

    // Increment user's points_earned (create column if missing)
    try {
      await sql`UPDATE users SET points_earned = COALESCE(points_earned, 0) + ${points} WHERE id = ${userId}`;
    } catch (updateErr: any) {
      const msg = (updateErr?.message || '').toLowerCase();
      if (msg.includes('points_earned') || msg.includes('does not exist')) {
        console.warn('points_earned column missing; attempting to add column and retry update');
        try {
          await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0`;
          // retry update
          await sql`UPDATE users SET points_earned = COALESCE(points_earned, 0) + ${points} WHERE id = ${userId}`;
        } catch (ddlErr: any) {
          console.error('Failed to create points_earned column or update it:', ddlErr?.message || ddlErr);
          // proceed without throwing to allow audit log attempt
        }
      } else {
        // unknown update error -> rethrow
        throw updateErr;
      }
    }

    // Insert audit log (create table if missing) and use JS-generated UUID to avoid requiring pg extensions
    try {
      // ensure table exists (without relying on gen_random_uuid())
      await sql`
        CREATE TABLE IF NOT EXISTS user_points_log (
          id UUID PRIMARY KEY,
          userid UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          problemid UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
          points INTEGER NOT NULL,
          awarded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )`;

      // generate uuid in JS
      const id = (globalThis as any)?.crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : require('crypto').randomUUID();
      await sql`INSERT INTO user_points_log (id, userid, problemid, points) VALUES (${id}, ${userId}, ${problemId}, ${points})`;
    } catch (e: any) {
      console.warn('user_points_log handling failed (table may not exist or permissions denied):', e?.message || e);
      // continue silently
    }

    const totals = await sql`SELECT points_earned FROM users WHERE id = ${userId}`;
    const totalPoints = totals[0]?.points_earned ?? null;

    return { awarded: true, totalPoints };
  } catch (error) {
    console.error('Error awarding points:', error);
    throw error;
  }
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

// Template interfaces
export interface ProblemTemplate {
  python?: string;
  java?: string;
  javascript?: string;
  c?: string;
  cpp?: string;
}

// Create or update problem template
export async function createOrUpdateProblemTemplate(
  problemId: string,
  templates: ProblemTemplate
) {
  try {
    const result = await sql`
      INSERT INTO problem_templates (problem_id, python, java, javascript, c, cpp)
      VALUES (${problemId}, ${templates.python || null}, ${templates.java || null}, 
              ${templates.javascript || null}, ${templates.c || null}, ${templates.cpp || null})
      ON CONFLICT (problem_id)
      DO UPDATE SET 
        python = EXCLUDED.python,
        java = EXCLUDED.java,
        javascript = EXCLUDED.javascript,
        c = EXCLUDED.c,
        cpp = EXCLUDED.cpp,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    return result[0];
  } catch (error) {
    console.error("Error creating/updating problem template:", error);
    throw error;
  }
}

// Get problem template by problem ID
export async function getProblemTemplate(problemId: string) {
  try {
    const result = await sql`
      SELECT python, java, javascript, c, cpp 
      FROM problem_templates 
      WHERE problem_id = ${problemId}
    `;
    return result[0] || null;
  } catch (error) {
    console.error("Error getting problem template:", error);
    throw error;
  }
}

// Get template for specific language
export async function getProblemTemplateByLanguage(
  problemId: string,
  language: string
) {
  try {
    const allowedLanguages = ['python', 'java', 'javascript', 'c', 'cpp'];
    if (!allowedLanguages.includes(language)) {
      throw new Error('Unsupported language');
    }

    const result = await sql`
      SELECT ${sql.unsafe(language)} as template_code 
      FROM problem_templates 
      WHERE problem_id = ${problemId}
    `;
    return result[0]?.template_code || '';
  } catch (error) {
    console.error("Error getting problem template by language:", error);
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

// Create problem with templates
export async function createProblemWithTemplates(
  problemData: createProblem,
  templates: ProblemTemplate
) {
  try {
    // Create the problem
    const problem = await createProblem(problemData);
    
    // Create templates if provided
    if (Object.keys(templates).length > 0) {
      await createOrUpdateProblemTemplate(problem.id, templates);
    }
    
    return problem;
  } catch (error) {
    console.error("Error creating problem with templates:", error);
    throw error;
  }
}

