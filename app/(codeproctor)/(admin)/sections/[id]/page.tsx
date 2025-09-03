"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { user } from "@/types/types";
import { DataTable } from "@/components/data-table";
import { createColumns } from "./columns";

const fetchAssignedUsers = async (sectionId: string) => {
  const res = await fetch(`/api/sections/${sectionId}/users`);
  return res.json();
};

const fetchUnassignedUsers = async (sectionId: string) => {
  const res = await fetch(`/api/sections/${sectionId}/users?unassigned=true`);
  return res.json();
};

const assignUserToSection = async (sectionId: string, userId: string) => {
  await fetch(`/api/sections/${sectionId}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
};

export default function SectionUsersPage() {
  const params = useParams();
  const sectionId = params?.id as string;
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [unassignedUsers, setUnassignedUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sectionId) return;
    setLoading(true);
    Promise.all([
      fetchAssignedUsers(sectionId),
      fetchUnassignedUsers(sectionId),
    ]).then(([assigned, unassigned]) => {
      setAssignedUsers(assigned.data);
      setUnassignedUsers(unassigned.data);
      setLoading(false);
    });
  }, [sectionId]);

  const handleAssign = async (userId: string) => {
    if (!sectionId) return;
    setLoading(true);
    await assignUserToSection(sectionId, userId);
    // Refresh lists
    const [assigned, unassigned] = await Promise.all([
      fetchAssignedUsers(sectionId),
      fetchUnassignedUsers(sectionId),
    ]);
    setAssignedUsers(assigned.data);
    setUnassignedUsers(unassigned.data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {/* Assigned Users Table */}
        <div>
          <h2 className="text-xl font-bold">Users Assigned to Section</h2>
          <DataTable
            columns={createColumns(() => Promise.resolve())}
            data={assignedUsers}
            searchColumn="name"
          />
        </div>

        {/* Unassigned Users Table */}
        <div>
          <h2 className="text-xl font-bold">
            Users Not Assigned to Section
          </h2>
          <DataTable
            columns={createColumns(() => Promise.resolve())}
            data={unassignedUsers}
            searchColumn="name"
          />
        </div>
      </div>
    </div>
  );
}
