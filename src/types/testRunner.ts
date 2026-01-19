// Test Runner Types

export type TestStatus = "pending" | "running" | "completed" | "failed";

export interface TestStep {
  id: string;
  name: string;
  status: TestStatus;
  timestamp: Date | null;
  duration?: number;
  error?: string;
}

export interface TestRun {
  id: string;
  startTime: Date;
  endTime: Date | null;
  steps: TestStep[];
  status: TestStatus;
}

export interface LogEntry {
  id: string;
  step: string;
  status: TestStatus;
  timestamp: Date;
  message?: string;
}
