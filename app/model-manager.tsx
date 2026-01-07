/**
 * Model Manager Screen
 * 
 * Allows users to download, manage, and select open source on-device LLM models.
 * Emphasizes the open source nature, privacy benefits, and offline capabilities.
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
  Linking,
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
  onLicensePress: () => void;
}

function ModelCard({
  model,
  state,
  isSelected,
  onDownload,
  onPrepare,
  onDelete,
  onSelect,
  onLicensePress,
}: ModelCardProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  
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
      case 'preparing': return 'Loading...';
      case 'ready': return 'Ready to Use';
      case 'error': return `Error: ${state.error}`;
    }
  };
  
  const getLicenseColor = () => {
    switch (model.license) {
      case 'MIT':
      case 'Apache 2.0':
        return colors.success;
      default:
        return colors.primary;
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
            <Text style={[styles.progressText, { color: colors.muted }]}>
              {state.progress}%
            </Text>
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
                styles.smallButton,
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
                styles.smallButton,
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
        isSelected && { borderColor: colors.success, borderWidth: 2 },
      ]}
    >
      {/* Header with badges */}
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleSection}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {model.name}
          </Text>
          <Text style={[styles.creatorText, { color: colors.muted }]}>
            by {model.creator}
          </Text>
        </View>
        <View style={styles.badgeRow}>
          {model.isOpenSource && (
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Text style={styles.badgeText}>Open Source</Text>
            </View>
          )}
          {model.recommended && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>Recommended</Text>
            </View>
          )}
          {isSelected && (
            <View style={[styles.badge, { backgroundColor: '#22C55E' }]}>
              <Text style={styles.badgeText}>Active</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* License badge */}
      <Pressable 
        style={styles.licenseRow}
        onPress={onLicensePress}
      >
        <View style={[styles.licenseBadge, { backgroundColor: getLicenseColor() + '20', borderColor: getLicenseColor() }]}>
          <Text style={[styles.licenseText, { color: getLicenseColor() }]}>
            {model.license}
          </Text>
        </View>
        <Text style={[styles.sizeText, { color: colors.muted }]}>{model.size}</Text>
      </Pressable>
      
      {/* Description */}
      <Text style={[styles.cardDescription, { color: colors.foreground }]}>
        {model.description}
      </Text>
      
      {/* Expandable details */}
      <Pressable 
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
      >
        <Text style={[styles.expandText, { color: colors.primary }]}>
          {expanded ? 'Show Less' : 'Learn More'}
        </Text>
      </Pressable>
      
      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={[styles.detailedDescription, { color: colors.muted }]}>
            {model.detailedDescription}
          </Text>
          
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Capabilities
          </Text>
          <View style={styles.tagContainer}>
            {model.capabilities.map((cap, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{cap}</Text>
              </View>
            ))}
          </View>
          
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Best For
          </Text>
          <View style={styles.tagContainer}>
            {model.bestFor.map((use, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.tagText, { color: colors.success }]}>{use}</Text>
              </View>
            ))}
          </View>
          
          <Text style={[styles.requirementText, { color: colors.warning }]}>
            Requires {model.minMemoryGB}GB+ RAM
          </Text>
        </View>
      )}
      
      {/* Status and action */}
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
  const [storageUsage, setStorageUsage] = useState<{ total: number; byModel: Record<MLCModelId, number> }>({ total: 0, byModel: {} as Record<MLCModelId, number> });
  const [isAvailable, setIsAvailable] = useState(true);
  
  const mlcService = getMLCLLMService();
  
  useEffect(() => {
    setModels(mlcService.getAvailableModels());
    setModelStates(mlcService.getAllModelStates());
    setSelectedModel(mlcService.getSelectedModel());
    setIsAvailable(mlcService.isAvailable());
    
    const unsubscribe = mlcService.subscribe((states) => {
      setModelStates(states);
      setSelectedModel(mlcService.getSelectedModel());
    });
    
    mlcService.getStorageUsage().then(setStorageUsage);
    
    return unsubscribe;
  }, []);
  
  const handleDownload = useCallback(async (modelId: MLCModelId) => {
    await mlcService.downloadModel(modelId);
    const usage = await mlcService.getStorageUsage();
    setStorageUsage(usage);
  }, [mlcService]);
  
  const handlePrepare = useCallback(async (modelId: MLCModelId) => {
    await mlcService.prepareModel(modelId);
  }, [mlcService]);
  
  const handleDelete = useCallback(async (modelId: MLCModelId) => {
    const model = MLC_MODELS[modelId];
    Alert.alert(
      'Delete Model',
      `Are you sure you want to delete ${model.name}? You will need to download it again to use it.`,
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
  
  const handleLicensePress = useCallback((url: string) => {
    Linking.openURL(url);
  }, []);
  
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
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            Open Source AI Models
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
            Download and run AI completely offline on your device
          </Text>
        </View>
        
        {/* Privacy Banner */}
        <View style={[styles.privacyBanner, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
          <Text style={[styles.privacyTitle, { color: colors.success }]}>
            100% Private
          </Text>
          <Text style={[styles.privacyText, { color: colors.foreground }]}>
            Your data never leaves your device. All AI processing happens locally - no internet required, no data sent to servers.
          </Text>
        </View>
        
        <OfflineIndicator expanded style={styles.indicator} />
        
        {/* Storage Card */}
        <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.storageRow}>
            <Text style={[styles.storageLabel, { color: colors.muted }]}>Storage Used</Text>
            <Text style={[styles.storageValue, { color: colors.primary }]}>
              {formatBytes(storageUsage.total)}
            </Text>
          </View>
        </View>
        
        {/* Model List */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionHeaderTitle, { color: colors.foreground }]}>
            Available Models
          </Text>
          <Text style={[styles.sectionHeaderSubtitle, { color: colors.muted }]}>
            All models are open source and free to use
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
              onLicensePress={() => handleLicensePress(model.licenseUrl)}
            />
          ))}
        </View>
        
        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>
            Why Open Source?
          </Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoItemTitle, { color: colors.primary }]}>Transparency</Text>
            <Text style={[styles.infoItemText, { color: colors.muted }]}>
              Open source models have publicly available weights and training details. You can verify exactly what the model does.
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoItemTitle, { color: colors.primary }]}>Privacy</Text>
            <Text style={[styles.infoItemText, { color: colors.muted }]}>
              Run AI entirely on your device. Your research data, patient information, and queries stay completely private.
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoItemTitle, { color: colors.primary }]}>No Subscription</Text>
            <Text style={[styles.infoItemText, { color: colors.muted }]}>
              These models are free forever. No API costs, no monthly fees, no usage limits.
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={[styles.infoItemTitle, { color: colors.primary }]}>Offline Access</Text>
            <Text style={[styles.infoItemText, { color: colors.muted }]}>
              Once downloaded, use AI anywhere - on a plane, in a remote location, or when your internet is down.
            </Text>
          </View>
        </View>
        
        {/* Note */}
        <Text style={[styles.noteText, { color: colors.muted }]}>
          Note: On-device models are optimized for mobile but may provide less detailed responses than cloud-based AI. For complex analysis, cloud AI is recommended when available.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  heroSection: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  privacyBanner: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  indicator: {
    marginBottom: 16,
  },
  storageCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storageLabel: {
    fontSize: 14,
  },
  storageValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeaderSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  modelList: {
    gap: 16,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleSection: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  creatorText: {
    fontSize: 12,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  licenseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  licenseText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sizeText: {
    fontSize: 12,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  expandButton: {
    paddingVertical: 8,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
  },
  detailedDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  requirementText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
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
    borderRadius: 16,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 14,
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoItemText: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
