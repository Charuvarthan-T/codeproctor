"use client";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
  const {data: session} = useSession();
  const user = session?.user;

  return <h1 className="text-2xl font-bold">Welcome back {user?.name} !</h1>;
}
