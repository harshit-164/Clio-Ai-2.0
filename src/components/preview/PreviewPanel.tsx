import { useState, useMemo, useCallback, useEffect } from "react";
import { Play, RotateCcw, Clock, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { wrapInHtmlDocument } from "@/lib/codeParser";
import { CodeEditor } from "./CodeEditor";
import { ConsolePanel } from "./ConsolePanel";
import { LivePreview } from "./LivePreview";
import { TestRunnerPanel } from "./TestRunnerPanel";
import { ConsoleEntry } from "@/types/chat";
import { useTestRunner } from "@/hooks/useTestRunner";

interface PreviewPanelProps {
  code: string;
  onCodeChange: (code: string) => void;
  consoleOutput: ConsoleEntry[];
  onConsoleClear: () => void;
  onConsoleAdd: (entry: Omit<ConsoleEntry, "id" | "timestamp">) => void;
}

export const PreviewPanel = ({
  code,
  onCodeChange,
  consoleOutput,
  onConsoleClear,
  onConsoleAdd,
}: PreviewPanelProps) => {
  const [activeTab, setActiveTab] = useState<string>("preview");
  const [runCount, setRunCount] = useState(0);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  const {
    currentRun,
    logs,
    isRunning: isTestRunning,
    runTests,
    stopTests,
    clearLogs,
  } = useTestRunner();

  // Wrap code in HTML document if needed
  const previewHtml = useMemo(() => {
    if (!code) return "";
    try {
      return wrapInHtmlDocument(code);
    } catch (e) {
      console.error("Failed to wrap code in HTML document:", e);
      return code; // Fallback to raw code
    }
  }, [code]);

  const handleRun = useCallback(() => {
    const startTime = performance.now();
    setRunCount((prev) => prev + 1);
    onConsoleClear();
    
    // Simulate execution time measurement
    requestAnimationFrame(() => {
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
    });
  }, [onConsoleClear]);

  const handleReset = useCallback(() => {
    onCodeChange("");
    onConsoleClear();
    setExecutionTime(null);
    clearLogs();
  }, [onCodeChange, onConsoleClear, clearLogs]);

  const handleRunTests = useCallback(() => {
    if (previewHtml) {
      runTests(previewHtml);
    }
  }, [previewHtml, runTests]);

  const handleRenderComplete = useCallback(() => {
    console.info("Preview render complete");
  }, []);

  const handleRenderError = useCallback((error: string) => {
    onConsoleAdd({ type: "error", message: `Render Error: ${error}` });
  }, [onConsoleAdd]);

  // Auto-run tests when code changes (debounced)
  useEffect(() => {
    if (!previewHtml || isTestRunning) return;
    
    const timer = setTimeout(() => {
      // Only auto-run if tests tab is active
      if (activeTab === "tests") {
        runTests(previewHtml);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [previewHtml, activeTab]); // Intentionally exclude runTests and isTestRunning to avoid loops

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="preview" className="text-xs">
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                Code
              </TabsTrigger>
              <TabsTrigger value="console" className="text-xs">
                Console
                {consoleOutput.length > 0 && (
                  <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    {consoleOutput.length > 9 ? "9+" : consoleOutput.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="tests" className="text-xs">
                <FlaskConical className="mr-1 h-3 w-3" />
                Tests
                {currentRun && (
                  <span className={`ml-1.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    currentRun.status === "completed" ? "bg-green-500" : 
                    currentRun.status === "failed" ? "bg-destructive" : "bg-primary"
                  } text-primary-foreground`}>
                    {currentRun.status === "completed" ? "✓" : 
                     currentRun.status === "failed" ? "!" : "…"}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {executionTime !== null && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{executionTime}ms</span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs"
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleRun}
                className="h-7 text-xs"
                disabled={!code}
              >
                <Play className="mr-1 h-3 w-3" />
                Run
              </Button>
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1">
            <TabsContent value="preview" className="mt-0 h-full">
              <LivePreview
                html={previewHtml}
                runCount={runCount}
                onConsoleAdd={onConsoleAdd}
                onRenderComplete={handleRenderComplete}
                onRenderError={handleRenderError}
              />
            </TabsContent>

            <TabsContent value="code" className="mt-0 h-full">
              <CodeEditor code={code} onChange={onCodeChange} />
            </TabsContent>

            <TabsContent value="console" className="mt-0 h-full">
              <ConsolePanel entries={consoleOutput} onClear={onConsoleClear} />
            </TabsContent>

            <TabsContent value="tests" className="mt-0 h-[calc(100vh-180px)]">
              <TestRunnerPanel
                currentRun={currentRun}
                logs={logs}
                isRunning={isTestRunning}
                onRun={handleRunTests}
                onStop={stopTests}
                onClear={clearLogs}
                hasCode={!!code}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
