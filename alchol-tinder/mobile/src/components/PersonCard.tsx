import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../theme/theme';
import { formatDistance } from '../utils/format';
import Avatar from './Avatar';
import ChipList from './ChipList';
import OnlineBadge from './OnlineBadge';

export interface PersonCardProps {
  name: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  isOnline: boolean;
  distanceKm: number;
  /** Count of tags shared with the current user, shown in the meta line (e.g. "3 shared"). */
  sharedTagCount: number;
  /** Shared tag names — rendered first in the chip row, styled gold. */
  sharedTags: string[];
  /** Other (non-shared, non-logistics) tag names — rendered after shared tags, styled muted. */
  otherTags: string[];
  /** "prefer public place" safety preference — surfaced prominently, not buried in tags. */
  prefersPublicPlace: boolean;
  /** "virtual cheers first" safety preference — the video-before-meeting safety primitive. */
  virtualCheersFirst: boolean;
  onSayCheers: () => void;
  /** Secondary action — view this person's profile (currently surfaces the safety menu; see DiscoverScreen). */
  onViewProfile: () => void;
  isConnecting?: boolean;
}

/**
 * A single person's card in the "Nearby tonight" feed. Pure presentation —
 * all data comes in as props so this can be driven by mock data today and
 * the real `DiscoverCandidate` API shape later with no structural changes.
 */
export default function PersonCard({
  name,
  avatarUrl = null,
  isVerified,
  isOnline,
  distanceKm,
  sharedTagCount,
  sharedTags,
  otherTags,
  prefersPublicPlace,
  virtualCheersFirst,
  onSayCheers,
  onViewProfile,
  isConnecting,
}: PersonCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Avatar avatarUrl={avatarUrl} displayName={name} size={44} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.success} />}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDistance(distanceKm)}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{sharedTagCount} shared</Text>
            <Text style={styles.metaDot}>·</Text>
            <OnlineBadge isOnline={isOnline} />
          </View>
        </View>
      </View>

      {/* Safety primitive: keep "virtual cheers first" visible regardless of other tags. */}
      {virtualCheersFirst && (
        <View style={styles.cheersPill}>
          <Ionicons name="videocam" size={14} color={colors.success} />
          <Text style={styles.cheersPillText}>Virtual cheers first</Text>
        </View>
      )}

      {prefersPublicPlace && (
        <View style={styles.publicPlaceRow}>
          <Ionicons name="storefront-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.publicPlaceText}>Prefers a public place</Text>
        </View>
      )}

      <View style={styles.chipsWrap}>
        <ChipList sharedTags={sharedTags} otherTags={otherTags} />
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.cheersButton, pressed && styles.cheersButtonPressed]}
          onPress={onSayCheers}
          disabled={isConnecting}
        >
          <Ionicons name="wine" size={16} color={colors.onPrimary} />
          <Text style={styles.cheersButtonText}>{isConnecting ? 'Connecting…' : 'Say cheers'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
          onPress={onViewProfile}
        >
          <Text style={styles.profileButtonText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  name: { ...typography.label, flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  metaText: { fontSize: 12.5, color: colors.textSecondary },
  metaDot: { color: colors.textMuted, fontSize: 12.5 },
  cheersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.chipSharedBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    marginTop: spacing.md,
  },
  cheersPillText: { fontSize: 12.5, fontWeight: '700', color: colors.success },
  publicPlaceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs },
  publicPlaceText: { fontSize: 12, color: colors.textSecondary },
  chipsWrap: { marginTop: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cheersButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: 12,
  },
  cheersButtonPressed: { opacity: 0.85 },
  cheersButtonText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14.5 },
  profileButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    paddingVertical: 12,
  },
  profileButtonPressed: { opacity: 0.7 },
  profileButtonText: { color: colors.primary, fontWeight: '700', fontSize: 14.5 },
});
