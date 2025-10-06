export type course = {
  id: string;
  name: string;
};
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    userRole: string;
  }
}

export type user = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type semester = {
  id: string;
  name: string;
  year: string | number;
  dept_id?: string;
  department_name?: string;
};

export type department = {
  id: string;
  name: string;
};

export type section = {
  id: string;
  name: string;
  userid: string;
  semesterid: string;
  departmentid: string;
  isactive: boolean;
};

export type problem = {
  id: string;
  title: string;
  description: string;
  created_by?: string;
  created_at?: string;
  course?: string; // Course ID for course-specific problems, null for general problems
  // Function signatures for different languages (LeetCode-style)
  function_signatures?: {
    javascript?: string;
    python?: string;
    java?: string;
    cpp?: string;
    c?: string;
  };
  // Template type for common problem patterns
  template_type?: string;
  // Submission status for the current user
  solved_status?: "solved" | "attempted" | "unsolved";
};

export type testCase = {
  id: string;
  input: string;
  output: string;
  created_at?: string;
};
