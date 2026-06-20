import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';

/**
 * Placeholder for the real WebRTC "virtual cheers" call (see CLAUDE.md: managed
 * provider — LiveKit/Daily — not a custom media server). The backend already
 * creates a room per match (`roomName`); wiring an actual provider SDK here is
 * a follow-up once an account/API key exists.
 */
type Props = NativeStackScreenProps<AppStackParamList, 'VirtualCheers'>;

export default function VirtualCheersScreen({ route, navigation }: Props) {
  const { roomName } = route.params;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.videoPlaceholder}>
        <Ionicons name="videocam-outline" size={40} color={colors.textMuted} />
        <Text style={styles.placeholderText}>Video call placeholder</Text>
        <Text style={styles.roomName}>{roomName}</Text>
      </View>
      <Text style={styles.note}>
        Real video isn't wired up yet — this room id is ready for a WebRTC provider
        (LiveKit/Daily) integration.
      </Text>
      <PrimaryButton title="End call" onPress={() => navigation.popToTop()} variant="danger" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: 'center' },
  videoPlaceholder: {
    height: 320,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  placeholderText: { color: colors.textMuted, fontSize: 16, marginTop: spacing.sm },
  roomName: { color: colors.textMuted, fontSize: 12, marginTop: spacing.sm },
  note: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: spacing.xl },
});
