import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { deleteAvatar, updateMyNotificationPreferences, uploadAvatar } from '../api/client';
import { ApiError } from '../api/types';
import Avatar from '../components/Avatar';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { profile, token, refreshProfile, logout } = useAuth();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [updatingPreview, setUpdatingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  const handleChangeAvatar = async () => {
    if (!token) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library permission is needed to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setError(null);
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      await uploadAvatar(token, asset.uri, asset.mimeType ?? 'image/jpeg');
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not upload that photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!token) return;
    setError(null);
    setUploadingAvatar(true);
    try {
      await deleteAvatar(token);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove your photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleTogglePreview = async (value: boolean) => {
    if (!token) return;
    setError(null);
    setUpdatingPreview(true);
    try {
      await updateMyNotificationPreferences(token, value);
      await refreshProfile();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update notification settings.');
    } finally {
      setUpdatingPreview(false);
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.avatarSection}>
        <Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
          <Avatar avatarUrl={profile.avatar_url} displayName={profile.display_name} size={88} />
          {uploadingAvatar && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator color={colors.primary} />
            </View>
          )}
        </Pressable>
        <View style={styles.avatarActions}>
          <Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar}>
            <Text style={styles.avatarActionText}>{profile.avatar_url ? 'Change photo' : 'Add photo'}</Text>
          </Pressable>
          {profile.avatar_url && (
            <Pressable onPress={handleRemoveAvatar} disabled={uploadingAvatar}>
              <Text style={[styles.avatarActionText, styles.avatarActionDanger]}>Remove</Text>
            </Pressable>
          )}
        </View>
      </View>

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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Tags</Text>
        <Pressable onPress={() => navigation.navigate('TagSelection')}>
          <Text style={styles.editLink}>Edit</Text>
        </Pressable>
      </View>
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

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Notifications</Text>
      </View>
      <View style={styles.previewRow}>
        <View style={styles.previewTextWrap}>
          <Text style={styles.previewLabel}>Show message preview in notifications</Text>
          <Text style={styles.previewHint}>
            Off by default. When off, notifications just say &quot;New message&quot; — no sender
            name or text shown on your lock screen.
          </Text>
        </View>
        <Switch
          value={profile.notify_message_preview}
          onValueChange={handleTogglePreview}
          disabled={updatingPreview}
          trackColor={{ false: colors.surfaceRaised, true: colors.primaryMuted }}
          thumbColor={profile.notify_message_preview ? colors.primary : colors.textMuted}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.blockedLink} onPress={() => navigation.navigate('BlockedUsers')}>
        <Ionicons name="ban-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.blockedLinkText}>Blocked users</Text>
      </Pressable>

      <View style={styles.logoutContainer}>
        <PrimaryButton title="Log out" onPress={logout} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl },
  center: { justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: spacing.lg },
  avatarWrap: { borderRadius: 44 },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 44,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  avatarActionText: { color: colors.primary, fontSize: 13, fontWeight: '600' },
  avatarActionDanger: { color: colors.danger },
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.label, marginBottom: 0 },
  editLink: { color: colors.primary, fontSize: 13, fontWeight: '600' },
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
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  previewTextWrap: { flex: 1 },
  previewLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  previewHint: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  error: { color: colors.danger, marginTop: spacing.md },
  blockedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  blockedLinkText: { color: colors.textSecondary, fontSize: 13 },
  logoutContainer: { marginTop: spacing.xxl },
});
