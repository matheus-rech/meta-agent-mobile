/**
 * API Keys Settings Screen
 * 
 * Allows users to configure their own API keys for various LLM providers.
 * Keys are stored securely using expo-secure-store.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  apiKeyManager,
  PROVIDERS,
  validateProviderKey,
  type LLMProvider,
  type StoredAPIKey,
  type ProviderConfig,
} from '@/lib/api-keys';

export default function APIKeysScreen() {
  const colors = useColors();
  const [keys, setKeys] = useState<Map<LLMProvider, StoredAPIKey>>(new Map());
  const [expandedProvider, setExpandedProvider] = useState<LLMProvider | null>(null);
  const [editingKey, setEditingKey] = useState<string>('');
  const [validating, setValidating] = useState<LLMProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load keys on mount
  useEffect(() => {
    loadKeys();
    
    const unsubscribe = apiKeyManager.subscribe((newKeys) => {
      setKeys(newKeys);
    });
    
    return unsubscribe;
  }, []);

  const loadKeys = async () => {
    setIsLoading(true);
    await apiKeyManager.initialize();
    const allKeys = await apiKeyManager.getAllKeys();
    setKeys(allKeys);
    setIsLoading(false);
  };

  const handleProviderPress = (provider: LLMProvider) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (expandedProvider === provider) {
      setExpandedProvider(null);
      setEditingKey('');
    } else {
      setExpandedProvider(provider);
      const existing = keys.get(provider);
      setEditingKey(existing ? maskKey(existing.key) : '');
    }
  };

  const maskKey = (key: string): string => {
    if (key.length <= 8) return '••••••••';
    return key.slice(0, 4) + '••••••••' + key.slice(-4);
  };

  const handleSaveKey = async (provider: LLMProvider) => {
    const trimmedKey = editingKey.trim();
    
    // If the key looks masked, don't save it
    if (trimmedKey.includes('••••')) {
      setExpandedProvider(null);
      return;
    }

    if (!trimmedKey) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Validate the key
    setValidating(provider);
    const isValid = await validateProviderKey(provider, trimmedKey);
    setValidating(null);

    if (!isValid) {
      Alert.alert(
        'Invalid API Key',
        `The API key could not be validated. Please check that it's correct and try again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Save Anyway', 
            onPress: () => saveKey(provider, trimmedKey, false) 
          },
        ]
      );
      return;
    }

    await saveKey(provider, trimmedKey, true);
  };

  const saveKey = async (provider: LLMProvider, key: string, isValid: boolean) => {
    const result = await apiKeyManager.saveKey(provider, key);
    
    if (result.success) {
      await apiKeyManager.setKeyValidation(provider, isValid);
      setExpandedProvider(null);
      setEditingKey('');
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to save API key');
    }
  };

  const handleDeleteKey = (provider: LLMProvider) => {
    Alert.alert(
      'Delete API Key',
      `Are you sure you want to delete your ${PROVIDERS[provider].name} API key?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await apiKeyManager.deleteKey(provider);
            setExpandedProvider(null);
            setEditingKey('');
            
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  };

  const handleOpenDocs = (url: string) => {
    Linking.openURL(url);
  };

  const renderProviderCard = (config: ProviderConfig) => {
    const stored = keys.get(config.id);
    const isExpanded = expandedProvider === config.id;
    const isValidating = validating === config.id;

    return (
      <View
        key={config.id}
        style={[
          styles.providerCard,
          {
            backgroundColor: colors.surface,
            borderColor: stored ? colors.success : colors.border,
            borderWidth: stored ? 2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => handleProviderPress(config.id)}
          style={styles.providerHeader}
          activeOpacity={0.7}
        >
          <View style={styles.providerInfo}>
            <Text style={styles.providerIcon}>{config.icon}</Text>
            <View style={styles.providerText}>
              <Text style={[styles.providerName, { color: colors.foreground }]}>
                {config.name}
              </Text>
              <Text style={[styles.providerDescription, { color: colors.muted }]}>
                {config.description}
              </Text>
            </View>
          </View>
          
          <View style={styles.providerStatus}>
            {stored && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: stored.isValid ? colors.success + '20' : colors.warning + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: stored.isValid ? colors.success : colors.warning },
                  ]}
                >
                  {stored.isValid ? 'Active' : 'Unverified'}
                </Text>
              </View>
            )}
            <IconSymbol
              name="chevron.right"
              size={20}
              color={colors.muted}
              style={{
                transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
              }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.expandedContent, { borderTopColor: colors.border }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                API Key
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                value={editingKey}
                onChangeText={setEditingKey}
                placeholder={`Enter your ${config.name} API key`}
                placeholderTextColor={colors.muted}
                secureTextEntry={!editingKey.includes('••••')}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => handleOpenDocs(config.docsUrl)}
                style={styles.docsLink}
              >
                <Text style={[styles.docsLinkText, { color: colors.primary }]}>
                  Get your API key →
                </Text>
              </TouchableOpacity>
            </View>

            {/* Model Selection */}
            <View style={styles.modelsSection}>
              <Text style={[styles.inputLabel, { color: colors.foreground }]}>
                Default Model
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.modelsScroll}
              >
                {config.models.map((model) => {
                  const isSelected = stored?.selectedModel === model.id || 
                    (!stored?.selectedModel && model.isDefault);
                  
                  return (
                    <TouchableOpacity
                      key={model.id}
                      onPress={async () => {
                        if (stored) {
                          await apiKeyManager.updateSelectedModel(config.id, model.id);
                        }
                      }}
                      style={[
                        styles.modelChip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modelChipText,
                          { color: isSelected ? colors.background : colors.foreground },
                        ]}
                      >
                        {model.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {stored && (
                <TouchableOpacity
                  onPress={() => handleDeleteKey(config.id)}
                  style={[styles.deleteButton, { borderColor: colors.error }]}
                >
                  <Text style={[styles.deleteButtonText, { color: colors.error }]}>
                    Delete Key
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={() => handleSaveKey(config.id)}
                disabled={isValidating}
                style={[
                  styles.saveButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isValidating ? 0.7 : 1,
                  },
                ]}
              >
                {isValidating ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.background }]}>
                    {stored ? 'Update Key' : 'Save Key'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            API Keys
          </Text>
        </View>

        {/* Info Banner */}
        <View
          style={[
            styles.infoBanner,
            { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' },
          ]}
        >
          <Text style={styles.infoIcon}>🔐</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.foreground }]}>
              Bring Your Own Key (BYOK)
            </Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Add your own API keys to use cloud AI providers. Keys are stored securely on your device and never sent to our servers.
            </Text>
          </View>
        </View>

        {/* Provider Cards */}
        <View style={styles.providersSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Cloud Providers
          </Text>
          {Object.values(PROVIDERS).map(renderProviderCard)}
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Your API keys are stored locally using encrypted storage. They are only used to make requests directly to the provider APIs.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  providersSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  providerCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  providerIcon: {
    fontSize: 28,
  },
  providerText: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  providerDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  providerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expandedContent: {
    padding: 16,
    borderTopWidth: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Courier New',
    }),
  },
  docsLink: {
    marginTop: 8,
  },
  docsLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modelsSection: {
    marginBottom: 16,
  },
  modelsScroll: {
    marginTop: 8,
  },
  modelChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  modelChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
