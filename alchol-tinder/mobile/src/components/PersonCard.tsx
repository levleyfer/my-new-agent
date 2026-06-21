import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { formatDistance } from '../utils/format';
import { Avatar, Button, Tag, Text } from './primitives';

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

const MAX_VISIBLE_TAGS = 5;

/** Builds the ordered, capped list of tag pills: shared first (gold), then others (muted), then a "+N more" overflow. */
function buildTagRow(sharedTags: string[], otherTags: string[]) {
  const ordered = [
    ...sharedTags.map((label) => ({ label, variant: 'shared' as const })),
    ...otherTags.map((label) => ({ label, variant: 'muted' as const })),
  ];
  const visible = ordered.slice(0, MAX_VISIBLE_TAGS);
  const remaining = ordered.length - visible.length;
  return { visible, remaining };
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
  const { visible, remaining } = buildTagRow(sharedTags, otherTags);

  return (
    <View style={[styles.card, isVerified ? styles.cardVerified : styles.cardUnverified]}>
      <View style={styles.header}>
        <Avatar avatarUrl={avatarUrl} displayName={name} size={44} verified={isVerified} />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <Text variant="name" numberOfLines={1} style={styles.nameFlex}>
              {name}
            </Text>
            {isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.gold.default} />}
          </View>
          <View style={styles.metaRow}>
            <Text variant="meta">{formatDistance(distanceKm)}</Text>
            <Text variant="meta" color={colors.text.faint}>
              ·
            </Text>
            <Text variant="meta">{sharedTagCount} shared</Text>
            <Text variant="meta" color={colors.text.faint}>
              ·
            </Text>
            <View style={styles.onlineRow}>
              <View style={[styles.dot, { backgroundColor: isOnline ? colors.state.success : colors.state.danger }]} />
              <Text variant="meta" color={isOnline ? colors.state.success : colors.state.danger}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          {!isVerified && (
            <View style={styles.unverifiedRow}>
              <Ionicons name="alert-circle-outline" size={12} color={colors.text.faint} />
              <Text variant="meta" color={colors.text.faint}>
                Verification pending
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Safety primitive: keep "virtual cheers first" visible regardless of other tags. */}
      {virtualCheersFirst && (
        <View style={styles.cheersPill}>
          <Ionicons name="videocam" size={14} color={colors.state.success} />
          <Text variant="tag" color={colors.state.success}>
            Virtual cheers first
          </Text>
        </View>
      )}

      {prefersPublicPlace && (
        <View style={styles.publicPlaceRow}>
          <Ionicons name="storefront-outline" size={13} color={colors.text.muted} />
          <Text variant="meta">Prefers a public place</Text>
        </View>
      )}

      <View style={styles.tagsWrap}>
        {visible.map((tag, index) => (
          <Tag key={`${tag.variant}-${tag.label}-${index}`} label={tag.label} variant={tag.variant} />
        ))}
        {remaining > 0 && <Tag label={`+${remaining} more`} variant="muted" />}
      </View>

      <View style={styles.actions}>
        <Button
          label={isConnecting ? 'Connecting…' : 'Say cheers'}
          onPress={onSayCheers}
          disabled={isConnecting}
          icon={<Ionicons name="wine" size={16} color={colors.gold.on} />}
          style={styles.fill}
        />
        <Button label="Profile" onPress={onViewProfile} variant="secondary" style={styles.fill} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  // Verified cards get the standard border; unverified cards use a subtler,
  // dimmer border so verified profiles read as visually more "trustworthy".
  cardVerified: { borderColor: colors.border.default },
  cardUnverified: { borderColor: colors.border.subtle },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  nameFlex: { flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  unverifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cheersPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.chipShared.bg,
    borderWidth: 1,
    borderColor: colors.state.success,
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm + 2,
    marginTop: spacing.md,
  },
  publicPlaceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.xs },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  fill: { flex: 1 },
});
