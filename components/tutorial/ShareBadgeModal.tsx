/**
 * ShareBadgeModal Component
 * 
 * Modal for sharing earned badges to social media platforms.
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  badgeSharingService,
  BadgeShareData,
  generateBadgeCard,
} from '@/lib/tutorial/badge-sharing.service';
import { EarnedBadge } from '@/lib/tutorial/progress.service';

// TUI Colors
const GLASS_BLUE = '#00BFFF';
const FOX_ORANGE = '#FF8C00';
const BLACK = '#000000';
const SURFACE = '#0A0A0A';

interface ShareBadgeModalProps {
  visible: boolean;
  badge: EarnedBadge | null;
  tutorialTitle: string;
  onClose: () => void;
}

export function ShareBadgeModal({
  visible,
  badge,
  tutorialTitle,
  onClose,
}: ShareBadgeModalProps) {
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  if (!badge) return null;
  
  const shareData: BadgeShareData = {
    badge,
    tutorialTitle,
    completionDate: new Date(badge.earnedAt),
  };
  
  const handleShare = async (platform: 'native' | 'twitter' | 'linkedin' | 'whatsapp') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSharing(true);
    let success = false;
    
    try {
      const content = badgeSharingService.generateBadgeShareContent(shareData);
      
      switch (platform) {
        case 'native':
          success = await badgeSharingService.shareNative(content);
          break;
        case 'twitter':
          success = await badgeSharingService.shareToTwitter(content);
          break;
        case 'linkedin':
          success = await badgeSharingService.shareToLinkedIn(content);
          break;
        case 'whatsapp':
          success = await badgeSharingService.shareToWhatsApp(content);
          break;
      }
      
      if (success) {
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (error) {
      console.error('[ShareBadgeModal] Share failed:', error);
    } finally {
      setSharing(false);
    }
  };
  
  const badgeCard = generateBadgeCard(badge, tutorialTitle);
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Share Badge</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          
          {/* Badge Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview</Text>
            <View style={styles.badgePreview}>
              <Text style={styles.badgeIcon}>{badge.icon}</Text>
              <Text style={styles.badgeName}>{badge.name}</Text>
              <Text style={styles.tutorialName}>{tutorialTitle}</Text>
            </View>
            
            {/* ASCII Card Preview */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.cardScroll}
            >
              <View style={styles.asciiCard}>
                <Text style={styles.asciiText}>{badgeCard}</Text>
              </View>
            </ScrollView>
          </View>
          
          {/* Share Buttons */}
          <View style={styles.shareButtons}>
            <Text style={styles.shareTitle}>Share to:</Text>
            
            {/* Native Share */}
            <Pressable
              onPress={() => handleShare('native')}
              disabled={sharing}
              style={({ pressed }) => [
                styles.shareButton,
                styles.nativeButton,
                { opacity: pressed || sharing ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.shareButtonIcon}>📤</Text>
              <Text style={styles.shareButtonText}>Share</Text>
            </Pressable>
            
            {/* Social Media Row */}
            <View style={styles.socialRow}>
              {/* Twitter */}
              <Pressable
                onPress={() => handleShare('twitter')}
                disabled={sharing}
                style={({ pressed }) => [
                  styles.socialButton,
                  { opacity: pressed || sharing ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.socialIcon}>𝕏</Text>
                <Text style={styles.socialLabel}>Twitter</Text>
              </Pressable>
              
              {/* LinkedIn */}
              <Pressable
                onPress={() => handleShare('linkedin')}
                disabled={sharing}
                style={({ pressed }) => [
                  styles.socialButton,
                  { opacity: pressed || sharing ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.socialIcon}>in</Text>
                <Text style={styles.socialLabel}>LinkedIn</Text>
              </Pressable>
              
              {/* WhatsApp */}
              <Pressable
                onPress={() => handleShare('whatsapp')}
                disabled={sharing}
                style={({ pressed }) => [
                  styles.socialButton,
                  { opacity: pressed || sharing ? 0.7 : 1 },
                ]}
              >
                <Text style={styles.socialIcon}>💬</Text>
                <Text style={styles.socialLabel}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>
          
          {/* Success Message */}
          {shareSuccess && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={styles.successMessage}
            >
              <Text style={styles.successText}>✓ Shared successfully!</Text>
            </Animated.View>
          )}
          
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🦊 Share your progress and inspire others!
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: BLACK,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GLASS_BLUE,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GLASS_BLUE,
  },
  headerTitle: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: GLASS_BLUE,
    fontSize: 20,
    fontFamily: 'monospace',
  },
  previewContainer: {
    padding: 16,
    alignItems: 'center',
  },
  previewTitle: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 12,
    opacity: 0.7,
  },
  badgePreview: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  badgeName: {
    color: FOX_ORANGE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  tutorialName: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  cardScroll: {
    maxWidth: '100%',
  },
  asciiCard: {
    backgroundColor: SURFACE,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GLASS_BLUE,
  },
  asciiText: {
    color: GLASS_BLUE,
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 12,
  },
  shareButtons: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS_BLUE,
  },
  shareTitle: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 12,
    opacity: 0.7,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  nativeButton: {
    backgroundColor: GLASS_BLUE,
  },
  shareButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  shareButtonText: {
    color: BLACK,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  socialButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: GLASS_BLUE,
    borderRadius: 8,
    minWidth: 80,
  },
  socialIcon: {
    fontSize: 24,
    color: GLASS_BLUE,
    marginBottom: 4,
  },
  socialLabel: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  successMessage: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  successText: {
    backgroundColor: '#00FF7F',
    color: BLACK,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: GLASS_BLUE,
    alignItems: 'center',
  },
  footerText: {
    color: FOX_ORANGE,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default ShareBadgeModal;
