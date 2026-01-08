/**
 * Community Discovery Screen
 * 
 * Discover conferences, call for papers, and connect with researchers.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import {
  ResearchEvent,
  EventType,
  getAllEvents,
  getEventsByType,
  getFeaturedEvents,
  getUpcomingDeadlines,
  getRecommendations,
  searchEvents,
  communityDiscoveryService,
} from '@/lib/community/discovery.service';

// TUI Colors
const GLASS_BLUE = '#00BFFF';
const FOX_ORANGE = '#FF8C00';
const BLACK = '#000000';
const SURFACE = '#0A0A0A';
const BORDER = '#1A3A4A';

type FilterType = 'all' | 'featured' | 'deadlines' | 'recommended' | EventType;

export default function CommunityScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<ResearchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('featured');
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    loadEvents();
  }, [filter]);
  
  const loadEvents = async () => {
    setLoading(true);
    try {
      let result: ResearchEvent[];
      
      switch (filter) {
        case 'all':
          result = await getAllEvents();
          break;
        case 'featured':
          result = await getFeaturedEvents();
          break;
        case 'deadlines':
          result = await getUpcomingDeadlines(60);
          break;
        case 'recommended':
          result = await getRecommendations();
          break;
        case 'conference':
        case 'call_for_papers':
        case 'workshop':
        case 'webinar':
        case 'grant':
          result = await getEventsByType(filter);
          break;
        default:
          result = await getAllEvents();
      }
      
      setEvents(result);
    } catch (error) {
      console.error('[Community] Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEvents();
      return;
    }
    
    setLoading(true);
    try {
      const results = await searchEvents(searchQuery);
      setEvents(results);
    } catch (error) {
      console.error('[Community] Search failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const openEvent = (event: ResearchEvent) => {
    Linking.openURL(event.url);
  };
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  
  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };
  
  const renderEventCard = ({ item }: { item: ResearchEvent }) => {
    const icon = communityDiscoveryService.getEventTypeIcon(item.type);
    const typeName = communityDiscoveryService.getEventTypeDisplayName(item.type);
    const daysUntilDeadline = item.deadline ? getDaysUntil(item.deadline) : null;
    
    return (
      <Pressable
        onPress={() => openEvent(item)}
        style={({ pressed }) => [
          styles.eventCard,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        {/* Header */}
        <View style={styles.eventHeader}>
          <Text style={styles.eventIcon}>{icon}</Text>
          <View style={styles.eventHeaderText}>
            <Text style={styles.eventType}>{typeName}</Text>
            {item.featured && (
              <Text style={styles.featuredBadge}>⭐ FEATURED</Text>
            )}
          </View>
        </View>
        
        {/* Title */}
        <Text style={styles.eventTitle}>{item.title}</Text>
        
        {/* Organization */}
        <Text style={styles.eventOrg}>{item.organization}</Text>
        
        {/* Description */}
        <Text style={styles.eventDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        {/* Details */}
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📍</Text>
            <Text style={styles.detailValue}>
              {item.isVirtual ? '🌐 Virtual' : item.location}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>📅</Text>
            <Text style={styles.detailValue}>
              {formatDate(item.startDate)}
              {item.endDate && ` - ${formatDate(item.endDate)}`}
            </Text>
          </View>
          
          {item.deadline && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏰</Text>
              <Text style={[
                styles.detailValue,
                daysUntilDeadline !== null && daysUntilDeadline <= 14 && styles.urgentDeadline,
              ]}>
                Deadline: {formatDate(item.deadline)}
                {daysUntilDeadline !== null && daysUntilDeadline > 0 && (
                  ` (${daysUntilDeadline} days)`
                )}
              </Text>
            </View>
          )}
        </View>
        
        {/* Tags */}
        <View style={styles.tagsContainer}>
          {item.fields.slice(0, 3).map((field, index) => (
            <Text key={index} style={styles.tag}>
              {communityDiscoveryService.getFieldDisplayName(field)}
            </Text>
          ))}
        </View>
        
        {/* Action */}
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>Tap to open →</Text>
        </View>
      </Pressable>
    );
  };
  
  const filterButtons: { key: FilterType; label: string; icon: string }[] = [
    { key: 'featured', label: 'Featured', icon: '⭐' },
    { key: 'deadlines', label: 'Deadlines', icon: '⏰' },
    { key: 'conference', label: 'Conferences', icon: '🎤' },
    { key: 'call_for_papers', label: 'CFP', icon: '📝' },
    { key: 'workshop', label: 'Workshops', icon: '🔧' },
    { key: 'grant', label: 'Grants', icon: '💰' },
    { key: 'all', label: 'All', icon: '📋' },
  ];
  
  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>🦊 Community</Text>
          <Text style={styles.subtitle}>Conferences & Opportunities</Text>
        </View>
        
        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search events..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <Pressable onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </Pressable>
        </View>
        
        {/* Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filterButtons}
          keyExtractor={(item) => item.key}
          style={styles.filterList}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setFilter(item.key);
                setSearchQuery('');
              }}
              style={[
                styles.filterButton,
                filter === item.key && styles.filterButtonActive,
              ]}
            >
              <Text style={styles.filterIcon}>{item.icon}</Text>
              <Text style={[
                styles.filterLabel,
                filter === item.key && styles.filterLabelActive,
              ]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
        
        {/* Events List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GLASS_BLUE} />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🦊</Text>
            <Text style={styles.emptyText}>No events found</Text>
            <Text style={styles.emptySubtext}>Try a different filter or search</Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            renderItem={renderEventCard}
            contentContainerStyle={styles.eventsList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BLACK,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  title: {
    color: FOX_ORANGE,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  subtitle: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    color: GLASS_BLUE,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: GLASS_BLUE,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  filterList: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 4,
  },
  filterButtonActive: {
    borderColor: GLASS_BLUE,
    backgroundColor: '#0A1A2A',
  },
  filterIcon: {
    fontSize: 14,
  },
  filterLabel: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  filterLabelActive: {
    color: GLASS_BLUE,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  eventsList: {
    padding: 16,
    gap: 16,
  },
  eventCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  eventHeaderText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventType: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  featuredBadge: {
    color: '#FFD700',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  eventTitle: {
    color: FOX_ORANGE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  eventOrg: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  eventDescription: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 12,
  },
  eventDetails: {
    gap: 4,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 12,
  },
  detailValue: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  urgentDeadline: {
    color: '#FF6B6B',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#0A1A2A',
    color: GLASS_BLUE,
    fontSize: 10,
    fontFamily: 'monospace',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionRow: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  actionText: {
    color: GLASS_BLUE,
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
