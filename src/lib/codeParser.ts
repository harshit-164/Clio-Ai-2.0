import { CodeBlock } from "@/types/chat";

/**
 * Extracts code blocks from markdown content
 * Supports special :preview suffix for previewable HTML
 */
export const extractCodeBlocks = (content: string): CodeBlock[] => {
  const codeBlocks: CodeBlock[] = [];
  
  // Match code blocks with optional language and :preview suffix
  const regex = /```(\w+)?(?::(\w+))?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const language = match[1] || "plaintext";
    const modifier = match[2];
    const code = match[3].trim();
    
    codeBlocks.push({
      id: crypto.randomUUID(),
      language,
      code,
      isPreviewable: modifier === "preview" || language === "html",
    });
  }

  return codeBlocks;
};

/**
 * Gets the latest previewable code from a list of code blocks
 */
export const getPreviewableCode = (codeBlocks: CodeBlock[]): string | null => {
  const previewable = codeBlocks.filter((block) => block.isPreviewable);
  return previewable.length > 0 ? previewable[previewable.length - 1].code : null;
};

/**
 * Wraps HTML/CSS/JS code in a complete HTML document if needed
 */
export const wrapInHtmlDocument = (code: string): string => {
  // If it's already a complete HTML document, return as is
  if (code.toLowerCase().includes("<!doctype html>") || 
      code.toLowerCase().includes("<html")) {
    return code;
  }

  // Check if it looks like CSS only
  if (code.trim().match(/^[.#@\w\s{}\-:;,()'"]+$/) && 
      !code.includes("<") && 
      code.includes("{")) {
    return `<!DOCTYPE html>
<html>
<head>
  <style>${code}</style>
</head>
<body>
  <div id="preview">CSS Preview</div>
</body>
</html>`;
  }

  // Check if it looks like JavaScript only
  if (!code.includes("<") && 
      (code.includes("function") || 
       code.includes("const") || 
       code.includes("let") ||
       code.includes("=>"))) {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1a1a2e; color: #eee; }
    #output { white-space: pre-wrap; font-family: monospace; }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    const originalLog = console.log;
    console.log = (...args) => {
      document.getElementById('output').textContent += args.join(' ') + '\\n';
      originalLog.apply(console, args);
    };
    ${code}
  </script>
</body>
</html>`;
  }

  // Wrap as HTML body content
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui; padding: 20px; background: #1a1a2e; color: #eee; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
};

/**
 * Removes markdown formatting from content for plain text display
 */
export const stripCodeBlocks = (content: string): string => {
  return content.replace(/```[\s\S]*?```/g, "[Code Block]");
};
