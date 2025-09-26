"use client";

import { course } from "@/types/types";
import { ArrowUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { AssignProblemsDialog } from "@/components/assign-problems-dialog";
import { useState } from "react";

// Create a separate component for the action cell to manage dialog state
const ActionCell = ({ course }: { course: course }) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="h-8"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Problems
      </Button>
      <AssignProblemsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={course.id}
        courseName={course.name}
      />
    </>
  );
};

export const myCourseColumns: ColumnDef<course>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Course ID
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Course Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "section_name",
    header: "Section",
  },
  {
    accessorKey: "semester_name",
    header: "Semester",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const course = row.original;
      return <ActionCell course={course} />;
    },
  },
];