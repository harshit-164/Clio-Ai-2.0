import { CodeBlock } from "@/types/chat";

const PREVIEW_LANGUAGES = ["html", "css", "javascript", "js", "jsx", "ts", "tsx"];

const isPreviewableLanguage = (language: string | undefined): boolean => {
  if (!language) return false;
  return PREVIEW_LANGUAGES.includes(language.toLowerCase());
};

/**
 * Extracts code blocks from markdown content
 * Supports special :preview suffix for previewable HTML/CSS/JS
 */
export const extractCodeBlocks = (content: string): CodeBlock[] => {
  const codeBlocks: CodeBlock[] = [];

  // Match code blocks with optional language and :preview suffix
  const regex = /```(\w+)?(?::(\w+))?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const rawLanguage = match[1] || "plaintext";
    const language = rawLanguage.toLowerCase();
    const modifier = match[2];
    const code = match[3].trim();

    const previewable = modifier === "preview" || isPreviewableLanguage(language);

    codeBlocks.push({
      id: crypto.randomUUID(),
      language,
      code,
      isPreviewable: previewable,
    });
  }

  return codeBlocks;
};

/**
 * Gets the latest previewable code from a list of code blocks
 */
export const getPreviewableCode = (codeBlocks: CodeBlock[]): string | null => {
  const previewable = codeBlocks.filter((block) => block.isPreviewable);
  if (previewable.length === 0) return null;

  const htmlBlock = [...previewable].reverse().find((block) => block.language === "html");
  const cssBlocks = previewable.filter((block) => block.language === "css");
  const jsBlocks = previewable.filter((block) =>
    ["javascript", "js", "jsx", "ts", "tsx"].includes(block.language)
  );

  // If we have HTML, enrich it with CSS/JS when present
  if (htmlBlock) {
    return buildHtmlDocument(htmlBlock.code, cssBlocks, jsBlocks);
  }

  // CSS-only preview
  if (cssBlocks.length > 0 && jsBlocks.length === 0) {
    return wrapInHtmlDocument(cssBlocks.map((b) => b.code).join("\n\n"));
  }

  // JS-only preview
  if (jsBlocks.length > 0 && cssBlocks.length === 0) {
    return wrapInHtmlDocument(jsBlocks.map((b) => b.code).join("\n\n"));
  }

  // If we have CSS + JS but no HTML, provide a minimal mount point
  if (cssBlocks.length > 0 || jsBlocks.length > 0) {
    const css = cssBlocks.map((b) => b.code).join("\n\n");
    const js = jsBlocks.map((b) => b.code).join("\n\n");
    return buildHtmlDocument('<div id="app"></div>', cssBlocks, jsBlocks, css, js);
  }

  // Fallback to the last previewable code
  return wrapInHtmlDocument(previewable[previewable.length - 1].code);
};

const injectAssets = (html: string, css: string, js: string): string => {
  let result = html;
  if (css) {
    if (result.match(/<\/head>/i)) {
      result = result.replace(/<\/head>/i, `<style>${css}</style></head>`);
    } else {
      result = `<style>${css}</style>` + result;
    }
  }
  if (js) {
    if (result.match(/<\/body>/i)) {
      result = result.replace(/<\/body>/i, `<script>${js}</script></body>`);
    } else {
      result += `<script>${js}</script>`;
    }
  }
  return result;
};

const buildHtmlDocument = (
  htmlContent: string,
  cssBlocks: CodeBlock[],
  jsBlocks: CodeBlock[],
  cssOverride?: string,
  jsOverride?: string
): string => {
  const css = cssOverride ?? cssBlocks.map((b) => b.code).join("\n\n");
  const js = jsOverride ?? jsBlocks.map((b) => b.code).join("\n\n");
  const hasFullDoc = /<!doctype html>|<html/i.test(htmlContent);

  if (hasFullDoc) {
    return injectAssets(htmlContent, css, js);
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  ${css ? `<style>${css}</style>` : ""}
</head>
<body>
  ${htmlContent}
  ${js ? `<script>${js}</script>` : ""}
</body>
</html>`;
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

export { isPreviewableLanguage };
