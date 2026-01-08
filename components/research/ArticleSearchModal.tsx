/**
 * ArticleSearchModal Component
 * 
 * Modal for searching PubMed and CrossRef to import article metadata.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useColors } from '../../hooks/use-colors';
import {
  pubmedService,
  crossrefService,
  isDOI,
  type PubMedArticle,
  type CrossRefArticle,
} from '../../lib/research';

type Article = PubMedArticle | CrossRefArticle;

interface ArticleSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onImport: (articles: Record<string, string>[]) => void;
}

type SearchSource = 'auto' | 'pubmed' | 'crossref';

export function ArticleSearchModal({
  visible,
  onClose,
  onImport,
}: ArticleSearchModalProps) {
  const colors = useColors();
  
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<SearchSource>('auto');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setError(null);
    setResults([]);
    setSelected(new Set());
    
    try {
      const trimmedQuery = query.trim();
      
      // Auto-detect source based on input
      let effectiveSource = source;
      if (source === 'auto') {
        if (isDOI(trimmedQuery)) {
          effectiveSource = 'crossref';
        } else if (/^\d+$/.test(trimmedQuery)) {
          effectiveSource = 'pubmed'; // Likely a PMID
        } else {
          effectiveSource = 'pubmed'; // Default to PubMed for text queries
        }
      }
      
      if (effectiveSource === 'crossref') {
        if (isDOI(trimmedQuery)) {
          // Single DOI lookup
          const article = await crossrefService.fetchByDOI(trimmedQuery);
          if (article) {
            setResults([article]);
            setTotalResults(1);
          } else {
            setError('DOI not found');
          }
        } else {
          // CrossRef search
          const result = await crossrefService.search(trimmedQuery, 20);
          setResults(result.articles);
          setTotalResults(result.totalResults);
        }
      } else {
        // Check if it's a PMID or list of PMIDs
        const pmidPattern = /^\d+(,\s*\d+)*$/;
        if (pmidPattern.test(trimmedQuery)) {
          const pmids = trimmedQuery.split(/,\s*/).filter(Boolean);
          const articles = await pubmedService.fetchByPMID(pmids);
          setResults(articles);
          setTotalResults(articles.length);
        } else {
          // PubMed search
          const result = await pubmedService.search(trimmedQuery, 20);
          setResults(result.articles);
          setTotalResults(result.count);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [query, source]);
  
  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
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
    const allIds = results.map(a => 'pmid' in a ? a.pmid : a.doi);
    setSelected(new Set(allIds));
  }, [results]);
  
  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);
  
  const handleImport = useCallback(() => {
    const selectedArticles = results.filter(a => {
      const id = 'pmid' in a ? a.pmid : a.doi;
      return selected.has(id);
    });
    
    const rows = selectedArticles.map(article => {
      if ('pmid' in article) {
        return pubmedService.articleToRow(article);
      } else {
        return crossrefService.articleToRow(article);
      }
    });
    
    onImport(rows);
    onClose();
  }, [results, selected, onImport, onClose]);
  
  const dynamicStyles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 12,
      width: Platform.OS === 'web' ? 600 : '95%',
      maxHeight: '90%',
      borderWidth: 1,
      borderColor: colors.primary,
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
    searchSection: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
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
      padding: 8,
      borderRadius: 6,
      borderWidth: 1,
      alignItems: 'center',
    },
    sourceButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    sourceButtonInactive: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    sourceButtonText: {
      fontSize: 12,
      fontWeight: '600',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    sourceButtonTextActive: {
      color: colors.background,
    },
    sourceButtonTextInactive: {
      color: colors.foreground,
    },
    helpText: {
      fontSize: 11,
      color: colors.muted,
      marginTop: 8,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultsSection: {
      flex: 1,
      maxHeight: 400,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    resultsCount: {
      fontSize: 12,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    selectButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    selectButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: colors.border,
    },
    selectButtonText: {
      fontSize: 11,
      color: colors.foreground,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultsList: {
      padding: 8,
    },
    resultItem: {
      flexDirection: 'row',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
    },
    resultItemSelected: {
      backgroundColor: `${colors.primary}20`,
      borderColor: colors.primary,
    },
    resultItemUnselected: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxUnselected: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    checkmark: {
      color: colors.background,
      fontSize: 12,
      fontWeight: 'bold',
    },
    resultContent: {
      flex: 1,
    },
    resultTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 4,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultAuthors: {
      fontSize: 11,
      color: colors.muted,
      marginBottom: 2,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    resultMeta: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.muted,
      textAlign: 'center',
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      textAlign: 'center',
      padding: 16,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    selectedCount: {
      fontSize: 12,
      color: colors.muted,
      fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    },
    importButton: {
      backgroundColor: colors.success,
      paddingHorizontal: 20,
      paddingVertical: 10,
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
  
  const renderArticle = (article: Article) => {
    const id = 'pmid' in article ? article.pmid : article.doi;
    const isSelected = selected.has(id);
    const isPubMed = 'pmid' in article;
    
    return (
      <TouchableOpacity
        key={id}
        style={[
          dynamicStyles.resultItem,
          isSelected ? dynamicStyles.resultItemSelected : dynamicStyles.resultItemUnselected,
        ]}
        onPress={() => toggleSelect(id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            dynamicStyles.checkbox,
            isSelected ? dynamicStyles.checkboxSelected : dynamicStyles.checkboxUnselected,
          ]}
        >
          {isSelected && <Text style={dynamicStyles.checkmark}>✓</Text>}
        </View>
        <View style={dynamicStyles.resultContent}>
          <Text style={dynamicStyles.resultTitle} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={dynamicStyles.resultAuthors} numberOfLines={1}>
            {article.authors.slice(0, 3).join(', ')}
            {article.authors.length > 3 ? ', et al.' : ''}
          </Text>
          <Text style={dynamicStyles.resultMeta}>
            {article.journalAbbrev} {article.year} • {isPubMed ? `PMID: ${(article as PubMedArticle).pmid}` : `DOI: ${(article as CrossRefArticle).doi}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.modalOverlay}>
        <View style={dynamicStyles.modalContent}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.headerTitle}>🔍 Search Articles</Text>
            <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
              <Text style={dynamicStyles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Section */}
          <View style={dynamicStyles.searchSection}>
            <View style={dynamicStyles.searchRow}>
              <TextInput
                style={dynamicStyles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Enter PMID, DOI, or search terms..."
                placeholderTextColor={colors.muted}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={dynamicStyles.searchButton}
                onPress={handleSearch}
                disabled={isSearching || !query.trim()}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={dynamicStyles.searchButtonText}>Search</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Source Selection */}
            <View style={dynamicStyles.sourceRow}>
              {(['auto', 'pubmed', 'crossref'] as SearchSource[]).map(s => (
                <TouchableOpacity
                  key={s}
                  style={[
                    dynamicStyles.sourceButton,
                    source === s ? dynamicStyles.sourceButtonActive : dynamicStyles.sourceButtonInactive,
                  ]}
                  onPress={() => setSource(s)}
                >
                  <Text
                    style={[
                      dynamicStyles.sourceButtonText,
                      source === s ? dynamicStyles.sourceButtonTextActive : dynamicStyles.sourceButtonTextInactive,
                    ]}
                  >
                    {s === 'auto' ? 'Auto' : s === 'pubmed' ? 'PubMed' : 'CrossRef'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={dynamicStyles.helpText}>
              Enter PMIDs (e.g., 12345678), DOIs (e.g., 10.1000/xyz), or search by title/author
            </Text>
          </View>
          
          {/* Results Section */}
          <View style={dynamicStyles.resultsSection}>
            {error ? (
              <Text style={dynamicStyles.errorText}>{error}</Text>
            ) : results.length > 0 ? (
              <>
                <View style={dynamicStyles.resultsHeader}>
                  <Text style={dynamicStyles.resultsCount}>
                    {totalResults > results.length 
                      ? `Showing ${results.length} of ${totalResults} results`
                      : `${results.length} result${results.length !== 1 ? 's' : ''}`}
                  </Text>
                  <View style={dynamicStyles.selectButtons}>
                    <TouchableOpacity style={dynamicStyles.selectButton} onPress={selectAll}>
                      <Text style={dynamicStyles.selectButtonText}>Select All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={dynamicStyles.selectButton} onPress={clearSelection}>
                      <Text style={dynamicStyles.selectButtonText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView style={dynamicStyles.resultsList}>
                  {results.map(renderArticle)}
                </ScrollView>
              </>
            ) : (
              <View style={dynamicStyles.emptyState}>
                <Text style={dynamicStyles.emptyText}>
                  {isSearching 
                    ? 'Searching...' 
                    : 'Search PubMed or CrossRef to find articles'}
                </Text>
              </View>
            )}
          </View>
          
          {/* Footer */}
          <View style={dynamicStyles.footer}>
            <Text style={dynamicStyles.selectedCount}>
              {selected.size} article{selected.size !== 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity
              style={[
                dynamicStyles.importButton,
                selected.size === 0 && dynamicStyles.importButtonDisabled,
              ]}
              onPress={handleImport}
              disabled={selected.size === 0}
            >
              <Text style={dynamicStyles.importButtonText}>
                Import Selected
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default ArticleSearchModal;
