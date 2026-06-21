import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { blockUser, rateMatch, reportUser, startVirtualCheers } from '../api/client';
import { ApiError, ReportReason } from '../api/types';
import Avatar from '../components/Avatar';
import OnlineBadge from '../components/OnlineBadge';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import SafetyMenu from '../components/SafetyMenu';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Match'>;

export default function MatchScreen({ route, navigation }: Props) {
  const { token } = useAuth();
  const [match, setMatch] = useState(route.params.match);
  const [starting, setStarting] = useState(false);
  const [rating, setRating] = useState(false);
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

  const handleRate = async (score: number) => {
    if (!token) return;
    setError(null);
    setRating(true);
    try {
      setMatch(await rateMatch(token, match.id, score));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit rating.');
    } finally {
      setRating(false);
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
      <View style={styles.avatarRow}>
        <Avatar avatarUrl={match.other_user.avatar_url} displayName={match.other_user.display_name} size={72} />
      </View>
      <Text style={[typography.title, styles.title]}>
        You matched with {match.other_user.display_name}!
      </Text>
      <Text style={typography.subtitle}>{match.compatibility_score} shared tags</Text>
      <View style={styles.onlineRow}>
        <OnlineBadge isOnline={match.other_user.is_online} />
      </View>

      <View style={styles.safetyBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
        <Text style={styles.safetyText}>
          For your safety, do a quick video "virtual cheers" before meeting up in person.
        </Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton title="Start virtual cheers" onPress={handleStartCheers} loading={starting} />

      <View style={styles.chatButtonSpacing}>
        <PrimaryButton
          title={`Message ${match.other_user.display_name}`}
          onPress={() => navigation.navigate('Chat', { matchId: match.id })}
          variant="ghost"
        />
      </View>

      {match.status !== 'pending' && (
        <View style={styles.rateBox}>
          <Text style={styles.rateLabel}>
            {match.my_rating ? `You rated ${match.other_user.display_name}` : `Rate ${match.other_user.display_name}`}
          </Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => handleRate(value)} disabled={rating} hitSlop={6}>
                <Ionicons
                  name={(match.my_rating ?? 0) >= value ? 'star' : 'star-outline'}
                  size={28}
                  color={colors.primary}
                />
              </Pressable>
            ))}
          </View>
        </View>
      )}

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
  avatarRow: { alignItems: 'center', marginBottom: spacing.md },
  title: { textAlign: 'center' },
  onlineRow: { alignItems: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  chatButtonSpacing: { marginTop: spacing.md },
  rateBox: { alignItems: 'center', marginTop: spacing.xl },
  rateLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  starRow: { flexDirection: 'row', gap: spacing.xs },
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
