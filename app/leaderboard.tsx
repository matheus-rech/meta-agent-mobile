/**
 * Leaderboard Screen
 * 
 * Public quiz leaderboard with rankings and stats.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import {
  LeaderboardEntry,
  LeaderboardStats,
  getPublicLeaderboard,
  getWeeklyLeaderboard,
  getLeaderboardStats,
  getUserEntry,
  getUserInfo,
  setUsername,
} from '@/lib/leaderboard/leaderboard.service';

// TUI Colors
const GLASS_BLUE = '#00BFFF';
const FOX_ORANGE = '#FF8C00';
const BLACK = '#000000';
const SURFACE = '#0A0A0A';
const BORDER = '#1A3A4A';
const GOLD = '#FFD700';
const SILVER = '#C0C0C0';
const BRONZE = '#CD7F32';

type TabType = 'all' | 'weekly';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('all');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  
  useEffect(() => {
    loadData();
  }, [tab]);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, statsData, userData, userInfo] = await Promise.all([
        tab === 'all' ? getPublicLeaderboard(50) : getWeeklyLeaderboard(20),
        getLeaderboardStats(),
        getUserEntry(),
        getUserInfo(),
      ]);
      
      setEntries(entriesData);
      setStats(statsData);
      setUserEntry(userData);
      setCurrentUsername(userInfo.username);
      setNewUsername(userInfo.username);
    } catch (error) {
      console.error('[Leaderboard] Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateUsername = async () => {
    if (newUsername.trim() && newUsername !== currentUsername) {
      await setUsername(newUsername.trim());
      setCurrentUsername(newUsername.trim());
      await loadData();
    }
    setShowUsernameModal(false);
  };
  
  const getRankColor = (rank: number) => {
    if (rank === 1) return GOLD;
    if (rank === 2) return SILVER;
    if (rank === 3) return BRONZE;
    return GLASS_BLUE;
  };
  
  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };
  
  const renderEntry = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = item.rank || index + 1;
    const isCurrentUser = item.id === userEntry?.id;
    
    return (
      <View style={[
        styles.entryCard,
        isCurrentUser && styles.currentUserCard,
      ]}>
        {/* Rank */}
        <View style={[styles.rankContainer, { borderColor: getRankColor(rank) }]}>
          <Text style={[styles.rankText, { color: getRankColor(rank) }]}>
            {getRankEmoji(rank)}
          </Text>
        </View>
        
        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.usernameRow}>
            <Text style={[styles.username, isCurrentUser && styles.currentUserText]}>
              {item.username}
            </Text>
            {isCurrentUser && (
              <Text style={styles.youBadge}>YOU</Text>
            )}
          </View>
          <Text style={styles.userStats}>
            {item.quizzesCompleted} quizzes • {item.accuracy}% accuracy
          </Text>
        </View>
        
        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: getRankColor(rank) }]}>
            {item.score.toLocaleString()}
          </Text>
          <Text style={styles.scoreLabel}>pts</Text>
        </View>
      </View>
    );
  };
  
  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.topScore.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Top Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: FOX_ORANGE }]}>
              {stats.yourRank ? `#${stats.yourRank}` : '-'}
            </Text>
            <Text style={styles.statLabel}>Your Rank</Text>
          </View>
        </View>
      )}
      
      {/* Your Card */}
      {userEntry && (
        <Pressable
          onPress={() => setShowUsernameModal(true)}
          style={styles.yourCard}
        >
          <View style={styles.yourCardHeader}>
            <Text style={styles.yourCardTitle}>🦊 Your Stats</Text>
            <Text style={styles.editHint}>Tap to edit name</Text>
          </View>
          <View style={styles.yourCardStats}>
            <View style={styles.yourStat}>
              <Text style={styles.yourStatValue}>{userEntry.score.toLocaleString()}</Text>
              <Text style={styles.yourStatLabel}>Score</Text>
            </View>
            <View style={styles.yourStat}>
              <Text style={styles.yourStatValue}>{userEntry.quizzesCompleted}</Text>
              <Text style={styles.yourStatLabel}>Quizzes</Text>
            </View>
            <View style={styles.yourStat}>
              <Text style={styles.yourStatValue}>{userEntry.accuracy}%</Text>
              <Text style={styles.yourStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.yourStat}>
              <Text style={styles.yourStatValue}>🔥 {userEntry.streak}</Text>
              <Text style={styles.yourStatLabel}>Streak</Text>
            </View>
          </View>
        </Pressable>
      )}
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => setTab('all')}
          style={[styles.tab, tab === 'all' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>
            🏆 All Time
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('weekly')}
          style={[styles.tab, tab === 'weekly' && styles.tabActive]}
        >
          <Text style={[styles.tabText, tab === 'weekly' && styles.tabTextActive]}>
            📅 This Week
          </Text>
        </Pressable>
      </View>
    </View>
  );
  
  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>🏆 Leaderboard</Text>
          <Text style={styles.subtitle}>Quiz Rankings</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GLASS_BLUE} />
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            ListHeaderComponent={renderHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        {/* Username Modal */}
        <Modal
          visible={showUsernameModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUsernameModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Edit Username</Text>
              <TextInput
                style={styles.usernameInput}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Enter username"
                placeholderTextColor="#666"
                maxLength={20}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setShowUsernameModal(false)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdateUsername}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
    color: GOLD,
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
  listContent: {
    padding: 16,
  },
  headerContent: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  yourCard: {
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: FOX_ORANGE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  yourCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  yourCardTitle: {
    color: FOX_ORANGE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  editHint: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  yourCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  yourStat: {
    alignItems: 'center',
  },
  yourStatValue: {
    color: GLASS_BLUE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  yourStatLabel: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: GLASS_BLUE,
    backgroundColor: '#0A1A2A',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  tabTextActive: {
    color: GLASS_BLUE,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  currentUserCard: {
    borderColor: FOX_ORANGE,
    backgroundColor: '#1A0A00',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  userInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    color: GLASS_BLUE,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  currentUserText: {
    color: FOX_ORANGE,
  },
  youBadge: {
    backgroundColor: FOX_ORANGE,
    color: BLACK,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  userStats: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  scoreLabel: {
    color: '#666',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: GLASS_BLUE,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    color: GLASS_BLUE,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
  },
  usernameInput: {
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    color: GLASS_BLUE,
    fontFamily: 'monospace',
    fontSize: 14,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: BLACK,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    borderColor: GLASS_BLUE,
    backgroundColor: '#0A1A2A',
  },
  modalButtonText: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  modalButtonTextPrimary: {
    color: GLASS_BLUE,
  },
});
