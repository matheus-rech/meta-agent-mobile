/**
 * SkillBadge - Display AgentSkills used in Glass responses
 * 
 * Shows which skills Glass used to generate a response,
 * with TUI-style badges and skill descriptions.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { BOX } from "@/constants/ascii-art";

// Skill definitions with icons and descriptions
export const GLASS_SKILLS = {
  'meta-analysis-fundamentals': {
    icon: '📊',
    name: 'Meta-Analysis',
    shortName: 'MA',
    color: '#3B82F6', // blue
    description: 'Core concepts: effect sizes, pooled estimates, systematic reviews, and evidence synthesis.',
  },
  'forest-plot-creation': {
    icon: '🌲',
    name: 'Forest Plot',
    shortName: 'FP',
    color: '#22C55E', // green
    description: 'Creating and interpreting forest plots to visualize meta-analysis results.',
  },
  'heterogeneity-analysis': {
    icon: '📈',
    name: 'Heterogeneity',
    shortName: 'HET',
    color: '#F59E0B', // amber
    description: 'Understanding I², τ², Q statistic, and sources of variation between studies.',
  },
  'publication-bias-detection': {
    icon: '🔍',
    name: 'Publication Bias',
    shortName: 'PB',
    color: '#EF4444', // red
    description: 'Funnel plots, Egger\'s test, trim-and-fill, and detecting missing studies.',
  },
  'data-extraction': {
    icon: '📋',
    name: 'Data Extraction',
    shortName: 'DE',
    color: '#8B5CF6', // purple
    description: 'Extracting effect sizes, standard errors, and study characteristics from papers.',
  },
  'grade-assessment': {
    icon: '⭐',
    name: 'GRADE',
    shortName: 'GR',
    color: '#EC4899', // pink
    description: 'GRADE framework for assessing certainty of evidence.',
  },
  'r-code-generation': {
    icon: '💻',
    name: 'R Code',
    shortName: 'R',
    color: '#06B6D4', // cyan
    description: 'Generating R code using metafor, meta, and other packages.',
  },
  'socratic-teaching': {
    icon: '🦊',
    name: 'Socratic',
    shortName: 'SOC',
    color: '#F97316', // orange
    description: 'Guided learning through questions and progressive understanding.',
  },
  'risk-of-bias': {
    icon: '⚖️',
    name: 'Risk of Bias',
    shortName: 'RoB',
    color: '#14B8A6', // teal
    description: 'RoB 2, ROBINS-I, and Newcastle-Ottawa Scale assessments.',
  },
  'network-meta-analysis': {
    icon: '🕸️',
    name: 'Network MA',
    shortName: 'NMA',
    color: '#6366F1', // indigo
    description: 'Network meta-analysis for comparing multiple interventions.',
  },
} as const;

export type SkillId = keyof typeof GLASS_SKILLS;

interface SkillBadgeProps {
  skillId: SkillId;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showName?: boolean;
  onPress?: () => void;
}

export function SkillBadge({
  skillId,
  size = 'small',
  showIcon = true,
  showName = true,
  onPress,
}: SkillBadgeProps) {
  const colors = useColors();
  const [showTooltip, setShowTooltip] = useState(false);
  const skill = GLASS_SKILLS[skillId];

  if (!skill) return null;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onPress) {
      onPress();
    } else {
      setShowTooltip(true);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'large':
        return { paddingH: 12, paddingV: 6, fontSize: 14, iconSize: 16 };
      case 'medium':
        return { paddingH: 8, paddingV: 4, fontSize: 12, iconSize: 14 };
      default:
        return { paddingH: 6, paddingV: 2, fontSize: 10, iconSize: 12 };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.badge,
          {
            backgroundColor: skill.color + '20', // 20% opacity
            borderColor: skill.color,
            paddingHorizontal: sizeStyles.paddingH,
            paddingVertical: sizeStyles.paddingV,
          },
        ]}
        activeOpacity={0.7}
      >
        {showIcon && (
          <Text style={{ fontSize: sizeStyles.iconSize, marginRight: showName ? 4 : 0 }}>
            {skill.icon}
          </Text>
        )}
        {showName && (
          <Text
            style={[
              styles.badgeText,
              {
                color: skill.color,
                fontSize: sizeStyles.fontSize,
              },
            ]}
          >
            {size === 'small' ? skill.shortName : skill.name}
          </Text>
        )}
      </TouchableOpacity>

      {/* Tooltip Modal */}
      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTooltip(false)}
        >
          <View
            style={[
              styles.tooltip,
              {
                backgroundColor: colors.surface,
                borderColor: skill.color,
              },
            ]}
          >
            <View style={styles.tooltipHeader}>
              <Text style={{ fontSize: 24 }}>{skill.icon}</Text>
              <Text style={[styles.tooltipTitle, { color: skill.color }]}>
                {skill.name}
              </Text>
            </View>
            <Text style={[styles.tooltipDescription, { color: colors.foreground }]}>
              {skill.description}
            </Text>
            <Text style={[styles.tooltipHint, { color: colors.muted }]}>
              {"Tap anywhere to close"}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

interface SkillBadgesRowProps {
  skills: SkillId[];
  size?: 'small' | 'medium' | 'large';
}

export function SkillBadgesRow({ skills, size = 'small' }: SkillBadgesRowProps) {
  const colors = useColors();

  if (!skills || skills.length === 0) return null;

  return (
    <View style={styles.badgesRow}>
      <Text style={[styles.badgesLabel, { color: colors.muted }]}>
        {"Skills: "}
      </Text>
      {skills.map((skillId) => (
        <SkillBadge key={skillId} skillId={skillId} size={size} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 4,
    marginBottom: 4,
  },
  badgeText: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 8,
  },
  badgesLabel: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tooltip: {
    maxWidth: 300,
    borderRadius: 8,
    borderWidth: 2,
    padding: 16,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tooltipTitle: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 16,
    fontWeight: 'bold',
  },
  tooltipDescription: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  tooltipHint: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SkillBadge;
