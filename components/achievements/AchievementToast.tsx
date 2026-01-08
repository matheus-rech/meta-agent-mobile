/**
 * AchievementToast Component
 * 
 * Toast notification for achievements with Glass celebrating animation.
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  AchievementNotification,
  subscribeToAchievements,
} from '@/lib/achievements/achievement.service';

// TUI Colors
const GLASS_BLUE = '#00BFFF';
const FOX_ORANGE = '#FF8C00';
const BLACK = '#000000';
const SURFACE = '#0A0A0A';
const GOLD = '#FFD700';

interface AchievementToastProps {
  duration?: number;
  onDismiss?: () => void;
}

export function AchievementToast({ duration = 5000, onDismiss }: AchievementToastProps) {
  const [notification, setNotification] = useState<AchievementNotification | null>(null);
  const [queue, setQueue] = useState<AchievementNotification[]>([]);
  
  const translateY = useSharedValue(-150);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const glassScale = useSharedValue(1);
  const confettiOpacity = useSharedValue(0);
  
  // Subscribe to achievement notifications
  useEffect(() => {
    const unsubscribe = subscribeToAchievements((newNotification) => {
      setQueue(prev => [...prev, newNotification]);
    });
    
    return unsubscribe;
  }, []);
  
  // Process queue
  useEffect(() => {
    if (!notification && queue.length > 0) {
      const next = queue[0];
      setQueue(prev => prev.slice(1));
      showNotification(next);
    }
  }, [notification, queue]);
  
  const showNotification = (notif: AchievementNotification) => {
    setNotification(notif);
    
    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Animate in
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
    
    // Glass celebration animation
    glassScale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 200 }),
      withDelay(200, withTiming(1.1, { duration: 150 })),
      withTiming(1, { duration: 150 })
    );
    
    // Confetti animation
    confettiOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(2000, withTiming(0, { duration: 500 }))
    );
    
    // Auto dismiss
    setTimeout(() => {
      dismissNotification();
    }, duration);
  };
  
  const dismissNotification = () => {
    translateY.value = withTiming(-150, { duration: 300, easing: Easing.inOut(Easing.ease) });
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setNotification)(null);
      if (onDismiss) runOnJS(onDismiss)();
    });
  };
  
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));
  
  const glassStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glassScale.value }],
  }));
  
  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }));
  
  if (!notification) return null;
  
  const { achievement, glassMessage } = notification;
  
  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Confetti */}
      <Animated.View style={[styles.confettiContainer, confettiStyle]}>
        <Text style={styles.confetti}>🎊</Text>
        <Text style={[styles.confetti, styles.confettiLeft]}>✨</Text>
        <Text style={[styles.confetti, styles.confettiRight]}>🎉</Text>
      </Animated.View>
      
      <Pressable
        onPress={dismissNotification}
        style={({ pressed }) => [
          styles.toast,
          { opacity: pressed ? 0.9 : 1 },
        ]}
      >
        {/* Glass Mascot */}
        <Animated.View style={[styles.glassContainer, glassStyle]}>
          <Text style={styles.glassEmoji}>🦊</Text>
        </Animated.View>
        
        {/* Content */}
        <View style={styles.content}>
          {/* Achievement Header */}
          <View style={styles.header}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.headerText}>
              <Text style={styles.achievementLabel}>ACHIEVEMENT UNLOCKED</Text>
              <Text style={styles.achievementName}>{achievement.name}</Text>
            </View>
          </View>
          
          {/* Glass Message */}
          <Text style={styles.glassMessage}>{glassMessage}</Text>
          
          {/* Description */}
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
        
        {/* Dismiss hint */}
        <Text style={styles.dismissHint}>Tap to dismiss</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * Achievement Toast Provider
 * Wrap your app with this to enable achievement notifications
 */
export function AchievementToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AchievementToast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  confettiContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confetti: {
    fontSize: 24,
  },
  confettiLeft: {
    position: 'absolute',
    left: 40,
  },
  confettiRight: {
    position: 'absolute',
    right: 40,
  },
  toast: {
    backgroundColor: BLACK,
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glassContainer: {
    position: 'absolute',
    top: -30,
    right: 20,
  },
  glassEmoji: {
    fontSize: 48,
  },
  content: {
    paddingRight: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  achievementLabel: {
    color: GOLD,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  achievementName: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  glassMessage: {
    color: FOX_ORANGE,
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  description: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  dismissHint: {
    color: GLASS_BLUE,
    fontSize: 10,
    fontFamily: 'monospace',
    opacity: 0.5,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default AchievementToast;
