import { describe, it, expect } from "vitest";

// Test the markdown parsing logic (extracted for testing)
interface ParsedBlock {
  type: "paragraph" | "code" | "heading" | "list" | "blockquote" | "hr";
  content: string;
  language?: string;
  level?: number;
  items?: string[];
}

/**
 * Simple markdown parser for terminal output (copy from markdown-renderer for testing)
 */
function parseMarkdown(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = text.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block (fenced)
    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
        language,
      });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      blocks.push({ type: "hr", content: "" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        content: headingMatch[2],
        level: headingMatch[1].length,
      });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].slice(1).trim());
        i++;
      }
      blocks.push({
        type: "blockquote",
        content: quoteLines.join("\n"),
      });
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        content: "",
        items,
      });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        content: "",
        items,
      });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty lines)
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith(">") &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }
    if (paragraphLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: paragraphLines.join(" "),
      });
    }
  }

  return blocks;
}

describe("Markdown Parser", () => {
  describe("Paragraphs", () => {
    it("should parse simple paragraph", () => {
      const result = parseMarkdown("Hello world");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("paragraph");
      expect(result[0].content).toBe("Hello world");
    });

    it("should join multi-line paragraphs", () => {
      const result = parseMarkdown("Line one\nLine two");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("paragraph");
      expect(result[0].content).toBe("Line one Line two");
    });

    it("should separate paragraphs by empty lines", () => {
      const result = parseMarkdown("First paragraph\n\nSecond paragraph");
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("First paragraph");
      expect(result[1].content).toBe("Second paragraph");
    });
  });

  describe("Headings", () => {
    it("should parse h1 heading", () => {
      const result = parseMarkdown("# Heading 1");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("heading");
      expect(result[0].content).toBe("Heading 1");
      expect(result[0].level).toBe(1);
    });

    it("should parse h2 heading", () => {
      const result = parseMarkdown("## Heading 2");
      expect(result[0].level).toBe(2);
    });

    it("should parse h3 heading", () => {
      const result = parseMarkdown("### Heading 3");
      expect(result[0].level).toBe(3);
    });

    it("should parse h6 heading", () => {
      const result = parseMarkdown("###### Heading 6");
      expect(result[0].level).toBe(6);
    });
  });

  describe("Code Blocks", () => {
    it("should parse code block without language", () => {
      const result = parseMarkdown("```\nconst x = 1;\n```");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("code");
      expect(result[0].content).toBe("const x = 1;");
      expect(result[0].language).toBe("text");
    });

    it("should parse code block with language", () => {
      const result = parseMarkdown("```javascript\nconst x = 1;\n```");
      expect(result[0].language).toBe("javascript");
    });

    it("should parse multi-line code block", () => {
      const result = parseMarkdown("```python\ndef hello():\n    print('hi')\n```");
      expect(result[0].content).toBe("def hello():\n    print('hi')");
    });
  });

  describe("Lists", () => {
    it("should parse unordered list with dash", () => {
      const result = parseMarkdown("- Item 1\n- Item 2\n- Item 3");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("list");
      expect(result[0].items).toEqual(["Item 1", "Item 2", "Item 3"]);
    });

    it("should parse unordered list with asterisk", () => {
      const result = parseMarkdown("* Item 1\n* Item 2");
      expect(result[0].items).toEqual(["Item 1", "Item 2"]);
    });

    it("should parse ordered list", () => {
      const result = parseMarkdown("1. First\n2. Second\n3. Third");
      expect(result[0].type).toBe("list");
      expect(result[0].items).toEqual(["First", "Second", "Third"]);
    });
  });

  describe("Blockquotes", () => {
    it("should parse single line blockquote", () => {
      const result = parseMarkdown("> This is a quote");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("blockquote");
      expect(result[0].content).toBe("This is a quote");
    });

    it("should parse multi-line blockquote", () => {
      const result = parseMarkdown("> Line 1\n> Line 2");
      expect(result[0].content).toBe("Line 1\nLine 2");
    });
  });

  describe("Horizontal Rules", () => {
    it("should parse hr with dashes", () => {
      const result = parseMarkdown("---");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("hr");
    });

    it("should parse hr with asterisks", () => {
      const result = parseMarkdown("***");
      expect(result[0].type).toBe("hr");
    });

    it("should parse hr with underscores", () => {
      const result = parseMarkdown("___");
      expect(result[0].type).toBe("hr");
    });
  });

  describe("Mixed Content", () => {
    it("should parse mixed markdown content", () => {
      const markdown = `# Title

This is a paragraph.

## Subtitle

- Item 1
- Item 2

\`\`\`js
const x = 1;
\`\`\`

> A quote`;

      const result = parseMarkdown(markdown);
      expect(result.length).toBeGreaterThan(4);
      expect(result[0].type).toBe("heading");
      expect(result[1].type).toBe("paragraph");
      expect(result[2].type).toBe("heading");
      expect(result[3].type).toBe("list");
      expect(result[4].type).toBe("code");
      expect(result[5].type).toBe("blockquote");
    });
  });
});

describe("Autocomplete Suggestions", () => {
  // Test the command suggestion logic
  const slashCommands: Record<string, { description: string }> = {
    help: { description: "Show available commands" },
    clear: { description: "Clear terminal" },
    history: { description: "Show command history" },
    reset: { description: "Reset session" },
    status: { description: "Show agent status" },
    skills: { description: "List available skills" },
    version: { description: "Show version info" },
  };

  function getCommandSuggestions(input: string): string[] {
    if (!input.startsWith("/")) return [];
    const prefix = input.slice(1).toLowerCase();
    return Object.keys(slashCommands)
      .filter((cmd) => cmd.startsWith(prefix))
      .map((cmd) => `/${cmd}`);
  }

  it("should return all commands for just slash", () => {
    const suggestions = getCommandSuggestions("/");
    expect(suggestions.length).toBe(Object.keys(slashCommands).length);
  });

  it("should filter commands by prefix", () => {
    const suggestions = getCommandSuggestions("/he");
    expect(suggestions).toContain("/help");
    expect(suggestions).not.toContain("/clear");
  });

  it("should return empty for non-slash input", () => {
    const suggestions = getCommandSuggestions("hello");
    expect(suggestions).toHaveLength(0);
  });

  it("should match /hi to /history", () => {
    const suggestions = getCommandSuggestions("/hi");
    expect(suggestions).toContain("/history");
  });

  it("should match /s to multiple commands", () => {
    const suggestions = getCommandSuggestions("/s");
    expect(suggestions).toContain("/status");
    expect(suggestions).toContain("/skills");
  });
});
