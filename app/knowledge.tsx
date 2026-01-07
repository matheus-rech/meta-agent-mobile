/**
 * Knowledge Base Browser Screen
 * 
 * Browse and search the bundled knowledge base containing:
 * - Cochrane Handbook chapters
 * - Seminal papers (DerSimonian-Laird, Higgins I², Egger)
 * - R documentation (metafor, meta packages)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useKnowledgeSearch, formatKnowledgeResults, type KnowledgeSearchResult } from '@/hooks/use-knowledge-search';
import { Ionicons } from '@expo/vector-icons';

// Category metadata
const CATEGORIES = [
  {
    id: 'cochrane',
    name: 'Cochrane Handbook',
    icon: '📖',
    description: 'Evidence synthesis methodology from the Cochrane Collaboration',
    color: '#2563EB',
  },
  {
    id: 'seminal',
    name: 'Seminal Papers',
    icon: '📜',
    description: 'Foundational papers in meta-analysis methodology',
    color: '#7C3AED',
  },
  {
    id: 'r-docs',
    name: 'R Documentation',
    icon: '💻',
    description: 'Package documentation for metafor, meta, and related tools',
    color: '#059669',
  },
];

export default function KnowledgeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { search, isLoading, isReady, error, stats } = useKnowledgeSearch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const results = await search(searchQuery);
    setSearchResults(results);
    setSelectedCategory(null);
  }, [searchQuery, search]);

  // Handle category selection
  const handleCategorySelect = useCallback(async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery('');
    
    // Search within category
    const results = await search(categoryId);
    setSearchResults(results.filter(r => r.category === categoryId));
  }, [search]);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedCategory(null);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.muted,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 44,
      fontSize: 16,
      color: colors.foreground,
    },
    clearButton: {
      padding: 4,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 12,
    },
    categoriesContainer: {
      paddingHorizontal: 16,
    },
    categoryCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryCardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    categoryIcon: {
      fontSize: 32,
      marginRight: 12,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 2,
    },
    categoryDescription: {
      fontSize: 13,
      color: colors.muted,
    },
    categoryCount: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    resultsContainer: {
      paddingHorizontal: 16,
      paddingBottom: 32,
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    resultIcon: {
      fontSize: 20,
      marginRight: 8,
    },
    resultTitle: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: colors.foreground,
    },
    resultScore: {
      backgroundColor: colors.success + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    resultScoreText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.success,
    },
    resultSource: {
      fontSize: 12,
      color: colors.muted,
      marginBottom: 8,
    },
    resultText: {
      fontSize: 14,
      color: colors.foreground,
      lineHeight: 20,
    },
    resultTextTruncated: {
      maxHeight: 80,
      overflow: 'hidden',
    },
    expandButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    expandButtonText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    resultActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    learnMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 4,
    },
    learnMoreText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '600',
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.muted,
    },
    emptyContainer: {
      padding: 32,
      alignItems: 'center',
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.muted,
      textAlign: 'center',
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
      marginLeft: 4,
    },
  });

  if (!isReady) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading knowledge base...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          
          <Text style={styles.title}>Knowledge Base</Text>
          <Text style={styles.subtitle}>
            Search Cochrane Handbook, seminal papers, and R documentation
          </Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons 
              name="search" 
              size={20} 
              color={colors.muted} 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search knowledge base..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable style={styles.clearButton} onPress={handleClear}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalChunks}</Text>
              <Text style={styles.statLabel}>Documents</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.keys(stats.categories).length}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Offline</Text>
              <Text style={styles.statLabel}>Available</Text>
            </View>
          </View>
        )}

        {/* Search Results or Categories */}
        {searchResults.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {selectedCategory 
                ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Results'}`
                : `Search Results (${searchResults.length})`
              }
            </Text>
            <View style={styles.resultsContainer}>
              {searchResults.map((result) => (
                <Pressable
                  key={result.id}
                  style={styles.resultCard}
                  onPress={() => setExpandedResult(
                    expandedResult === result.id ? null : result.id
                  )}
                >
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultIcon}>
                      {CATEGORIES.find(c => c.id === result.category)?.icon || '📄'}
                    </Text>
                    <Text style={styles.resultTitle}>{result.title}</Text>
                    <View style={styles.resultScore}>
                      <Text style={styles.resultScoreText}>
                        {Math.round(result.score * 100)}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.resultSource}>{result.source}</Text>
                  <Text 
                    style={[
                      styles.resultText,
                      expandedResult !== result.id && styles.resultTextTruncated
                    ]}
                    numberOfLines={expandedResult === result.id ? undefined : 3}
                  >
                    {result.text}
                  </Text>
                  <View style={styles.resultActions}>
                    <Pressable style={styles.expandButton}>
                      <Text style={styles.expandButtonText}>
                        {expandedResult === result.id ? 'Show less' : 'Show more'}
                      </Text>
                    </Pressable>
                    <Pressable 
                      style={styles.learnMoreButton}
                      onPress={() => {
                        // Navigate to terminal with Socratic teaching prompt
                        router.push({
                          pathname: '/(tabs)',
                          params: {
                            teachTopic: result.title,
                            teachContext: result.text.substring(0, 500),
                          },
                        });
                      }}
                    >
                      <Ionicons name="school-outline" size={14} color={colors.primary} />
                      <Text style={styles.learnMoreText}>Learn More</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <>
            {/* Categories */}
            <Text style={styles.sectionTitle}>Browse by Category</Text>
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    selectedCategory === category.id && styles.categoryCardSelected
                  ]}
                  onPress={() => handleCategorySelect(category.id)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                  </View>
                  {stats?.categories[category.id] && (
                    <View style={styles.categoryCount}>
                      <Text style={styles.categoryCountText}>
                        {stats.categories[category.id]}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            {/* Empty state when searching */}
            {searchQuery.length > 0 && !isLoading && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>
                  No results found for "{searchQuery}"
                </Text>
              </View>
            )}
          </>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
