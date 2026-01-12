import { useState, useMemo } from "react";
import { Play, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { wrapInHtmlDocument } from "@/lib/codeParser";
import { CodeEditor } from "./CodeEditor";
import { ConsolePanel } from "./ConsolePanel";
import { LivePreview } from "./LivePreview";
import { ConsoleEntry } from "@/types/chat";

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

  // Wrap code in HTML document if needed
  const previewHtml = useMemo(() => {
    if (!code) return "";
    return wrapInHtmlDocument(code);
  }, [code]);

  const handleRun = () => {
    const startTime = performance.now();
    setRunCount((prev) => prev + 1);
    onConsoleClear();
    
    // Simulate execution time measurement
    requestAnimationFrame(() => {
      const endTime = performance.now();
      setExecutionTime(Math.round(endTime - startTime));
    });
  };

  const handleReset = () => {
    onCodeChange("");
    onConsoleClear();
    setExecutionTime(null);
  };

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
                    {consoleOutput.length}
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
              />
            </TabsContent>

            <TabsContent value="code" className="mt-0 h-full">
              <CodeEditor code={code} onChange={onCodeChange} />
            </TabsContent>

            <TabsContent value="console" className="mt-0 h-full">
              <ConsolePanel entries={consoleOutput} onClear={onConsoleClear} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
