import { User, Bot, Copy, Play, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  onCodeSelect: (code: string) => void;
}

export const ChatMessage = ({ message, onCodeSelect }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-primary" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-foreground" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-2 rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        <MessageContent
          content={message.content}
          codeBlocks={message.codeBlocks}
          onCodeSelect={onCodeSelect}
        />
        <span className="text-xs opacity-60">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
  codeBlocks?: Array<{
    id: string;
    language: string;
    code: string;
    isPreviewable: boolean;
  }>;
  onCodeSelect: (code: string) => void;
}

const MessageContent = ({ content, codeBlocks, onCodeSelect }: MessageContentProps) => {
  // Split content by code blocks and render accordingly
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        const codeMatch = part.match(/```(\w+)?(?::(\w+))?\n([\s\S]*?)```/);
        
        if (codeMatch) {
          const language = codeMatch[1] || "plaintext";
          const modifier = codeMatch[2];
          const code = codeMatch[3].trim();
          const isPreviewable = modifier === "preview" || language === "html";

          return (
            <CodeBlockComponent
              key={index}
              language={language}
              code={code}
              isPreviewable={isPreviewable}
              onPreview={() => onCodeSelect(code)}
            />
          );
        }

        // Regular text
        if (part.trim()) {
          return (
            <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
              {part}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
};

interface CodeBlockComponentProps {
  language: string;
  code: string;
  isPreviewable: boolean;
  onPreview: () => void;
}

const CodeBlockComponent = ({
  language,
  code,
  isPreviewable,
  onPreview,
}: CodeBlockComponentProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      {/* Code header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-2">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {language}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
          {isPreviewable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onPreview}
              title="Run in preview"
            >
              <Play className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Code content */}
      <pre className="max-h-[300px] overflow-auto p-3">
        <code className="font-mono text-xs leading-relaxed text-foreground">
          {code}
        </code>
      </pre>
    </div>
  );
};
