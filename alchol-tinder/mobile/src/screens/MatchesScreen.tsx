import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { listMyMatches } from '../api/client';
import { ApiError, Match, MatchStatus } from '../api/types';
import Avatar from '../components/Avatar';
import OnlineBadge from '../components/OnlineBadge';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useIncomingCall } from '../context/IncomingCallContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Matches'>;

const STATUS_LABELS: Record<MatchStatus, string> = {
  pending: 'Say cheers to start',
  video: 'Virtual cheers done',
  met: 'Met up',
  closed: 'Closed',
};

const STATUS_COLORS: Record<MatchStatus, string> = {
  pending: colors.textMuted,
  video: colors.primary,
  met: colors.success,
  closed: colors.textMuted,
};

export default function MatchesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { unreadCounts } = useIncomingCall();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const results = await listMyMatches(token);
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMatches(results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your matches.');
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScreenContainer>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🥂</Text>
              <Text style={styles.emptyText}>No matches yet — say cheers to someone nearby.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => navigation.navigate('Match', { match: item })}
            >
              <View style={styles.cardHeader}>
                <Avatar
                  avatarUrl={item.other_user.avatar_url}
                  displayName={item.other_user.display_name}
                  size={36}
                  unreadCount={unreadCounts.get(item.id)}
                />
                <Text style={styles.cardName}>{item.other_user.display_name}</Text>
                {item.other_user.verification_status === 'verified' && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                )}
                <Pressable
                  style={styles.chatButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Chat', { matchId: item.id });
                  }}
                  hitSlop={6}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                </Pressable>
              </View>
              <View style={styles.cardMetaRow}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                  {STATUS_LABELS[item.status]}
                </Text>
                <Text style={styles.cardMetaDot}>·</Text>
                <Text style={styles.cardMeta}>{item.compatibility_score} shared tags</Text>
                <Text style={styles.cardMetaDot}>·</Text>
                <OnlineBadge isOnline={item.other_user.is_online} />
              </View>
            </Pressable>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  error: { color: colors.danger, marginHorizontal: spacing.xl, marginTop: spacing.md },
  list: { padding: spacing.xl, flexGrow: 1 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 32, marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: { opacity: 0.8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  chatButton: { marginLeft: 'auto', padding: spacing.xs },
  cardName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  statusText: { fontSize: 13, fontWeight: '600' },
  cardMetaDot: { color: colors.textMuted },
  cardMeta: { fontSize: 13, color: colors.textSecondary },
});
