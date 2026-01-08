/**
 * QuickPrompts - Preset question buttons for Glass 🦊
 * 
 * Provides quick access to common meta-analysis questions
 * for faster onboarding and learning.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { BOX } from "@/constants/ascii-art";

// Quick prompt categories and questions
export const QUICK_PROMPTS = {
  basics: {
    title: 'Basics',
    icon: '📚',
    prompts: [
      { id: 'what-is-ma', text: 'What is meta-analysis?', shortText: 'What is MA?' },
      { id: 'what-is-i2', text: 'What is I² and how do I interpret it?', shortText: 'What is I²?' },
      { id: 'effect-sizes', text: 'Explain effect sizes (OR, RR, SMD)', shortText: 'Effect sizes' },
      { id: 'fixed-random', text: 'Fixed vs random effects models', shortText: 'Fixed vs Random' },
    ],
  },
  visualization: {
    title: 'Plots',
    icon: '📊',
    prompts: [
      { id: 'forest-plot', text: 'How do I read a forest plot?', shortText: 'Forest plot' },
      { id: 'funnel-plot', text: 'What is a funnel plot?', shortText: 'Funnel plot' },
      { id: 'bubble-plot', text: 'Explain meta-regression bubble plots', shortText: 'Bubble plot' },
      { id: 'rob-plot', text: 'How to create risk of bias plots?', shortText: 'RoB plot' },
    ],
  },
  rCode: {
    title: 'R Code',
    icon: '💻',
    prompts: [
      { id: 'r-forest', text: 'Show me R code for a forest plot', shortText: 'Forest plot R' },
      { id: 'r-meta', text: 'Basic meta-analysis in R with metafor', shortText: 'metafor basics' },
      { id: 'r-subgroup', text: 'How to do subgroup analysis in R?', shortText: 'Subgroup R' },
      { id: 'r-funnel', text: 'R code for funnel plot and Egger test', shortText: 'Funnel R' },
    ],
  },
  advanced: {
    title: 'Advanced',
    icon: '🎓',
    prompts: [
      { id: 'heterogeneity', text: 'How to investigate heterogeneity?', shortText: 'Heterogeneity' },
      { id: 'pub-bias', text: 'How to detect publication bias?', shortText: 'Pub bias' },
      { id: 'sensitivity', text: 'Explain sensitivity analysis', shortText: 'Sensitivity' },
      { id: 'grade', text: 'How to use GRADE for evidence certainty?', shortText: 'GRADE' },
    ],
  },
} as const;

export type PromptCategory = keyof typeof QUICK_PROMPTS;
export type PromptId = string;

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  collapsed?: boolean;
  showCategories?: boolean;
}

export function QuickPrompts({
  onSelectPrompt,
  collapsed = false,
  showCategories = true,
}: QuickPromptsProps) {
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory>('basics');

  const handlePromptPress = useCallback((prompt: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectPrompt(prompt);
  }, [onSelectPrompt]);

  const handleCategoryPress = useCallback((category: PromptCategory) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(category);
  }, []);

  if (collapsed) {
    // Show single row of popular prompts
    const popularPrompts = [
      QUICK_PROMPTS.basics.prompts[1], // What is I²?
      QUICK_PROMPTS.visualization.prompts[0], // Forest plot
      QUICK_PROMPTS.rCode.prompts[0], // Forest plot R
      QUICK_PROMPTS.advanced.prompts[0], // Heterogeneity
    ];

    return (
      <View style={[styles.collapsedContainer, { backgroundColor: colors.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collapsedScroll}
        >
          <Text style={[styles.quickLabel, { color: colors.muted }]}>
            {"Quick: "}
          </Text>
          {popularPrompts.map((prompt) => (
            <TouchableOpacity
              key={prompt.id}
              onPress={() => handlePromptPress(prompt.text)}
              style={[
                styles.collapsedButton,
                {
                  backgroundColor: colors.terminal,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.collapsedButtonText, { color: colors.primary }]}>
                {prompt.shortText}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  const currentCategory = QUICK_PROMPTS[selectedCategory];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* TUI Header */}
      <Text style={[styles.tuiHeader, { color: colors.border }]}>
        {BOX.topLeft}{BOX.horizontal}{" Quick Prompts "}{BOX.horizontal.repeat(20)}{BOX.topRight}
      </Text>

      {/* Category Tabs */}
      {showCategories && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {(Object.keys(QUICK_PROMPTS) as PromptCategory[]).map((category) => {
            const cat = QUICK_PROMPTS[category];
            const isSelected = category === selectedCategory;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => handleCategoryPress(category)}
                style={[
                  styles.categoryTab,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.terminal,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: isSelected ? colors.background : colors.foreground },
                  ]}
                >
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Prompts Grid */}
      <View style={styles.promptsGrid}>
        {currentCategory.prompts.map((prompt) => (
          <TouchableOpacity
            key={prompt.id}
            onPress={() => handlePromptPress(prompt.text)}
            style={[
              styles.promptButton,
              {
                backgroundColor: colors.terminal,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.promptText, { color: colors.foreground }]}>
              {prompt.shortText}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TUI Footer */}
      <Text style={[styles.tuiFooter, { color: colors.border }]}>
        {BOX.bottomLeft}{BOX.horizontal.repeat(36)}{BOX.bottomRight}
      </Text>
    </View>
  );
}

interface QuickPromptsBarProps {
  onSelectPrompt: (prompt: string) => void;
}

export function QuickPromptsBar({ onSelectPrompt }: QuickPromptsBarProps) {
  return <QuickPrompts onSelectPrompt={onSelectPrompt} collapsed />;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tuiHeader: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 4,
  },
  tuiFooter: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
  categoriesScroll: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 4,
    gap: 6,
    flexDirection: 'row',
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  categoryText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
    fontWeight: '600',
  },
  promptsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 4,
  },
  promptButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  promptText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
  },
  collapsedContainer: {
    paddingVertical: 6,
  },
  collapsedScroll: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  quickLabel: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
  },
  collapsedButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  collapsedButtonText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 11,
    fontWeight: '500',
  },
});

export default QuickPrompts;
