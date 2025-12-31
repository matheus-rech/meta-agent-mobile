/**
 * Streaming Output Component
 * Displays real-time R console output line-by-line
 */

import React, { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, Animated, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

export interface StreamLine {
  id: string;
  type: "stdout" | "stderr" | "status" | "file" | "complete" | "error";
  content: string;
  timestamp: number;
}

interface StreamingOutputProps {
  lines: StreamLine[];
  isStreaming: boolean;
  onFileClick?: (filePath: string) => void;
}

export function StreamingOutput({ lines, isStreaming, onFileClick }: StreamingOutputProps) {
  const colors = useColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  // Auto-scroll to bottom when new lines arrive
  useEffect(() => {
    if (autoScroll && scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [lines, autoScroll]);
  
  const getLineColor = (type: StreamLine["type"]): string => {
    switch (type) {
      case "stdout":
        return colors.foreground;
      case "stderr":
        return colors.warning;
      case "status":
        return colors.primary;
      case "file":
        return colors.success;
      case "complete":
        return colors.success;
      case "error":
        return colors.error;
      default:
        return colors.foreground;
    }
  };
  
  const getLinePrefix = (type: StreamLine["type"]): string => {
    switch (type) {
      case "stdout":
        return "";
      case "stderr":
        return "⚠ ";
      case "status":
        return "→ ";
      case "file":
        return "📄 ";
      case "complete":
        return "✓ ";
      case "error":
        return "✗ ";
      default:
        return "";
    }
  };
  
  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <View 
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          padding: 8,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <View 
          style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4,
            backgroundColor: isStreaming ? colors.success : colors.muted,
            marginRight: 8,
          }} 
        />
        <Text 
          style={{ 
            fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
            fontSize: 12,
            color: colors.muted,
          }}
        >
          {isStreaming ? "R Console (streaming...)" : "R Console"}
        </Text>
        {isStreaming && <PulsingDot color={colors.success} />}
      </View>
      
      {/* Output */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, padding: 8 }}
        onScrollBeginDrag={() => setAutoScroll(false)}
        onMomentumScrollEnd={(e) => {
          const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
          const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
          setAutoScroll(isAtBottom);
        }}
      >
        {lines.map((line) => (
          <StreamLineItem
            key={line.id}
            line={line}
            color={getLineColor(line.type)}
            prefix={getLinePrefix(line.type)}
            onFileClick={onFileClick}
          />
        ))}
        
        {isStreaming && (
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
            <Text 
              style={{ 
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                fontSize: 12,
                color: colors.muted,
              }}
            >
              {">"} 
            </Text>
            <BlinkingCursor color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface StreamLineItemProps {
  line: StreamLine;
  color: string;
  prefix: string;
  onFileClick?: (filePath: string) => void;
}

function StreamLineItem({ line, color, prefix, onFileClick }: StreamLineItemProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const isClickable = line.type === "file" && onFileClick;
  
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text
        style={{
          fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
          fontSize: 12,
          lineHeight: 18,
          color,
          textDecorationLine: isClickable ? "underline" : "none",
        }}
        onPress={isClickable ? () => onFileClick(line.content) : undefined}
      >
        {prefix}{line.content}
      </Text>
    </Animated.View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);
  
  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        marginLeft: 8,
        opacity: pulseAnim,
      }}
    />
  );
}

function BlinkingCursor({ color }: { color: string }) {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim]);
  
  return (
    <Animated.View
      style={{
        width: 8,
        height: 14,
        backgroundColor: color,
        opacity: blinkAnim,
        marginLeft: 2,
      }}
    />
  );
}
