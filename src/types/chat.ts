export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  isPreviewable: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentCode: string;
  activeTab: "preview" | "code" | "console";
  consoleOutput: ConsoleEntry[];
}

export interface ConsoleEntry {
  id: string;
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: Date;
}
