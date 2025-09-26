"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Minus, Users, BookOpen } from "lucide-react";

interface Problem {
  id: string;
  title: string;
  description: string;
  created_at: string;
  total_marks: number;
  created_by: string;
}

interface AssignProblemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseName: string;
}

export function AssignProblemsDialog({
  open,
  onOpenChange,
  courseId,
  courseName,
}: AssignProblemsDialogProps) {
  const [assignedProblems, setAssignedProblems] = useState<Problem[]>([]);
  const [unassignedProblems, setUnassignedProblems] = useState<Problem[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<"unassigned" | "assigned">("unassigned");

  const fetchProblems = async () => {
    setLoading(true);
    try {
      // Fetch assigned problems
      const assignedResponse = await fetch(`/api/courses/problems?courseId=${courseId}`);
      const assignedData = await assignedResponse.json();
      
      // Fetch unassigned problems
      const unassignedResponse = await fetch(`/api/courses/problems?courseId=${courseId}&action=unassigned`);
      const unassignedData = await unassignedResponse.json();
      
      if (assignedData.success) {
        setAssignedProblems(assignedData.data || []);
      }
      
      if (unassignedData.success) {
        setUnassignedProblems(unassignedData.data || []);
      }
    } catch (error) {
      console.error("Error fetching problems:", error);
      toast.error("Failed to load problems");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && courseId) {
      fetchProblems();
      setSelectedProblems([]);
    }
  }, [open, courseId]);

  const handleProblemSelection = (problemId: string, checked: boolean) => {
    if (checked) {
      setSelectedProblems(prev => [...prev, problemId]);
    } else {
      setSelectedProblems(prev => prev.filter(id => id !== problemId));
    }
  };

  const handleAssignProblems = async () => {
    if (selectedProblems.length === 0) {
      toast.error("Please select at least one problem to assign");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/courses/problems", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          problemIds: selectedProblems,
          action: "assign-multiple",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSelectedProblems([]);
        await fetchProblems(); // Refresh the lists
        setActiveView("assigned"); // Switch to assigned view to see results
      } else {
        toast.error(result.message || "Failed to assign problems");
      }
    } catch (error) {
      console.error("Error assigning problems:", error);
      toast.error("Failed to assign problems");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignProblem = async (problemId: string) => {
    try {
      const response = await fetch("/api/courses/problems", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          problemId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Problem unassigned successfully");
        await fetchProblems(); // Refresh the lists
      } else {
        toast.error(result.message || "Failed to unassign problem");
      }
    } catch (error) {
      console.error("Error unassigning problem:", error);
      toast.error("Failed to unassign problem");
    }
  };

  const ProblemCard = ({ 
    problem, 
    isAssigned, 
    showCheckbox 
  }: { 
    problem: Problem; 
    isAssigned: boolean; 
    showCheckbox: boolean; 
  }) => (
    <div className="flex items-start space-x-3 p-4 border rounded-lg bg-card">
      {showCheckbox && (
        <Checkbox
          checked={selectedProblems.includes(problem.id)}
          onCheckedChange={(checked) => handleProblemSelection(problem.id, checked as boolean)}
          className="mt-1"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold truncate">{problem.title}</h4>
          <div className="flex items-center space-x-2 ml-2">
            {problem.total_marks && (
              <Badge variant="secondary" className="text-xs">
                {problem.total_marks} marks
              </Badge>
            )}
            {isAssigned && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleUnassignProblem(problem.id)}
                className="h-6 w-6 p-0"
                title="Unassign problem"
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {problem.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>By: {problem.created_by}</span>
          <span>{new Date(problem.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Manage Problems for {courseName}</DialogTitle>
          <DialogDescription>
            Assign or unassign problems to/from this course
          </DialogDescription>
        </DialogHeader>

        {/* Custom Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-muted rounded-lg mb-4">
          <button
            onClick={() => setActiveView("unassigned")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "unassigned"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Available Problems ({unassignedProblems.length})</span>
          </button>
          <button
            onClick={() => setActiveView("assigned")}
            className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === "assigned"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Assigned Problems ({assignedProblems.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading problems...</span>
            </div>
          ) : (
            <div className="h-96 overflow-y-auto">
              <div className="space-y-3 pr-2">
                {activeView === "unassigned" ? (
                  unassignedProblems.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No problems available to assign
                      </p>
                    </div>
                  ) : (
                    unassignedProblems.map((problem) => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        isAssigned={false}
                        showCheckbox={true}
                      />
                    ))
                  )
                ) : (
                  assignedProblems.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        No problems assigned to this course yet
                      </p>
                    </div>
                  ) : (
                    assignedProblems.map((problem) => (
                      <ProblemCard
                        key={problem.id}
                        problem={problem}
                        isAssigned={true}
                        showCheckbox={false}
                      />
                    ))
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {activeView === "unassigned" && selectedProblems.length > 0 && (
              <span>{selectedProblems.length} problem(s) selected</span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {activeView === "unassigned" && (
              <Button
                onClick={handleAssignProblems}
                disabled={selectedProblems.length === 0 || submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign Selected ({selectedProblems.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}