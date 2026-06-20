import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { verifyMyAge } from '../api/client';
import { ApiError } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing, typography } from '../theme/theme';

export default function ProfileScreen() {
  const { profile, token, refreshProfile, logout } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  const handleVerify = async () => {
    if (!token) return;
    setError(null);
    setVerifying(true);
    try {
      await verifyMyAge(token);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={typography.title}>{profile.display_name}</Text>
        {profile.is_age_verified && <Ionicons name="checkmark-circle" size={20} color={colors.success} />}
      </View>
      <Text style={[typography.caption, styles.meta]}>{profile.email}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.is_available ? 'Yes' : 'No'}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile.verification_status}</Text>
          <Text style={styles.statLabel}>Verification</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tags</Text>
      {profile.tags.length === 0 ? (
        <Text style={typography.caption}>No tags selected yet.</Text>
      ) : (
        <View style={styles.tagRow}>
          {profile.tags.map((tag) => (
            <View key={tag.id} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
        </View>
      )}

      {!profile.is_age_verified && (
        <View style={styles.verifyBox}>
          <Text style={styles.verifyText}>
            Age verification is required before you can discover or be discovered. This dev build
            uses a placeholder — production would use a real ID-check provider.
          </Text>
          <PrimaryButton title="Verify age (dev)" onPress={handleVerify} loading={verifying} />
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.logoutContainer}>
        <PrimaryButton title="Log out" onPress={logout} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { marginTop: spacing.xs, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statValue: { color: colors.primary, fontSize: 16, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  sectionTitle: { ...typography.label, marginBottom: spacing.sm },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tagChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tagText: { fontSize: 13, color: colors.textSecondary },
  error: { color: colors.danger, marginTop: spacing.md },
  verifyBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.accentMuted,
  },
  verifyText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.md },
  logoutContainer: { marginTop: spacing.xxl },
});
