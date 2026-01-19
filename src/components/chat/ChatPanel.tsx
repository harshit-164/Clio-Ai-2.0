import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message } from "@/types/chat";
import { ChatMessage } from "./ChatMessage";
interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onClearMessages: () => void;
  onCodeSelect: (code: string) => void;
}
export const ChatPanel = ({
  messages,
  isLoading,
  onSendMessage,
  onClearMessages,
  onCodeSelect
}: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  return <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-blue-700 bg-primary-foreground text-base font-mono text-justify font-extrabold">Clio Ai</h2>
            <p className="text-xs text-muted-foreground">Ask me anything about coding</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClearMessages} title="Clear chat" className="text-muted-foreground hover:text-foreground">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              Welcome to AI Code Assistant
            </h3>
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask me to create HTML, CSS, or JavaScript code. I'll generate working examples
              that you can preview and run instantly.
            </p>
            <div className="mt-6 space-y-2">
              <p className="text-xs text-muted-foreground">Try asking:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Create a responsive navbar", "Make a CSS loading animation", "Build a todo list in JavaScript"].map(suggestion => <button key={suggestion} onClick={() => setInput(suggestion)} className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground">
                    {suggestion}
                  </button>)}
              </div>
            </div>
          </div> : <div className="space-y-4">
            {messages.map(message => <ChatMessage key={message.id} message={message} onCodeSelect={onCodeSelect} />)}
            {isLoading && <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                </div>
                <span className="text-sm">AI is thinking...</span>
              </div>}
          </div>}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask me to write some code..." className="min-h-[52px] resize-none bg-muted/50" disabled={isLoading} />
          <Button type="submit" disabled={!input.trim() || isLoading} className="h-auto px-4">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>;
};