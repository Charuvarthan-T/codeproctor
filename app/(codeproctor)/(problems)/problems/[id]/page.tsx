"use client";

import { problem } from "@/types/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import Editor from "@monaco-editor/react";
import { ChevronDown, Loader2 } from "lucide-react";
import { capitalizeFirstLetter } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";  
import { Badge } from "@/components/ui/badge";

export default function Page() {
  const { id } = useParams();
  const [problem, setProblem] = useState<problem>({} as problem);
  const [language, setLanguage] = useState<string>("javascript");
  const [switchState, setSwitchState] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [languageCode, setLanguageCode] = useState<number>(63);
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // test case logic written here
  interface TestCase {
    id: string;
    input: string;
    output: string;
  }

  interface TestResult {
    testCaseId: string;
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showTestCases, setShowTestCases] = useState(true);
  const [selectedTestCase, setSelectedTestCase] = useState(0);

  // end of test case logic

  // LeetCode-style test execution with detailed feedback
  async function handleClick() {
    setIsLoading(true);
    setIsRunningTests(true);

    const apiUrl = process.env.NEXT_PUBLIC_JUDGE0_API_URL;

    if (!apiUrl) {
      setOutput("❌ API configuration missing. Please check your environment variables.");
      setIsLoading(false);
      setIsRunningTests(false);
      return;
    }

    try {
      if (testCases.length === 0) {
        // Run without test cases (original behavior)
        const url = `${apiUrl}/submissions?base64_encoded=false&wait=true`;
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language_id: languageCode,
            source_code: getBoilerplateCode(language, code), // Auto-add boilerplate for execution
            stdin: "",
          }),
        };

        const response = await fetch(url, options);
        const result = await response.json();
        
        if (result.compile_output) {
          setOutput(`❌ Compilation Error:\n${result.compile_output}`);
        } else if (result.stderr) {
          setOutput(`❌ Runtime Error:\n${result.stderr}`);
        } else {
          setOutput(result.stdout || "No output");
        }
      } else {
        // LeetCode-style test case execution
        const results: TestResult[] = [];
        let allTestsPassed = true;
        let compilationError = false;
        let runtimeError = false;

        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          const url = `${apiUrl}/submissions?base64_encoded=false&wait=true`;
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              language_id: languageCode,
              source_code: getBoilerplateCode(language, code), // Auto-add boilerplate for test execution
              stdin: testCase.input,
            }),
          };

          const response = await fetch(url, options);
          const result = await response.json();

          // Handle compilation errors
          if (result.compile_output) {
            setOutput(`❌ Compilation Error:\n${result.compile_output}`);
            compilationError = true;
            break;
          }

          // Handle runtime errors
          if (result.stderr && !result.stdout) {
            setOutput(`❌ Runtime Error on Test Case ${i + 1}:\n${result.stderr}`);
            runtimeError = true;
            break;
          }

          const actualOutput = (result.stdout || result.stderr || "").trim();
          const expectedOutput = (testCase.output || "").trim();
          const passed = actualOutput === expectedOutput;

          if (!passed) allTestsPassed = false;

          results.push({
            testCaseId: testCase.id,
            input: testCase.input,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput,
            passed: passed
          });
        }

        // Only set results if no compilation/runtime errors
        if (!compilationError && !runtimeError) {
          setTestResults(results);
          const passedCount = results.filter(r => r.passed).length;
          
          if (allTestsPassed) {
            setOutput(`🎉 Accepted!\n\nAll test cases passed (${passedCount}/${results.length})\n\nRuntime: Judge0\nMemory: Judge0`);
          } else {
            const firstFailedIndex = results.findIndex(r => !r.passed);
            setOutput(`❌ Wrong Answer\n\nTest case ${firstFailedIndex + 1} failed\nPassed: ${passedCount}/${results.length}\n\nSee test cases below for details.`);
            // Auto-select the first failed test case
            setSelectedTestCase(firstFailedIndex);
          }
        }
      }
    } catch (error) {
      console.error("Error running code:", error);
      setOutput("❌ Network Error: Unable to run your code. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRunningTests(false);
    }
  }

  async function handleSwitchChange(checked: boolean) {
    setSwitchState(checked);

    const res = await fetch(`/api/problems/${id}/completed`, {
      method: "POST",
      body: JSON.stringify({ isCompleted: checked ? "solved" : "unsolved" }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.error("Failed to mark problem as completed");
    }
  }

  // Language mapping for Monaco Editor
  const getMonacoLanguage = (lang: string): string => {
    switch (lang) {
      case "cpp":
        return "cpp";
      case "c":
        return "c";
      case "python":
        return "python";
      case "java":
        return "java";
      case "javascript":
        return "javascript";
      default:
        return "javascript";
    }
  };

  // TEST CASE FETCHING FUNCTION:
  async function fetchTestCases() {
    try {
      const response = await fetch(`/api/problems/${id}/testcases`);
      if (response.ok) {
        const data = await response.json();
        setTestCases(data);
      } else {
        console.error("Failed to fetch test cases");
      }
    } catch (error) {
      console.error("Error fetching test cases:", error);
    }
  }

  // LeetCode-style problem templates for common patterns (clean user-facing code)
  const problemTemplates = {
    "two-sum": {
      javascript: `function twoSum(nums, target) {
    // Write your solution here
    return [];
}`,
      
      python: `def twoSum(nums, target):
    # Write your solution here
    return []`
    },
    
    "palindrome": {
      javascript: `function isPalindrome(s) {
    // Write your solution here
    return false;
}`,
      
      python: `def isPalindrome(s):
    # Write your solution here
    return False`
    },

    "add-numbers": {
      javascript: `function addNumbers(a, b) {
    // Write your solution here
    return a + b;
}`,
      
      python: `def addNumbers(a, b):
    # Write your solution here
    return a + b`
    }
  };

  // LeetCode-style clean user templates (what users see and edit)
  const getUserTemplate = (lang: string): string => {
    // If problem has custom function signatures, use them (highest priority)
    if (problem.function_signatures && problem.function_signatures[lang as keyof typeof problem.function_signatures]) {
      return problem.function_signatures[lang as keyof typeof problem.function_signatures] || getCleanTemplate(lang);
    }
    
    // If problem has a template type, use predefined template
    if (problem.template_type && problemTemplates[problem.template_type as keyof typeof problemTemplates]) {
      const template = problemTemplates[problem.template_type as keyof typeof problemTemplates];
      if (template && template[lang as keyof typeof template]) {
        return template[lang as keyof typeof template];
      }
    }
    
    // Fall back to clean template (what users see)
    return getCleanTemplate(lang);
  };

  // Clean templates that users see and edit (LeetCode-style)
  const getCleanTemplate = (lang: string): string => {
    switch (lang) {
      case "python":
        return `def solution(input_data):
    # Parse the input as needed
    # Write your solution here
    return "your_output"`;

      case "javascript":
        return `function solution(input) {
    // Parse the input as needed
    // Write your solution here
    return "your_output";
}`;

      case "java":
        return `public class Solution {
    public String solution(String input) {
        // Parse the input as needed
        // Write your solution here
        return "your_output";
    }
}`;

      case "cpp":
        return `#include <string>
using namespace std;

class Solution {
public:
    string solution(string input) {
        // Parse the input as needed
        // Write your solution here
        return "your_output";
    }
};`;

      case "c":
        return `#include <stdio.h>
#include <string.h>

char* solution(char* input) {
    // Parse the input as needed
    // Write your solution here
    static char result[1000];
    strcpy(result, "your_output");
    return result;
}`;

      default:
        return "// Write your solution here...";
    }
  };

  // Boilerplate code that gets added when running (hidden from users)
  const getBoilerplateCode = (lang: string, userCode: string): string => {
    // Handle specific problem template boilerplates
    if (problem.template_type) {
      switch (problem.template_type) {
        case "two-sum":
          if (lang === "javascript") {
            return `${userCode}

// Auto-generated boilerplate for two-sum
const input = require('fs').readFileSync(0, 'utf8').trim().split('\\n');
const nums = JSON.parse(input[0]);
const target = parseInt(input[1]);
const result = twoSum(nums, target);
console.log(JSON.stringify(result));`;
          }
          if (lang === "python") {
            return `${userCode}

# Auto-generated boilerplate for two-sum
import sys
import json
input_lines = sys.stdin.read().strip().split('\\n')
nums = json.loads(input_lines[0])
target = int(input_lines[1])
result = twoSum(nums, target)
print(json.dumps(result))`;
          }
          break;
          
        case "palindrome":
          if (lang === "javascript") {
            return `${userCode}

// Auto-generated boilerplate for palindrome
const input = require('fs').readFileSync(0, 'utf8').trim();
const result = isPalindrome(input);
console.log(result);`;
          }
          if (lang === "python") {
            return `${userCode}

# Auto-generated boilerplate for palindrome
import sys
s = sys.stdin.read().strip()
result = isPalindrome(s)
print(str(result).lower())`;
          }
          break;

        case "add-numbers":
          if (lang === "javascript") {
            return `${userCode}

// Auto-generated boilerplate for add-numbers
const input = require('fs').readFileSync(0, 'utf8').trim().split(' ');
const a = parseInt(input[0]);
const b = parseInt(input[1]);
const result = addNumbers(a, b);
console.log(result);`;
          }
          if (lang === "python") {
            return `${userCode}

# Auto-generated boilerplate for add-numbers
import sys
input_line = sys.stdin.read().strip().split()
a = int(input_line[0])
b = int(input_line[1])
result = addNumbers(a, b)
print(result)`;
          }
          break;
      }
    }

    // Generic boilerplate for other problems
    switch (lang) {
      case "python":
        return `${userCode}

# Auto-generated boilerplate
import sys
input_data = sys.stdin.read().strip()
result = solution(input_data)
print(result)`;

      case "javascript":
        return `${userCode}

// Auto-generated boilerplate
const input = require('fs').readFileSync(0, 'utf8').trim();
const result = solution(input);
console.log(result);`;

      case "java":
        return `import java.util.*;
import java.io.*;

${userCode}

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String input = br.readLine();
        
        Solution sol = new Solution();
        String result = sol.solution(input);
        System.out.println(result);
    }
}`;

      case "cpp":
        return `#include <iostream>
#include <string>
using namespace std;

${userCode}

int main() {
    string input;
    getline(cin, input);
    
    Solution sol;
    cout << sol.solution(input) << endl;
    return 0;
}`;

      case "c":
        return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

${userCode}

int main() {
    char input[1000];
    if (fgets(input, sizeof(input), stdin) != NULL) {
        input[strcspn(input, "\\n")] = 0;
        char* result = solution(input);
        printf("%s\\n", result);
    }
    return 0;
}`;

      default:
        return userCode;
    }
  };

  useEffect(() => {
    const fetchProblem = async () => {
      const res = await fetch(`/api/problems/${id}`);
      if (res.ok) {
        const data = await res.json();
        setProblem(data);
      }
    };
    async function fetchProblemStatus() {
      const res = await fetch(`/api/problems/${id}/completed`);
      if (res.ok) {
        const data = await res.json();
        setSwitchState(data.isCompleted === "solved");
      }
    }
    fetchProblemStatus();
    fetchProblem();
    fetchTestCases(); // added this part for test cases
  }, [id]);

  // Debug language changes
  useEffect(() => {
    console.log("Language changed to:", language);
    console.log(
      "Default code for",
      language,
      ":",
      getUserTemplate(language).substring(0, 50) + "..."
    );
  }, [language]);

  return (
    <div className="flex flex-col h-[85vh]">
      <div className="flex flex-1 gap-2 min-h-0">
        <div className="w-1/2 flex flex-col">
          <div className="rounded-lg border bg-card shadow-sm p-6 flex-1 overflow-auto">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  {capitalizeFirstLetter(problem.title) || "Loading..."}
                </h2>
                <div className="flex items-center gap-2">
                  {switchState ? (
                    <span>Unmark completed</span>
                  ) : (
                    <span>Mark completed</span>
                  )}
                  <Switch
                    checked={switchState}
                    onCheckedChange={handleSwitchChange}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Description
                </h3>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {problem.description || "Loading problem description..."}
                </div>
              </div>

              {problem.created_by && (
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Created By
                  </h3>
                  <p className="text-muted-foreground">{problem.created_by}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-1/2 flex flex-col">
          {/* Header with language selector and run button */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-30">
                    {language} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage("python"), setLanguageCode(71);
                    }}
                  >
                    python
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage("javascript"), setLanguageCode(63);
                    }}
                  >
                    javascript
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage("java"), setLanguageCode(62);
                    }}
                  >
                    java
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage("cpp"), setLanguageCode(54);
                    }}
                  >
                    cpp
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setLanguage("c"), setLanguageCode(50);
                    }}
                  >
                    C
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                variant="default" 
                onClick={handleClick}
                disabled={isLoading || isRunningTests}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    ▶ Run
                    {testCases.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800 text-xs">
                        {testCases.length}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="rounded-lg border overflow-hidden mb-2" style={{ height: '45vh' }}>
            <Editor
              height="100%"
              language={getMonacoLanguage(language)}
              theme="vs-dark"
              value={code || getUserTemplate(language)}
              options={{
                padding: { top: 20, bottom: 20 },
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: true,
                automaticLayout: true,
              }}
              onChange={(value) => setCode(value || "")}
            />
          </div>

          {/* Enhanced Console Output - LeetCode Style */}
          <div className="flex flex-col gap-2 flex-1">
            <Card className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Console</h3>
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {isRunningTests ? "Running tests..." : "Running..."}
                  </div>
                )}
              </div>
              
              <div className="bg-gray-900 dark:bg-gray-950 rounded-md p-3 font-mono text-xs min-h-[80px] border border-gray-200 dark:border-gray-800">
                {!isLoading && !output && (
                  <span className="text-gray-500">Click "Run" to see output</span>
                )}
                {output && (
                  <div className="text-gray-100">
                    {/* Enhanced output formatting based on result type */}
                    {output.includes('🎉 Accepted') && (
                      <div className="text-green-400">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    )}
                    {output.includes('❌ Wrong Answer') && (
                      <div className="text-red-400">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    )}
                    {output.includes('❌ Compilation Error') && (
                      <div className="text-yellow-400">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    )}
                    {output.includes('❌ Runtime Error') && (
                      <div className="text-orange-400">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    )}
                    {!output.includes('🎉') && !output.includes('❌') && (
                      <div className="text-gray-100">
                        <pre className="whitespace-pre-wrap">{output}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* Test Cases Section - LeetCode Style */}
            {testCases.length > 0 && (
              <Card className="p-3 flex-1 max-h-[25vh] overflow-hidden">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-foreground">Test Cases</h3>
                    <Badge variant="secondary" className="text-xs h-5">
                      {testResults.length > 0 
                        ? `${testResults.filter(r => r.passed).length}/${testResults.length} passed`
                        : `${testCases.length} cases`
                      }
                    </Badge>
                  </div>

                  {/* Test Case Tabs */}
                  <div className="flex gap-1 border-b mb-3">
                    {testCases.map((testCase, index) => {
                      const result = testResults.find(r => r.testCaseId === testCase.id);
                      return (
                        <button
                          key={testCase.id}
                          onClick={() => setSelectedTestCase(index)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                            selectedTestCase === index
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            Case {index + 1}
                            {result && (
                              <div className={`w-2 h-2 rounded-full ${
                                result.passed ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Test Case Content */}
                  <div className="flex-1 overflow-y-auto">
                    {testCases[selectedTestCase] && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Input */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Input
                            </label>
                            <div className="bg-muted/50 border rounded-md p-2 font-mono text-xs">
                              {testCases[selectedTestCase].input || "(empty)"}
                            </div>
                          </div>

                          {/* Expected Output */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Expected
                            </label>
                            <div className="bg-muted/50 border rounded-md p-2 font-mono text-xs">
                              {testCases[selectedTestCase].output || "(empty)"}
                            </div>
                          </div>
                        </div>

                        {/* Actual Output (only show if test was run and failed) */}
                        {(() => {
                          const result = testResults.find(r => r.testCaseId === testCases[selectedTestCase].id);
                          if (result && !result.passed) {
                            return (
                              <div>
                                <label className="text-xs font-medium text-red-600 dark:text-red-400 mb-1 block">
                                  Your Output
                                </label>
                                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md p-2 font-mono text-xs">
                                  {result.actualOutput || "(empty)"}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Enhanced Result Status with LeetCode-style feedback */}
                        {(() => {
                          const result = testResults.find(r => r.testCaseId === testCases[selectedTestCase].id);
                          if (result) {
                            return (
                              <div className={`p-3 rounded-md border ${
                                result.passed 
                                  ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                              }`}>
                                <div className="flex items-center gap-2 mb-2">
                                  {result.passed ? (
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                                        Test Case Passed
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                                        Test Case Failed
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {!result.passed && (
                                  <div className="text-xs text-muted-foreground">
                                    <div className="mb-1">
                                      <span className="font-medium">Expected:</span> "{result.expectedOutput}"
                                    </div>
                                    <div>
                                      <span className="font-medium">Your output:</span> "{result.actualOutput}"
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
