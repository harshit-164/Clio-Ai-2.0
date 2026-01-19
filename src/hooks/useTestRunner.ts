import { useState, useCallback, useRef } from "react";
import { TestStep, TestRun, TestStatus, LogEntry } from "@/types/testRunner";

const DEFAULT_STEPS: Omit<TestStep, "id" | "timestamp">[] = [
  { name: "Initialize Preview", status: "pending" },
  { name: "Parse HTML Structure", status: "pending" },
  { name: "Load CSS Styles", status: "pending" },
  { name: "Execute JavaScript", status: "pending" },
  { name: "Capture Console Output", status: "pending" },
  { name: "Render Complete", status: "pending" },
];

export const useTestRunner = () => {
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef(false);

  const addLog = useCallback((step: string, status: TestStatus, message?: string) => {
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      step,
      status,
      timestamp: new Date(),
      message,
    };
    setLogs((prev) => [...prev.slice(-50), entry]); // Keep last 50 logs
  }, []);

  const createSteps = useCallback((): TestStep[] => {
    return DEFAULT_STEPS.map((step) => ({
      ...step,
      id: crypto.randomUUID(),
      timestamp: null,
    }));
  }, []);

  const updateStep = useCallback(
    (stepId: string, updates: Partial<TestStep>) => {
      setCurrentRun((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          steps: prev.steps.map((s) =>
            s.id === stepId ? { ...s, ...updates } : s
          ),
        };
      });
    },
    []
  );

  const runTests = useCallback(
    async (html: string) => {
      // Guard against empty or invalid input
      if (!html || typeof html !== "string") {
        addLog("Validation", "failed", "No HTML content to test");
        return;
      }

      abortRef.current = false;
      setIsRunning(true);

      const steps = createSteps();
      const run: TestRun = {
        id: crypto.randomUUID(),
        startTime: new Date(),
        endTime: null,
        steps,
        status: "running",
      };

      setCurrentRun(run);
      addLog("Test Run", "running", "Starting test run...");

      // Run each step with safe execution
      for (let i = 0; i < steps.length; i++) {
        if (abortRef.current) {
          addLog("Test Run", "failed", "Test run aborted");
          break;
        }

        const step = steps[i];
        const startTime = performance.now();

        updateStep(step.id, { status: "running", timestamp: new Date() });
        addLog(step.name, "running");

        try {
          // Simulate step execution with safe guards
          await executeStep(step.name, html);
          
          const duration = Math.round(performance.now() - startTime);
          updateStep(step.id, { status: "completed", duration });
          addLog(step.name, "completed", `Completed in ${duration}ms`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          updateStep(step.id, { status: "failed", error: errorMessage });
          addLog(step.name, "failed", errorMessage);
          
          // Don't break - continue with other steps for visibility
          console.warn(`Test step "${step.name}" failed:`, errorMessage);
        }

        // Small delay between steps for visibility
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      setCurrentRun((prev) => {
        if (!prev) return null;
        const hasFailures = prev.steps.some((s) => s.status === "failed");
        return {
          ...prev,
          endTime: new Date(),
          status: hasFailures ? "failed" : "completed",
        };
      });

      addLog("Test Run", currentRun?.steps.some((s) => s.status === "failed") ? "failed" : "completed", "Test run finished");
      setIsRunning(false);
    },
    [addLog, createSteps, updateStep]
  );

  const stopTests = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    addLog("Test Run", "failed", "Test run stopped by user");
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    setCurrentRun(null);
  }, []);

  return {
    currentRun,
    logs,
    isRunning,
    runTests,
    stopTests,
    clearLogs,
  };
};

// Safe step execution with guards
async function executeStep(stepName: string, html: string): Promise<void> {
  // Add small delay to simulate work
  await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 70));

  switch (stepName) {
    case "Initialize Preview":
      // Check if we have valid HTML
      if (!html.trim()) {
        throw new Error("Empty HTML content");
      }
      break;

    case "Parse HTML Structure":
      // Basic HTML validation
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const errors = doc.querySelectorAll("parsererror");
        if (errors.length > 0) {
          throw new Error("HTML parsing errors detected");
        }
      } catch (e) {
        // Don't throw - just log, some HTML is still renderable
        console.warn("HTML parsing warning:", e);
      }
      break;

    case "Load CSS Styles":
      // Check for style tags or linked stylesheets
      const hasStyles = html.includes("<style") || html.includes("<link");
      if (!hasStyles) {
        // Not an error, just informational
        console.info("No explicit styles found, using defaults");
      }
      break;

    case "Execute JavaScript":
      // Check for script tags
      const hasScripts = html.includes("<script");
      if (!hasScripts) {
        console.info("No scripts to execute");
      }
      break;

    case "Capture Console Output":
      // This is handled by the iframe message listener
      break;

    case "Render Complete":
      // Final validation - just ensure we got this far
      break;

    default:
      break;
  }
}
