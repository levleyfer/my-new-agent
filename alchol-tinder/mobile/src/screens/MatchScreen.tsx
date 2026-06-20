import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { blockUser, reportUser, startVirtualCheers } from '../api/client';
import { ApiError, ReportReason } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SafetyMenu from '../components/SafetyMenu';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Match'>;

export default function MatchScreen({ route, navigation }: Props) {
  const { match } = route.params;
  const { token } = useAuth();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [safetyMenuVisible, setSafetyMenuVisible] = useState(false);

  const handleStartCheers = async () => {
    if (!token) return;
    setError(null);
    setStarting(true);
    try {
      const session = await startVirtualCheers(token, match.id);
      navigation.navigate('VirtualCheers', { matchId: match.id, roomName: session.room_name });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start virtual cheers.');
    } finally {
      setStarting(false);
    }
  };

  const handleBlock = async () => {
    if (!token) return;
    try {
      await blockUser(token, match.other_user.id);
      navigation.popToTop();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not block this user.');
    }
  };

  const handleReport = async (reason: ReportReason, details?: string) => {
    if (!token) return;
    try {
      await reportUser(token, match.other_user.id, reason, details);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit report.');
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.emoji}>🥂</Text>
      <Text style={[typography.title, styles.title]}>
        You matched with {match.other_user.display_name}!
      </Text>
      <Text style={[typography.subtitle, styles.meta]}>{match.compatibility_score} shared tags</Text>

      <View style={styles.safetyBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text style={styles.safetyText}>
          For your safety, do a quick video "virtual cheers" before meeting up in person.
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton title="Start virtual cheers" onPress={handleStartCheers} loading={starting} />

      <Pressable style={styles.safetyLink} onPress={() => setSafetyMenuVisible(true)}>
        <Text style={styles.safetyLinkText}>Report or block {match.other_user.display_name}</Text>
      </Pressable>

      <SafetyMenu
        visible={safetyMenuVisible}
        displayName={match.other_user.display_name}
        onClose={() => setSafetyMenuVisible(false)}
        onBlock={handleBlock}
        onReport={handleReport}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: 'center' },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: spacing.sm },
  title: { textAlign: 'center' },
  meta: { textAlign: 'center', marginBottom: spacing.xl },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  safetyText: { flex: 1, fontSize: 14, color: colors.textSecondary },
  error: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  safetyLink: { marginTop: spacing.lg, alignItems: 'center' },
  safetyLinkText: { color: colors.textMuted, fontSize: 13 },
});
