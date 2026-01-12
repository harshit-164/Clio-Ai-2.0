import { Trash2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConsoleEntry } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ConsolePanelProps {
  entries: ConsoleEntry[];
  onClear: () => void;
}

export const ConsolePanel = ({ entries, onClear }: ConsolePanelProps) => {
  const getIcon = (type: ConsoleEntry["type"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      case "warn":
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      case "info":
        return <Info className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStyles = (type: ConsoleEntry["type"]) => {
    switch (type) {
      case "error":
        return "bg-destructive/10 border-destructive/20 text-destructive";
      case "warn":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      case "info":
        return "bg-blue-500/10 border-blue-500/20 text-blue-500";
      default:
        return "bg-muted/30 border-border text-foreground";
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)] flex-col border-t border-border">
      {/* Console header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">
          Console Output
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClear}
          title="Clear console"
          disabled={entries.length === 0}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Console entries */}
      <ScrollArea className="flex-1 bg-card">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <p className="font-mono text-xs text-muted-foreground">
              Console output will appear here when you run code
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start gap-2 rounded border px-3 py-2 font-mono text-xs",
                  getStyles(entry.type)
                )}
              >
                {getIcon(entry.type)}
                <div className="flex-1">
                  <pre className="whitespace-pre-wrap break-all">
                    {entry.message}
                  </pre>
                  <span className="mt-1 block text-[10px] opacity-60">
                    {entry.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
