import { memo } from "react";
import { CheckCircle2, XCircle, Clock, Loader2, Play, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TestRun, LogEntry, TestStatus } from "@/types/testRunner";
import { cn } from "@/lib/utils";

interface TestRunnerPanelProps {
  currentRun: TestRun | null;
  logs: LogEntry[];
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onClear: () => void;
  hasCode: boolean;
}

const StatusIcon = memo(({ status }: { status: TestStatus }) => {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "running":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
});

StatusIcon.displayName = "StatusIcon";

const StatusBadge = memo(({ status }: { status: TestStatus }) => {
  const labels: Record<TestStatus, string> = {
    pending: "⏳ Pending",
    running: "⏳ Running",
    completed: "✔️ Completed",
    failed: "❌ Failed",
  };

  return (
    <span
      className={cn(
        "text-xs font-medium",
        status === "completed" && "text-green-500",
        status === "failed" && "text-destructive",
        status === "running" && "text-primary",
        status === "pending" && "text-muted-foreground"
      )}
    >
      {labels[status]}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";

export const TestRunnerPanel = memo(({
  currentRun,
  logs,
  isRunning,
  onRun,
  onStop,
  onClear,
  hasCode,
}: TestRunnerPanelProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h3 className="text-sm font-medium">Test Runner</h3>
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onStop}
              className="h-7 text-xs"
            >
              <Square className="mr-1 h-3 w-3" />
              Stop
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onRun}
              disabled={!hasCode}
              className="h-7 text-xs"
            >
              <Play className="mr-1 h-3 w-3" />
              Run Tests
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 text-xs"
            disabled={logs.length === 0}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Steps Status */}
      {currentRun && (
        <div className="border-b border-border px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Test Steps
            </span>
            <StatusBadge status={currentRun.status} />
          </div>
          <div className="space-y-1.5">
            {currentRun.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon status={step.status} />
                  <span
                    className={cn(
                      step.status === "failed" && "text-destructive"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {step.duration !== undefined && (
                  <span className="text-muted-foreground">
                    {step.duration}ms
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Logs */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            Live Logs ({logs.length})
          </span>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {logs.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No logs yet. Run tests to see execution logs.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-2 rounded px-2 py-1 text-xs",
                    log.status === "failed" && "bg-destructive/10",
                    log.status === "completed" && "bg-green-500/10"
                  )}
                >
                  <StatusIcon status={log.status} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{log.step}</span>
                    {log.message && (
                      <span className="ml-2 text-muted-foreground">
                        {log.message}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {formatTime(log.timestamp)}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});

TestRunnerPanel.displayName = "TestRunnerPanel";
