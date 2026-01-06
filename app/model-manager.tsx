/**
 * Model Manager Screen
 * 
 * Allows users to download, manage, and select on-device LLM models.
 * Shows model information, download progress, and storage usage.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { OfflineIndicator } from '@/components/offline-indicator';
import {
  getMLCLLMService,
  MLC_MODELS,
  MLCModelInfo,
  MLCModelState,
  MLCModelId,
} from '@/lib/llm/mlc-llm-service';

interface ModelCardProps {
  model: MLCModelInfo;
  state: MLCModelState;
  isSelected: boolean;
  onDownload: () => void;
  onPrepare: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

function ModelCard({
  model,
  state,
  isSelected,
  onDownload,
  onPrepare,
  onDelete,
  onSelect,
}: ModelCardProps) {
  const colors = useColors();
  
  const getStatusColor = () => {
    switch (state.status) {
      case 'ready': return colors.success;
      case 'downloading':
      case 'preparing': return colors.warning;
      case 'error': return colors.error;
      default: return colors.muted;
    }
  };
  
  const getStatusText = () => {
    switch (state.status) {
      case 'not-downloaded': return 'Not Downloaded';
      case 'downloading': return `Downloading ${state.progress}%`;
      case 'downloaded': return 'Downloaded';
      case 'preparing': return 'Preparing...';
      case 'ready': return 'Ready';
      case 'error': return `Error: ${state.error}`;
    }
  };
  
  const renderAction = () => {
    switch (state.status) {
      case 'not-downloaded':
        return (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={onDownload}
          >
            <Text style={styles.actionButtonText}>Download</Text>
          </Pressable>
        );
      case 'downloading':
        return (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: colors.primary, width: `${state.progress}%` },
                ]}
              />
            </View>
          </View>
        );
      case 'downloaded':
        return (
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={onPrepare}
            >
              <Text style={styles.actionButtonText}>Activate</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={onDelete}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </Pressable>
          </View>
        );
      case 'preparing':
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Loading model...
            </Text>
          </View>
        );
      case 'ready':
        return (
          <View style={styles.actionRow}>
            {!isSelected && (
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={onSelect}
              >
                <Text style={styles.actionButtonText}>Select</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.deleteButton,
                { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={onDelete}
            >
              <Text style={styles.actionButtonText}>Delete</Text>
            </Pressable>
          </View>
        );
      case 'error':
        return (
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.warning, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={onDownload}
          >
            <Text style={styles.actionButtonText}>Retry</Text>
          </Pressable>
        );
    }
  };
  
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isSelected && { borderColor: colors.primary, borderWidth: 2 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {model.name}
          </Text>
          {model.recommended && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Recommended</Text>
            </View>
          )}
          {isSelected && (
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          )}
        </View>
        <Text style={[styles.cardSize, { color: colors.muted }]}>{model.size}</Text>
      </View>
      
      <Text style={[styles.cardDescription, { color: colors.muted }]}>
        {model.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
        {renderAction()}
      </View>
    </View>
  );
}

export default function ModelManagerScreen() {
  const colors = useColors();
  const [models, setModels] = useState<MLCModelInfo[]>([]);
  const [modelStates, setModelStates] = useState<Map<MLCModelId, MLCModelState>>(new Map());
  const [selectedModel, setSelectedModel] = useState<MLCModelId | null>(null);
  const [storageUsage, setStorageUsage] = useState<{ total: number; byModel: Record<MLCModelId, number> }>({ total: 0, byModel: {} as any });
  const [isAvailable, setIsAvailable] = useState(true);
  
  const mlcService = getMLCLLMService();
  
  // Load initial data
  useEffect(() => {
    setModels(mlcService.getAvailableModels());
    setModelStates(mlcService.getAllModelStates());
    setSelectedModel(mlcService.getSelectedModel());
    setIsAvailable(mlcService.isAvailable());
    
    // Subscribe to state changes
    const unsubscribe = mlcService.subscribe((states) => {
      setModelStates(states);
      setSelectedModel(mlcService.getSelectedModel());
    });
    
    // Update storage usage
    mlcService.getStorageUsage().then(setStorageUsage);
    
    return unsubscribe;
  }, []);
  
  const handleDownload = useCallback(async (modelId: MLCModelId) => {
    await mlcService.downloadModel(modelId, (progress) => {
      // Progress is handled via subscription
    });
    const usage = await mlcService.getStorageUsage();
    setStorageUsage(usage);
  }, [mlcService]);
  
  const handlePrepare = useCallback(async (modelId: MLCModelId) => {
    await mlcService.prepareModel(modelId);
  }, [mlcService]);
  
  const handleDelete = useCallback(async (modelId: MLCModelId) => {
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${MLC_MODELS[modelId].name}? You will need to download it again to use it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await mlcService.deleteModel(modelId);
            const usage = await mlcService.getStorageUsage();
            setStorageUsage(usage);
          },
        },
      ]
    );
  }, [mlcService]);
  
  const handleSelect = useCallback(async (modelId: MLCModelId) => {
    await mlcService.prepareModel(modelId);
  }, [mlcService]);
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };
  
  if (!isAvailable) {
    return (
      <ScreenContainer className="flex-1 bg-background">
        <View style={styles.unavailableContainer}>
          <Text style={[styles.unavailableIcon, { color: colors.warning }]}>⚠️</Text>
          <Text style={[styles.unavailableTitle, { color: colors.foreground }]}>
            On-Device AI Not Available
          </Text>
          <Text style={[styles.unavailableText, { color: colors.muted }]}>
            {Platform.OS === 'ios'
              ? 'On-device AI requires a physical iOS device. It is not available on the simulator.'
              : 'On-device AI is currently only available on iOS devices.'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }
  
  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            On-Device AI Models
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Download models to use AI offline without internet
          </Text>
        </View>
        
        <OfflineIndicator expanded style={styles.indicator} />
        
        <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.storageTitle, { color: colors.foreground }]}>
            Storage Used
          </Text>
          <Text style={[styles.storageValue, { color: colors.primary }]}>
            {formatBytes(storageUsage.total)}
          </Text>
        </View>
        
        <View style={styles.modelList}>
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              state={modelStates.get(model.id) || { modelId: model.id, status: 'not-downloaded', progress: 0 }}
              isSelected={selectedModel === model.id}
              onDownload={() => handleDownload(model.id)}
              onPrepare={() => handlePrepare(model.id)}
              onDelete={() => handleDelete(model.id)}
              onSelect={() => handleSelect(model.id)}
            />
          ))}
        </View>
        
        <View style={styles.infoSection}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            About On-Device AI
          </Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            On-device AI runs entirely on your device, providing:
          </Text>
          <View style={styles.infoList}>
            <Text style={[styles.infoItem, { color: colors.muted }]}>
              • Privacy: Your data never leaves your device
            </Text>
            <Text style={[styles.infoItem, { color: colors.muted }]}>
              • Offline: Works without internet connection
            </Text>
            <Text style={[styles.infoItem, { color: colors.muted }]}>
              • Speed: No network latency for responses
            </Text>
          </View>
          <Text style={[styles.infoNote, { color: colors.warning }]}>
            Note: On-device models are smaller than cloud models and may provide less detailed responses.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  indicator: {
    marginBottom: 16,
  },
  storageCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  storageTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  storageValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modelList: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSize: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButton: {
    paddingHorizontal: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    width: 100,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoList: {
    marginTop: 8,
    marginBottom: 12,
  },
  infoItem: {
    fontSize: 13,
    lineHeight: 20,
  },
  infoNote: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  unavailableIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  unavailableTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
