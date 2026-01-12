import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Monitor } from "lucide-react";
import { ConsoleEntry } from "@/types/chat";

interface LivePreviewProps {
  html: string;
  runCount: number;
  onConsoleAdd: (entry: Omit<ConsoleEntry, "id" | "timestamp">) => void;
}

export const LivePreview = ({ html, runCount, onConsoleAdd }: LivePreviewProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!iframeRef.current || !html) return;

    setError(null);

    try {
      // Inject console capture script
      const consoleScript = `
        <script>
          (function() {
            const originalConsole = {
              log: console.log,
              error: console.error,
              warn: console.warn,
              info: console.info
            };

            function sendToParent(type, args) {
              window.parent.postMessage({
                type: 'console',
                consoleType: type,
                message: Array.from(args).map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ')
              }, '*');
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
              return false;
            };
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
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to render preview");
    }
  }, [html, runCount]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "console") {
        onConsoleAdd({
          type: event.data.consoleType,
          message: event.data.message,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConsoleAdd]);

  if (!html) {
    return (
      <div className="flex h-[calc(100vh-180px)] flex-col items-center justify-center bg-muted/30 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Monitor className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-medium text-foreground">No Preview Available</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ask the AI to generate some HTML, CSS, or JavaScript code to see a live preview here.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-180px)] flex-col items-center justify-center bg-destructive/5 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="mb-2 font-medium text-destructive">Preview Error</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="h-[calc(100vh-180px)] w-full border-t border-border bg-background"
      sandbox="allow-scripts allow-modals"
      title="Code Preview"
    />
  );
};
