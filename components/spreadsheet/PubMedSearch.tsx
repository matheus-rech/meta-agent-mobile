/**
 * PubMedSearch Component
 * 
 * Search PubMed and CrossRef for study metadata and auto-fill spreadsheet rows.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';
import { BOX } from '@/constants/ascii-art';
import { searchPubMed, searchCrossRef, type StudyMetadata } from '@/lib/literature-search';

interface PubMedSearchProps {
  visible: boolean;
  onClose: () => void;
  onImport: (studies: StudyMetadata[]) => void;
}

type SearchSource = 'pubmed' | 'crossref' | 'both';

export function PubMedSearch({
  visible,
  onClose,
  onImport,
}: PubMedSearchProps) {
  const colors = useColors();
  
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SearchSource>('both');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<StudyMetadata[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResults([]);
    setSelectedIds(new Set());
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      const allResults: StudyMetadata[] = [];
      
      // Check if query is a PMID (numeric) or DOI (contains /)
      const isPMID = /^\d+$/.test(query.trim());
      const isDOI = query.includes('/');
      
      if (source === 'pubmed' || source === 'both') {
        const pubmedResults = await searchPubMed(query, isPMID ? 'pmid' : 'query');
        allResults.push(...pubmedResults);
      }
      
      if (source === 'crossref' || source === 'both') {
        const crossrefResults = await searchCrossRef(query, isDOI ? 'doi' : 'query');
        allResults.push(...crossrefResults);
      }
      
      // Deduplicate by DOI or title
      const seen = new Set<string>();
      const uniqueResults = allResults.filter(r => {
        const key = r.doi || r.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      setResults(uniqueResults);
      
      if (uniqueResults.length === 0) {
        setError('No results found. Try a different search term.');
      }
    } catch (err) {
      console.error('[PubMedSearch] Error:', err);
      setError('Search failed. Please check your connection and try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, source]);
  
  const toggleSelection = useCallback((id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (selectedIds.size === results.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(results.map(r => r.id)));
    }
  }, [results, selectedIds.size]);
  
  const handleImport = useCallback(() => {
    const selectedStudies = results.filter(r => selectedIds.has(r.id));
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    onImport(selectedStudies);
    onClose();
  }, [results, selectedIds, onImport, onClose]);
  
  const formatAuthors = (authors: string[]): string => {
    if (authors.length === 0) return 'Unknown';
    if (authors.length === 1) return authors[0];
    if (authors.length === 2) return authors.join(' & ');
    return `${authors[0]} et al.`;
  };
  
  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      color: colors.muted,
      fontSize: 20,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    tuiTitle: {
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
      fontSize: 10,
      textAlign: 'center',
      paddingVertical: 8,
      color: colors.border,
    },
    searchSection: {
      padding: 16,
    },
    searchRow: {
      flexDirection: 'row',
      gap: 8,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.foreground,
      fontSize: 14,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    searchButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
    },
    searchButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    sourceRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },
    sourceButton: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    sourceButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sourceButtonText: {
      fontSize: 12,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    sourceButtonTextActive: {
      color: colors.background,
    },
    helpText: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 8,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultsSection: {
      flex: 1,
      padding: 16,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    resultsCount: {
      fontSize: 12,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    selectAllButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectAllText: {
      fontSize: 11,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultsList: {
      flex: 1,
    },
    resultItem: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    resultTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
      marginRight: 8,
    },
    resultCheckbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    resultCheckboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      color: colors.background,
      fontSize: 12,
      fontWeight: 'bold',
    },
    resultMeta: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 4,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultSource: {
      fontSize: 10,
      color: colors.primary,
      marginTop: 4,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 12,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    errorContainer: {
      padding: 16,
      backgroundColor: colors.error + '15',
      borderRadius: 8,
      marginBottom: 12,
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cancelButton: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      color: colors.foreground,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    importButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    importButtonDisabled: {
      opacity: 0.5,
    },
    importButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
  });
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.container}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>🔍 Literature Search</Text>
            <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
              <Text style={dynamicStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* TUI Title */}
          <Text style={dynamicStyles.tuiTitle}>
            {BOX.topLeft}{BOX.horizontal}{' PubMed & CrossRef '}{BOX.horizontal.repeat(10)}{BOX.topRight}
          </Text>
          
          {/* Search Section */}
          <View style={dynamicStyles.searchSection}>
            <View style={dynamicStyles.searchRow}>
              <TextInput
                style={dynamicStyles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Enter PMID, DOI, or search terms..."
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={dynamicStyles.searchButton}
                onPress={handleSearch}
                disabled={isSearching || !query.trim()}
              >
                <Text style={dynamicStyles.searchButtonText}>
                  {isSearching ? '...' : 'Search'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Source Selection */}
            <View style={dynamicStyles.sourceRow}>
              {(['pubmed', 'crossref', 'both'] as SearchSource[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    dynamicStyles.sourceButton,
                    source === s && dynamicStyles.sourceButtonActive,
                  ]}
                  onPress={() => setSource(s)}
                >
                  <Text style={[
                    dynamicStyles.sourceButtonText,
                    source === s && dynamicStyles.sourceButtonTextActive,
                  ]}>
                    {s === 'pubmed' ? 'PubMed' : s === 'crossref' ? 'CrossRef' : 'Both'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={dynamicStyles.helpText}>
              Tip: Enter PMID (e.g., 12345678) or DOI (e.g., 10.1000/xyz123) for direct lookup
            </Text>
          </View>
          
          {/* Results Section */}
          <View style={dynamicStyles.resultsSection}>
            {error && (
              <View style={dynamicStyles.errorContainer}>
                <Text style={dynamicStyles.errorText}>{error}</Text>
              </View>
            )}
            
            {isSearching ? (
              <View style={dynamicStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={dynamicStyles.loadingText}>Searching databases...</Text>
              </View>
            ) : results.length > 0 ? (
              <>
                <View style={dynamicStyles.resultsHeader}>
                  <Text style={dynamicStyles.resultsCount}>
                    {results.length} result{results.length !== 1 ? 's' : ''} • {selectedIds.size} selected
                  </Text>
                  <TouchableOpacity style={dynamicStyles.selectAllButton} onPress={selectAll}>
                    <Text style={dynamicStyles.selectAllText}>
                      {selectedIds.size === results.length ? 'Deselect All' : 'Select All'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={dynamicStyles.resultsList}>
                  {results.map(result => (
                    <TouchableOpacity
                      key={result.id}
                      style={[
                        dynamicStyles.resultItem,
                        selectedIds.has(result.id) && dynamicStyles.resultItemSelected,
                      ]}
                      onPress={() => toggleSelection(result.id)}
                      activeOpacity={0.7}
                    >
                      <View style={dynamicStyles.resultHeader}>
                        <Text style={dynamicStyles.resultTitle} numberOfLines={2}>
                          {result.title}
                        </Text>
                        <View style={[
                          dynamicStyles.resultCheckbox,
                          selectedIds.has(result.id) && dynamicStyles.resultCheckboxSelected,
                        ]}>
                          {selectedIds.has(result.id) && (
                            <Text style={dynamicStyles.checkmark}>✓</Text>
                          )}
                        </View>
                      </View>
                      <Text style={dynamicStyles.resultMeta}>
                        {formatAuthors(result.authors)} ({result.year || 'N/A'})
                      </Text>
                      <Text style={dynamicStyles.resultMeta} numberOfLines={1}>
                        {result.journal || 'Unknown Journal'}
                      </Text>
                      <Text style={dynamicStyles.resultSource}>
                        {result.source} {result.pmid ? `• PMID: ${result.pmid}` : ''} {result.doi ? `• DOI: ${result.doi}` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={dynamicStyles.emptyContainer}>
                <Text style={dynamicStyles.emptyText}>
                  Search PubMed and CrossRef to find study metadata.{'\n\n'}
                  Results will auto-fill your spreadsheet with:{'\n'}
                  • Authors • Year • Journal • Sample size
                </Text>
              </View>
            )}
          </View>
          
          {/* Footer */}
          <View style={dynamicStyles.footer}>
            <TouchableOpacity style={dynamicStyles.cancelButton} onPress={onClose}>
              <Text style={dynamicStyles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.importButton,
                selectedIds.size === 0 && dynamicStyles.importButtonDisabled,
              ]}
              onPress={handleImport}
              disabled={selectedIds.size === 0}
            >
              <Text style={dynamicStyles.importButtonText}>
                Import {selectedIds.size} {selectedIds.size === 1 ? 'Study' : 'Studies'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default PubMedSearch;
