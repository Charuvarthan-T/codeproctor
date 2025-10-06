"use client";
import { useSession } from "next-auth/react";

export default function StudentDashboard() {
  const {data: session} = useSession();
  const user = session?.user;

  return <h1 className="text-2xl font-bold">Welcome back {user?.name} !</h1>;
  // current section, semester, academic year
  // number of problems solved
  // enrolled courses
  // upcoming contests
  // recent activities
}
