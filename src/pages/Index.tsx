import { useState, useCallback } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { PreviewPanel } from "@/components/preview/PreviewPanel";
import { useChat } from "@/hooks/useChat";
import { ConsoleEntry } from "@/types/chat";
import { getPreviewableCode } from "@/lib/codeParser";

const Index = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const [currentCode, setCurrentCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState<ConsoleEntry[]>([]);

  // Handle code selection from chat
  const handleCodeSelect = useCallback((code: string) => {
    setCurrentCode(code);
    setConsoleOutput([]);
  }, []);

  // Auto-update preview when AI generates code
  const handleSendMessage = useCallback(
    async (message: string) => {
      await sendMessage(message);
      
      // After message is sent, check for previewable code in latest assistant message
      // This happens automatically through the useChat hook's state updates
    },
    [sendMessage]
  );

  // Watch for new previewable code from messages
  const latestAssistantMessage = messages.filter((m) => m.role === "assistant").pop();
  const latestCode = latestAssistantMessage?.codeBlocks
    ? getPreviewableCode(latestAssistantMessage.codeBlocks)
    : null;

  // Auto-select latest code if user hasn't manually selected anything
  if (latestCode && !currentCode) {
    setCurrentCode(latestCode);
  }

  const handleConsoleClear = useCallback(() => {
    setConsoleOutput([]);
  }, []);

  const handleConsoleAdd = useCallback(
    (entry: Omit<ConsoleEntry, "id" | "timestamp">) => {
      setConsoleOutput((prev) => [
        ...prev,
        {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-background">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Chat Panel */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onClearMessages={clearMessages}
            onCodeSelect={handleCodeSelect}
          />
        </ResizablePanel>

        {/* Resizable Handle */}
        <ResizableHandle withHandle />

        {/* Preview Panel */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <PreviewPanel
            code={currentCode}
            onCodeChange={setCurrentCode}
            consoleOutput={consoleOutput}
            onConsoleClear={handleConsoleClear}
            onConsoleAdd={handleConsoleAdd}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Index;
