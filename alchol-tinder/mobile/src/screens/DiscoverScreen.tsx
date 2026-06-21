import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { blockUser, createMatch, discover, reportUser, updateMyAvailability, updateMyLocation } from '../api/client';
import { ApiError, DiscoverCandidate, ReportReason, Tag } from '../api/types';
import BottomTabBar, { TabKey } from '../components/BottomTabBar';
import PersonCard from '../components/PersonCard';
import { Text, Toggle } from '../components/primitives';
import ScreenContainer from '../components/ScreenContainer';
import SafetyMenu from '../components/SafetyMenu';
import { useAuth } from '../context/AuthContext';
import { useIncomingCall } from '../context/IncomingCallContext';
import { AppStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/tokens';
import { discoverMockCandidates } from './discoverMockData';

type Props = NativeStackScreenProps<AppStackParamList, 'Discover'>;

// Logistics tags describe availability/location, which is already surfaced via the
// availability toggle and distance line — they must not be rendered as ordinary chips.
const LOGISTICS_SAFETY_TAGS = new Set(['prefer public place', 'virtual cheers first']);

/**
 * Splits a candidate's tags into the pieces PersonCard needs: the two safety
 * preference flags (surfaced as a prominent pill / row, not a chip), and the
 * remaining taste/vibe tags split into shared vs. other for ChipList.
 *
 * `sharedTagCount` from the API is the source of truth for the "N shared"
 * count — we don't have per-tag "is this shared" info from the backend today,
 * so as an interim presentation rule the first `shared_tag_count` non-safety
 * tags are treated as the shared set. Swapping in a real `tag.is_shared`
 * field later (if the API grows one) would only change this helper.
 */
function splitTags(tags: Tag[], sharedTagCount: number) {
  const nonSafety = tags.filter((t) => !LOGISTICS_SAFETY_TAGS.has(t.name));
  const sharedTags = nonSafety.slice(0, sharedTagCount).map((t) => t.name);
  const otherTags = nonSafety.slice(sharedTagCount).map((t) => t.name);
  const prefersPublicPlace = tags.some((t) => t.name === 'prefer public place');
  const virtualCheersFirst = tags.some((t) => t.name === 'virtual cheers first');
  return { sharedTags, otherTags, prefersPublicPlace, virtualCheersFirst };
}

const USE_MOCK_DATA = false;

export default function DiscoverScreen({ navigation }: Props) {
  const { token, profile, refreshProfile } = useAuth();
  const { unreadCounts } = useIncomingCall();
  const [candidates, setCandidates] = useState<DiscoverCandidate[]>(USE_MOCK_DATA ? discoverMockCandidates : []);
  const [loading, setLoading] = useState(!USE_MOCK_DATA);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchingId, setMatchingId] = useState<string | null>(null);
  const [safetyTarget, setSafetyTarget] = useState<DiscoverCandidate | null>(null);
  const [isAvailable, setIsAvailable] = useState(profile?.is_available ?? true);
  const insets = useSafeAreaInsets();

  const ensureLocationShared = useCallback(async () => {
    if (!token) return false;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Location permission is needed to find nearby matches. Enable it in your browser/device settings and try again.');
      return false;
    }

    const servicesEnabled = await Location.hasServicesEnabledAsync();
    if (!servicesEnabled) {
      setError('Location services are turned off on this device. Turn them on in Settings and try again.');
      return false;
    }

    // A cached last-known fix is near-instant and good enough for proximity
    // matching — try it first so we're not stuck waiting on a cold GPS fix
    // (which can take well over 8s indoors on a real device) every time.
    const cached = await Location.getLastKnownPositionAsync();

    // getCurrentPositionAsync has no built-in timeout on some platforms (web
    // geolocation in particular can hang a long time before failing) — race
    // it against our own deadline so the UI never gets stuck spinning.
    const position =
      cached ??
      (await Promise.race([
        Location.getCurrentPositionAsync({}),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('location_timeout')), 20000),
        ),
      ]));
    await updateMyLocation(token, position.coords.latitude, position.coords.longitude);
    return true;
  }, [token]);

  const loadCandidates = useCallback(async () => {
    if (!token || USE_MOCK_DATA) return;
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
        const detail = err instanceof Error ? err.message : String(err);
        setError(`Could not load nearby people. (${detail})`);
      }
    }
  }, [token, ensureLocationShared]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    setLoading(true);
    loadCandidates().finally(() => setLoading(false));
  }, [loadCandidates]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCandidates();
    setRefreshing(false);
  };

  const handleToggleAvailability = async (value: boolean) => {
    setIsAvailable(value);
    if (!token || USE_MOCK_DATA) return;
    await updateMyAvailability(token, value);
    await refreshProfile();
  };

  const handleConnect = async (candidate: DiscoverCandidate) => {
    if (USE_MOCK_DATA) return;
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

  const handleTabChange = (tab: TabKey) => {
    if (tab === 'matches') navigation.navigate('Matches');
    if (tab === 'profile') navigation.navigate('Profile');
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="title">Nearby tonight</Text>
        <Toggle
          value={isAvailable}
          onValueChange={handleToggleAvailability}
          label="Available"
          showStatusDot
        />
      </View>

      {error && (
        <View style={styles.errorRow}>
          <Text variant="meta" color={colors.state.danger} style={styles.errorFlex}>
            {error}
          </Text>
          <Pressable onPress={() => loadCandidates()} hitSlop={8}>
            <Text variant="tag" color={colors.gold.default}>
              Retry
            </Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.gold.default} style={styles.center} />
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold.default} />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text variant="meta">No one nearby right now — check back later.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const { sharedTags, otherTags, prefersPublicPlace, virtualCheersFirst } = splitTags(
              item.tags,
              item.shared_tag_count,
            );
            return (
              <PersonCard
                name={item.display_name}
                avatarUrl={item.avatar_url}
                isVerified={item.verification_status === 'verified'}
                isOnline={item.is_online}
                distanceKm={item.distance_km}
                sharedTagCount={item.shared_tag_count}
                sharedTags={sharedTags}
                otherTags={otherTags}
                prefersPublicPlace={prefersPublicPlace}
                virtualCheersFirst={virtualCheersFirst}
                isConnecting={matchingId === item.id}
                onSayCheers={() => handleConnect(item)}
                onViewProfile={() => setSafetyTarget(item)}
              />
            );
          }}
        />
      )}

      <BottomTabBar active="nearby" onChange={handleTabChange} showMatchesBadge={unreadCounts.size > 0} />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  center: { flex: 1 },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  errorFlex: { flex: 1 },
  list: { padding: spacing.xl, paddingTop: 0, flexGrow: 1 },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2 },
  emptyEmoji: { fontSize: 32, marginBottom: spacing.sm },
});
