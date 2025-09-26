"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BookOpen, ArrowLeft, Plus, X, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface CourseAssignment {
  course_id: string;
  course_name: string;
  faculty_id: string;
  faculty_name: string;
  faculty_email: string;
}

interface Faculty {
  id: string;
  name: string;
  email: string;
}

interface ApiResponse {
  status: boolean;
  data: CourseAssignment[];
  error?: any;
}

interface FacultyResponse {
  status: boolean;
  data: Faculty[];
  error?: any;
}

export default function SectionCoursesPage() {
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableFaculty, setAvailableFaculty] = useState<Faculty[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourseName, setSelectedCourseName] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const params = useParams();
  const router = useRouter();
  const sectionId = params.id as string;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteFacultyId, setDeleteFacultyId] = useState<string>("");
  const [deleteCourseId, setDeleteCourseId] = useState<string>("");
  const [facultyName, setFacultyName] = useState<string>("");

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sections/${sectionId}/courses`);
        const data: ApiResponse = await response.json();

        if (data.status && data.data) {
          setAssignments(data.data);
        } else {
          setError(data.error || "Failed to fetch assignments");
        }
      } catch (err) {
        setError("An error occurred while fetching assignments");
        console.error("Error fetching assignments:", err);
      } finally {
        setLoading(false);
      }
    };

    if (sectionId) {
      fetchAssignments();
    }
  }, [sectionId]);

  const fetchAvailableFaculty = async (courseId: string) => {
    try {
      const response = await fetch(`/api/sections/${sectionId}/courses/${courseId}/faculty`);
      const data: FacultyResponse = await response.json();

      if (data.status && data.data) {
        setAvailableFaculty(data.data);
      } else {
        setError(data.error || "Failed to fetch available faculty");
        toast.error("Failed to fetch available faculty");
      }
    } catch (err) {
      setError("An error occurred while fetching available faculty");
      toast.error("An error occurred while fetching available faculty");
      console.error("Error fetching available faculty:", err);
    }
  };

  const handleAssignFaculty = (courseId: string, courseName: string) => {
    setSelectedCourseId(courseId);
    setSelectedCourseName(courseName);
    setSelectedFacultyId("");
    setIsAssignDialogOpen(true);
    fetchAvailableFaculty(courseId);
  };

  const handleConfirmAssign = async () => {
    if (!selectedFacultyId || !selectedCourseId) {
      toast.error("Please select a faculty member");
      return;
    }

    setAssignLoading(true);
    try {
      const response = await fetch(`/api/sections/${sectionId}/courses/${selectedCourseId}/faculty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facultyId: selectedFacultyId }),
      });

      const data = await response.json();

      if (data.status) {
        toast.success("Faculty assigned successfully");
        setIsAssignDialogOpen(false);
        // Refresh the assignments
        const refreshResponse = await fetch(`/api/sections/${sectionId}/courses`);
        const refreshData: ApiResponse = await refreshResponse.json();
        if (refreshData.status && refreshData.data) {
          setAssignments(refreshData.data);
        }
      } else {
        toast.error(data.error || "Failed to assign faculty");
      }
    } catch (err) {
      toast.error("An error occurred while assigning faculty");
      console.error("Error assigning faculty:", err);
    } finally {
      setAssignLoading(false);
    }
  };

  const confirmRemoveFaculty = async (courseId: string, facultyId: string) => {
    try {
      const response = await fetch(`/api/sections/${sectionId}/courses/${courseId}/faculty?facultyId=${facultyId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status) {
        toast.success("Faculty removed successfully");
        // Refresh the assignments
        const refreshResponse = await fetch(`/api/sections/${sectionId}/courses`);
        const refreshData: ApiResponse = await refreshResponse.json();
        if (refreshData.status && refreshData.data) {
          setAssignments(refreshData.data);
        }
      } else {
        toast.error(data.error || "Failed to remove faculty");
      }
    } catch (err) {
      toast.error("An error occurred while removing faculty");
      console.error("Error removing faculty:", err);
    }
  };

  const handleRemoveFaculty = async (courseId: string, facultyId: string, facultyName: string) => {
    setDeleteDialogOpen(true);
    setDeleteCourseId(courseId);
    setDeleteFacultyId(facultyId);
    setFacultyName(facultyName);
  };

  // Group assignments by course
  const courseGroups = assignments.reduce((groups, assignment) => {
    if (!groups[assignment.course_id]) {
      groups[assignment.course_id] = {
        course_name: assignment.course_name,
        faculty: [],
      };
    }
    groups[assignment.course_id].faculty.push({
      faculty_id: assignment.faculty_id,
      faculty_name: assignment.faculty_name,
      faculty_email: assignment.faculty_email,
    });
    return groups;
  }, {} as Record<string, { course_name: string; faculty: Array<{ faculty_id: string; faculty_name: string; faculty_email: string }> }>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Section Courses
          </h1>
          <p className="text-sm text-muted-foreground">
            Section A - 2021-Semester-4-Mechanical Engineering - Mechanical Engineering
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Assigned Courses</h2>
        <p className="text-sm text-muted-foreground">
          {Object.keys(courseGroups).length} courses from the semester curriculum
        </p>
      </div>

      {Object.keys(courseGroups).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">
                No faculty assignments
              </h3>
              <p className="text-muted-foreground mb-4">
                No faculty members are assigned to courses in this section yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(courseGroups).map(([courseId, courseData]) => (
            <Card key={courseId} className="border h-[280px] flex flex-col">
              <CardContent className="p-4 flex flex-col h-full">
                {/* Course Header - Fixed */}
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight truncate">
                        {courseData.course_name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        ID: {courseId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {courseData.faculty.length}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => handleAssignFaculty(courseId, courseData.course_name)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Assign Faculty
                    </Button>
                  </div>
                </div>

                {/* Faculty List - Scrollable */}
                <div className="flex-1 mb-0 min-h-0">
                  {courseData.faculty.length > 0 ? (
                    <div className="h-full">
                      <div className="text-xs text-muted-foreground font-medium mb-2 flex-shrink-0">
                        Faculty ({courseData.faculty.length}):
                      </div>
                      <div className="h-[calc(100%-20px)] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {courseData.faculty.map((faculty) => (
                          <div
                            key={faculty.faculty_id}
                            className="flex items-center justify-between bg-muted/30 p-2 rounded text-xs border"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {faculty.faculty_name}
                              </p>
                              <p className="text-muted-foreground truncate">
                                {faculty.faculty_email}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive ml-1 flex-shrink-0"
                              onClick={() => handleRemoveFaculty(courseId, faculty.faculty_id, faculty.faculty_name)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-muted/10 rounded border-dashed border">
                      <div className="text-center">
                        <Users className="h-6 w-6 mx-auto mb-1 text-muted-foreground/50" />
                        <p className="text-xs text-muted-foreground">No faculty assigned</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Confirm Removal"
        description={`Are you sure you want to remove ${facultyName} from this course?`}
        onConfirm={async () => {
          setDeleteDialogOpen(false);
          await confirmRemoveFaculty(deleteCourseId, deleteFacultyId);
        }}
      />

      {/* Assign Faculty Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Faculty to Course</DialogTitle>
            <DialogDescription>
              Select a faculty member to assign to <strong>{selectedCourseName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {availableFaculty.length > 0 ? (
              <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a faculty member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFaculty.map((faculty) => (
                    <SelectItem key={faculty.id} value={faculty.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{faculty.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No available faculty members</p>
                  <p className="text-xs">All faculty are already assigned to this course.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
              disabled={assignLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={assignLoading || !selectedFacultyId || availableFaculty.length === 0}
            >
              {assignLoading ? "Assigning..." : "Assign Faculty"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}