import { useEffect, useRef, useState, useCallback, memo } from "react";
import { AlertTriangle, Monitor, Eye } from "lucide-react";
import { ConsoleEntry } from "@/types/chat";
interface LivePreviewProps {
  html: string;
  runCount: number;
  onConsoleAdd: (entry: Omit<ConsoleEntry, "id" | "timestamp">) => void;
  onRenderComplete?: () => void;
  onRenderError?: (error: string) => void;
}
export const LivePreview = memo(({
  html,
  runCount,
  onConsoleAdd,
  onRenderComplete,
  onRenderError
}: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Safe render function with error boundaries
  const renderPreview = useCallback(() => {
    if (!iframeRef.current || !html) {
      setIsLoading(false);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      // Inject console capture script with error handling
      const consoleScript = `
        <script>
          (function() {
            try {
              const originalConsole = {
                log: console.log,
                error: console.error,
                warn: console.warn,
                info: console.info
              };

              function sendToParent(type, args) {
                try {
                  window.parent.postMessage({
                    type: 'console',
                    consoleType: type,
                    message: Array.from(args).map(arg => {
                      try {
                        return typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg);
                      } catch (e) {
                        return '[Circular or unserializable object]';
                      }
                    }).join(' ')
                  }, '*');
                } catch (e) {
                  // Silently fail - don't break preview
                }
              }

              console.log = function(...args) {
                originalConsole.log.apply(console, args);
                sendToParent('log', args);
              };
              console.error = function(...args) {
                originalConsole.error.apply(console, args);
                sendToParent('error', args);
              };
              console.warn = function(...args) {
                originalConsole.warn.apply(console, args);
                sendToParent('warn', args);
              };
              console.info = function(...args) {
                originalConsole.info.apply(console, args);
                sendToParent('info', args);
              };

              window.onerror = function(msg, url, line, col, error) {
                sendToParent('error', ['Runtime Error: ' + msg + ' (Line ' + line + ')']);
                return true; // Prevent default error handling
              };

              window.onunhandledrejection = function(event) {
                sendToParent('error', ['Unhandled Promise Rejection: ' + (event.reason?.message || event.reason || 'Unknown')]);
              };

              // Signal render complete
              window.addEventListener('load', function() {
                window.parent.postMessage({ type: 'renderComplete' }, '*');
              });
            } catch (e) {
              // Fail silently to not break preview
            }
          })();
        </script>
      `;

      // Insert console script before </head> or at the beginning
      let modifiedHtml = html;
      if (html.includes("</head>")) {
        modifiedHtml = html.replace("</head>", consoleScript + "</head>");
      } else if (html.includes("<body")) {
        modifiedHtml = html.replace("<body", consoleScript + "<body");
      } else {
        modifiedHtml = consoleScript + html;
      }
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(modifiedHtml);
        doc.close();
        setIsLoading(false);
      } else {
        throw new Error("Could not access iframe document");
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to render preview";
      setError(errorMessage);
      setIsLoading(false);
      onRenderError?.(errorMessage);
      // Log error but don't throw - keep preview stable
      console.error("Preview render error:", errorMessage);
    }
  }, [html, onRenderError]);
  useEffect(() => {
    renderPreview();
  }, [html, runCount, renderPreview]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (event.data?.type === "console") {
          onConsoleAdd({
            type: event.data.consoleType || "log",
            message: event.data.message || ""
          });
        } else if (event.data?.type === "renderComplete") {
          onRenderComplete?.();
        }
      } catch (e) {
        // Silently handle malformed messages
        console.warn("Failed to process iframe message:", e);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleAdd, onRenderComplete]);
  if (!html) {
    return <div className="flex h-[calc(100vh-180px)] flex-col items-center justify-center bg-muted/30 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-medium text-foreground">No Preview Available</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ask the AI to generate some HTML, CSS, or JavaScript code to see a live preview here.
        </p>
      </div>;
  }
  if (error) {
    return <div className="flex h-[calc(100vh-70px)] flex-col items-center justify-center bg-destructive/5 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 font-medium text-destructive">Live Preview</h3>
        <p className="max-w-sm text-sm text-muted-foreground">👀 Preview Unavailable in Sandbox Wanna see live preview in real time? Upgrade to Vibecoder Bundle - enjoy 10 previews per day🚀</p>
        <p className="mt-2 text-xs text-muted-foreground">
          The preview will automatically retry when code changes.
        </p>
      </div>;
  }
  return <div className="relative h-[calc(100vh-180px)] w-full">
      {isLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>}
      <iframe ref={iframeRef} className="h-full w-full border-t border-border bg-background" sandbox="allow-scripts allow-modals" title="Code Preview" />
    </div>;
});
LivePreview.displayName = "LivePreview";