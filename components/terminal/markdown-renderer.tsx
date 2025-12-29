import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface MarkdownRendererProps {
  content: string;
}

interface ParsedBlock {
  type: "paragraph" | "code" | "heading" | "list" | "blockquote" | "hr";
  content: string;
  language?: string;
  level?: number;
  items?: string[];
}

/**
 * Simple markdown parser for terminal output
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

/**
 * Parse inline formatting (bold, italic, code, links)
 */
function parseInline(text: string, colors: any): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      parts.push(
        <Text
          key={key++}
          style={[
            styles.inlineCode,
            { backgroundColor: colors.surface, color: colors.prompt },
          ]}
        >
          {codeMatch[1]}
        </Text>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
    if (boldMatch) {
      parts.push(
        <Text key={key++} style={styles.bold}>
          {boldMatch[1]}
        </Text>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/^\*([^*]+)\*/);
    if (italicMatch) {
      parts.push(
        <Text key={key++} style={styles.italic}>
          {italicMatch[1]}
        </Text>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      parts.push(
        <Text key={key++} style={[styles.link, { color: colors.primary }]}>
          {linkMatch[1]}
        </Text>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Regular text (up to next special character)
    const nextSpecial = remaining.search(/[`*\[]/);
    if (nextSpecial === -1) {
      parts.push(<Text key={key++}>{remaining}</Text>);
      break;
    } else if (nextSpecial === 0) {
      // Special char but no match, treat as regular
      parts.push(<Text key={key++}>{remaining[0]}</Text>);
      remaining = remaining.slice(1);
    } else {
      parts.push(<Text key={key++}>{remaining.slice(0, nextSpecial)}</Text>);
      remaining = remaining.slice(nextSpecial);
    }
  }

  return parts;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const colors = useColors();
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  const renderBlock = (block: ParsedBlock, index: number) => {
    switch (block.type) {
      case "code":
        return (
          <View
            key={index}
            style={[styles.codeBlock, { backgroundColor: colors.terminal, borderColor: colors.border }]}
          >
            {block.language && block.language !== "text" && (
              <Text style={[styles.codeLanguage, { color: colors.muted }]}>
                {block.language}
              </Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Text
                style={[styles.codeText, { color: colors.foreground }]}
                selectable
              >
                {block.content}
              </Text>
            </ScrollView>
          </View>
        );

      case "heading":
        const headingSize = 20 - ((block.level || 1) - 1) * 2;
        return (
          <Text
            key={index}
            style={[
              styles.heading,
              { fontSize: headingSize, color: colors.foreground },
            ]}
          >
            {block.content}
          </Text>
        );

      case "list":
        return (
          <View key={index} style={styles.list}>
            {block.items?.map((item, i) => (
              <View key={i} style={styles.listItem}>
                <Text style={[styles.listBullet, { color: colors.prompt }]}>•</Text>
                <Text style={[styles.listText, { color: colors.foreground }]}>
                  {parseInline(item, colors)}
                </Text>
              </View>
            ))}
          </View>
        );

      case "blockquote":
        return (
          <View
            key={index}
            style={[styles.blockquote, { borderLeftColor: colors.primary, backgroundColor: colors.surface }]}
          >
            <Text style={[styles.blockquoteText, { color: colors.muted }]}>
              {parseInline(block.content, colors)}
            </Text>
          </View>
        );

      case "hr":
        return (
          <View
            key={index}
            style={[styles.hr, { backgroundColor: colors.border }]}
          />
        );

      case "paragraph":
      default:
        return (
          <Text key={index} style={[styles.paragraph, { color: colors.foreground }]}>
            {parseInline(block.content, colors)}
          </Text>
        );
    }
  };

  return <View style={styles.container}>{blocks.map(renderBlock)}</View>;
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  heading: {
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 4,
  },
  codeBlock: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginVertical: 4,
  },
  codeLanguage: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  codeText: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 13,
    lineHeight: 20,
  },
  inlineCode: {
    fontFamily: Platform.select({
      ios: "Menlo",
      android: "monospace",
      default: "Courier New",
    }),
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  link: {
    textDecorationLine: "underline",
  },
  list: {
    marginVertical: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  listBullet: {
    width: 16,
    fontSize: 14,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 4,
    borderRadius: 4,
  },
  blockquoteText: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 22,
  },
  hr: {
    height: 1,
    marginVertical: 12,
  },
});
