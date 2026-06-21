import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { blockUser, createMatch, discover, reportUser, updateMyAvailability, updateMyLocation } from '../api/client';
import { ApiError, DiscoverCandidate, ReportReason } from '../api/types';
import ScreenContainer from '../components/ScreenContainer';
import SafetyMenu from '../components/SafetyMenu';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Discover'>;

// Surfaced as trust badges, not buried in the generic tag list — see CLAUDE.md.
const SAFETY_TAG_NAMES = new Set(['prefer public place', 'virtual cheers first']);

export default function DiscoverScreen({ navigation }: Props) {
  const { token, profile, refreshProfile } = useAuth();
  const [candidates, setCandidates] = useState<DiscoverCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [safetyTarget, setSafetyTarget] = useState<DiscoverCandidate | null>(null);

  const ensureLocationShared = useCallback(async () => {
    if (!token) return false;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission is needed to find nearby matches. Enable it in your browser/device settings and try again.');
      return false;
    }

    // getCurrentPositionAsync has no built-in timeout on some platforms (web
    // geolocation in particular can hang a long time before failing) — race
    // it against our own deadline so the UI never gets stuck spinning.
    const position = await Promise.race([
      Location.getCurrentPositionAsync({}),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('location_timeout')), 8000),
      ),
    ]);
    await updateMyLocation(token, position.coords.latitude, position.coords.longitude);
    return true;
  }, [token]);

  const loadCandidates = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const hasLocation = await ensureLocationShared();
      if (!hasLocation) return;
      const results = await discover(token);
      setCandidates(results);
    } catch (err) {
      if (err instanceof Error && err.message === 'location_timeout') {
        setError('Could not get your location in time. Check your connection and tap retry.');
      } else if (err instanceof ApiError && err.status === 403) {
        setError('Verify your age in your profile before discovering matches.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not load nearby people.');
      }
    }
  }, [token, ensureLocationShared]);

  useEffect(() => {
    setLoading(true);
    loadCandidates().finally(() => setLoading(false));
  }, [loadCandidates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value: boolean) => {
    if (!token) return;
    await updateMyAvailability(token, value);
    await refreshProfile();
  };

  const handleConnect = async (candidate: DiscoverCandidate) => {
    if (!token) return;
    setMatchingId(candidate.id);
    try {
      const match = await createMatch(token, candidate.id);
      navigation.navigate('Match', { match });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start a match.');
    } finally {
      setMatchingId(null);
    }
  };

  const handleBlock = async () => {
    if (!token || !safetyTarget) return;
    const blockedId = safetyTarget.id;
    try {
      await blockUser(token, blockedId);
      setCandidates((prev) => prev.filter((c) => c.id !== blockedId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not block this user.');
    }
  };

  const handleReport = async (reason: ReportReason, details?: string) => {
    if (!token || !safetyTarget) return;
    try {
      await reportUser(token, safetyTarget.id, reason, details);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit report.');
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={typography.title}>Nearby tonight</Text>
        <View style={styles.availabilityRow}>
          <Ionicons
            name={profile?.is_available ? 'radio-button-on' : 'radio-button-off'}
            size={16}
            color={profile?.is_available ? colors.success : colors.textMuted}
          />
          <Text style={styles.availabilityLabel}>Available now</Text>
          <Switch
            value={profile?.is_available ?? false}
            onValueChange={handleToggleAvailability}
            trackColor={{ false: colors.surfaceRaised, true: colors.primaryMuted }}
            thumbColor={profile?.is_available ? colors.primary : colors.textMuted}
          />
        </View>
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => loadCandidates()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text style={styles.emptyText}>No one nearby right now — check back later.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.display_name}</Text>
                {item.verification_status === 'verified' && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                )}
                <Pressable style={styles.menuButton} onPress={() => setSafetyTarget(item)}>
                  <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
              <View style={styles.cardMetaRow}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.cardMeta}>~{item.distance_km} km away</Text>
                <Text style={styles.cardMetaDot}>·</Text>
                <Text style={styles.cardMeta}>{item.shared_tag_count} shared tags</Text>
              </View>

              {item.tags.some((t) => SAFETY_TAG_NAMES.has(t.name)) && (
                <View style={styles.safetyBadgeRow}>
                  {item.tags
                    .filter((t) => SAFETY_TAG_NAMES.has(t.name))
                    .map((t) => (
                      <View key={t.id} style={styles.safetyBadge}>
                        <Ionicons
                          name={t.name === 'prefer public place' ? 'storefront-outline' : 'videocam-outline'}
                          size={13}
                          color={colors.success}
                        />
                        <Text style={styles.safetyBadgeText}>{t.name}</Text>
                      </View>
                    ))}
                </View>
              )}

              <Text style={styles.cardTags}>
                {item.tags.filter((t) => !SAFETY_TAG_NAMES.has(t.name)).map((t) => t.name).join(' · ')}
              </Text>
              <Pressable
                style={({ pressed }) => [styles.connectButton, pressed && styles.connectButtonPressed]}
                onPress={() => handleConnect(item)}
                disabled={matchingId === item.id}
              >
                {matchingId === item.id ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.connectButtonText}>🥂 Say cheers</Text>
                )}
              </Pressable>
            </View>
          )}
        />
      )}

      <View style={styles.footerLinks}>
        <Pressable style={styles.profileLink} onPress={() => navigation.navigate('Matches')}>
          <Ionicons name="wine-outline" size={18} color={colors.primary} />
          <Text style={styles.profileLinkText}>My matches</Text>
        </Pressable>
        <Pressable style={styles.profileLink} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.profileLinkText}>My profile</Text>
        </Pressable>
      </View>

      {safetyTarget && (
        <SafetyMenu
          visible={!!safetyTarget}
          displayName={safetyTarget.display_name}
          onClose={() => setSafetyTarget(null)}
          onBlock={handleBlock}
          onReport={handleReport}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, marginBottom: spacing.sm },
  availabilityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  availabilityLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  center: { flex: 1 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  error: { color: colors.danger, flex: 1 },
  retryText: { color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.xl, paddingTop: 0, flexGrow: 1 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 32, marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  cardName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  menuButton: { padding: spacing.xs },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  cardMeta: { fontSize: 13, color: colors.textSecondary },
  cardMetaDot: { color: colors.textMuted },
  cardTags: { fontSize: 13, color: colors.primary, marginTop: spacing.sm },
  safetyBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  safetyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radii.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  safetyBadgeText: { fontSize: 12, color: colors.success, fontWeight: '600' },
  connectButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  connectButtonPressed: { opacity: 0.8 },
  connectButtonText: { color: colors.background, fontWeight: '700' },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xl },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  profileLinkText: { color: colors.primary, fontSize: 14 },
});
