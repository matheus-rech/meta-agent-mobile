/**
 * CertificateModal Component
 * Display and share tutorial completion certificates
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  certificateService,
  CertificateData,
} from '@/lib/tutorial/certificate.service';
import { tutorialService } from '@/lib/tutorial';

interface CertificateModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CertificateModal({ visible, onClose }: CertificateModalProps) {
  const [userName, setUserName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);
  const [savedCertificates, setSavedCertificates] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadSavedCertificates();
    }
  }, [visible]);

  const loadSavedCertificates = async () => {
    const certs = await certificateService.getSavedCertificates();
    setSavedCertificates(certs);
  };

  const handleGenerate = async () => {
    if (!userName.trim()) {
      Alert.alert('Name Required', 'Please enter your name for the certificate.');
      return;
    }

    setIsGenerating(true);

    try {
      const stats = tutorialService.getStatistics();
      const badges = tutorialService.getEarnedBadges();

      const data: CertificateData = {
        userName: userName.trim(),
        completionDate: new Date(),
        modulesCompleted: stats.modulesCompleted,
        totalModules: stats.totalModules,
        totalTimeMinutes: Math.round(stats.timeSpent / 60),
        accuracy: stats.accuracy,
        badges: badges.map((b) => `${b.icon} ${b.name}`),
      };

      const path = await certificateService.generateCertificate(data);
      setGeneratedPath(path);
      await loadSavedCertificates();
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      Alert.alert('Error', 'Failed to generate certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (path: string) => {
    try {
      await certificateService.shareCertificate(path);
    } catch (error) {
      console.error('Failed to share certificate:', error);
      Alert.alert('Error', 'Failed to share certificate.');
    }
  };

  const handleDelete = async (path: string) => {
    Alert.alert(
      'Delete Certificate',
      'Are you sure you want to delete this certificate?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await certificateService.deleteCertificate(path);
            await loadSavedCertificates();
            if (generatedPath === path) {
              setGeneratedPath(null);
            }
          },
        },
      ]
    );
  };

  const stats = tutorialService.getStatistics();
  const canGenerate = stats.modulesCompleted >= stats.totalModules;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Completion Certificate</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Check */}
          {!canGenerate && (
            <View style={styles.progressCard}>
              <Text style={styles.progressIcon}>📚</Text>
              <Text style={styles.progressTitle}>Complete All Modules</Text>
              <Text style={styles.progressText}>
                Finish all {stats.totalModules} tutorial modules to unlock your certificate.
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(stats.modulesCompleted / stats.totalModules) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressCount}>
                {stats.modulesCompleted} of {stats.totalModules} completed
              </Text>
            </View>
          )}

          {/* Generate Certificate */}
          {canGenerate && (
            <View style={styles.generateCard}>
              <Text style={styles.generateIcon}>🎓</Text>
              <Text style={styles.generateTitle}>Generate Your Certificate</Text>
              <Text style={styles.generateText}>
                Congratulations on completing all modules! Enter your name to generate a personalized certificate.
              </Text>

              <TextInput
                style={styles.nameInput}
                placeholder="Enter your name"
                placeholderTextColor="#64748b"
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
                returnKeyType="done"
              />

              <Pressable
                onPress={handleGenerate}
                disabled={isGenerating}
                style={({ pressed }) => [
                  styles.generateButton,
                  pressed && styles.buttonPressed,
                  isGenerating && styles.buttonDisabled,
                ]}
              >
                {isGenerating ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.generateButtonText}>Generate Certificate</Text>
                )}
              </Pressable>
            </View>
          )}

          {/* Generated Certificate Preview */}
          {generatedPath && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Certificate Generated!</Text>
              <View style={styles.certificatePreview}>
                <Text style={styles.previewIcon}>📜</Text>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{userName}</Text>
                  <Text style={styles.previewDate}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => handleShare(generatedPath)}
                style={({ pressed }) => [
                  styles.shareButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.shareButtonText}>Share Certificate</Text>
              </Pressable>
            </View>
          )}

          {/* Saved Certificates */}
          {savedCertificates.length > 0 && (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>Saved Certificates</Text>
              {savedCertificates.map((path, index) => {
                const fileName = path.split('/').pop() || '';
                const timestamp = fileName.match(/certificate_(\d+)/)?.[1];
                const date = timestamp
                  ? new Date(parseInt(timestamp)).toLocaleDateString()
                  : 'Unknown';

                return (
                  <View key={path} style={styles.savedItem}>
                    <View style={styles.savedInfo}>
                      <Text style={styles.savedIcon}>📜</Text>
                      <View>
                        <Text style={styles.savedName}>Certificate #{index + 1}</Text>
                        <Text style={styles.savedDate}>{date}</Text>
                      </View>
                    </View>
                    <View style={styles.savedActions}>
                      <Pressable
                        onPress={() => handleShare(path)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>Share</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(path)}
                        style={[styles.actionButton, styles.deleteButton]}
                      >
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Stats Summary */}
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Your Achievement Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.modulesCompleted}</Text>
                <Text style={styles.statLabel}>Modules</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(stats.timeSpent / 60)}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.accuracy}%</Text>
                <Text style={styles.statLabel}>Accuracy</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{tutorialService.getEarnedBadges().length}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#94a3b8',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Progress Card
  progressCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  progressIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0ea5e9',
    borderRadius: 4,
  },
  progressCount: {
    fontSize: 12,
    color: '#64748b',
  },
  // Generate Card
  generateCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#22c55e',
  },
  generateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  generateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
  },
  generateText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  nameInput: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#f8fafc',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  generateButton: {
    backgroundColor: '#22c55e',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Preview Card
  previewCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
    marginBottom: 16,
    textAlign: 'center',
  },
  certificatePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
  },
  previewDate: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  shareButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Saved Section
  savedSection: {
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 12,
  },
  savedItem: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savedIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  savedName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
  },
  savedDate: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  savedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
  // Stats Card
  statsCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0ea5e9',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
});
