import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useIncomingCall } from '../context/IncomingCallContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';

/**
 * Native (iOS/Android) placeholder. The real call is live on web — see
 * VirtualCheersScreen.web.tsx, which embeds Jitsi Meet's free public server
 * directly in the browser. Native would need an embeddable Jitsi/WebRTC SDK
 * (native modules), which means a custom dev-client build (EAS Build)
 * instead of plain Expo Go — a follow-up once this app has that pipeline.
 */
type Props = NativeStackScreenProps<AppStackParamList, 'VirtualCheers'>;

export default function VirtualCheersScreen({ route, navigation }: Props) {
  const { matchId, roomName } = route.params;
  const { declinedMatchId, acknowledgeDecline } = useIncomingCall();
  const [declined, setDeclined] = useState(false);

  useEffect(() => {
    if (declinedMatchId !== matchId) return;
    setDeclined(true);
    acknowledgeDecline();
    const timer = setTimeout(() => navigation.popToTop(), 2000);
    return () => clearTimeout(timer);
  }, [declinedMatchId, matchId, acknowledgeDecline, navigation]);

  return (
    <ScreenContainer style={styles.container}>
      {declined && <Text style={styles.declinedBanner}>They declined the call.</Text>}
      <View style={styles.videoPlaceholder}>
        <Ionicons name="videocam-outline" size={40} color={colors.textMuted} />
        <Text style={styles.placeholderText}>Video call placeholder</Text>
        <Text style={styles.roomName}>{roomName}</Text>
      </View>
      <Text style={styles.note}>
        Real video is live on web. Native needs a custom dev-client build
        for an embeddable video SDK — coming soon.
      </Text>
      <PrimaryButton title="End call" onPress={() => navigation.popToTop()} variant="danger" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: 'center' },
  declinedBanner: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
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
