import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { useIncomingCall } from '../context/IncomingCallContext';
import { colors, radii, spacing, typography } from '../theme/theme';
import PrimaryButton from './PrimaryButton';

export default function IncomingCallModal() {
  const { incomingCall, accept, decline } = useIncomingCall();

  return (
    <Modal visible={!!incomingCall} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="videocam" size={28} color={colors.primary} />
          </View>
          <Text style={[typography.title, styles.title]}>
            {incomingCall?.callerName ?? 'Someone'} is calling
          </Text>
          <Text style={[typography.subtitle, styles.subtitle]}>
            Virtual cheers — a quick video hello before meeting up.
          </Text>
          <View style={styles.actions}>
            <View style={styles.actionButton}>
              <PrimaryButton title="Decline" onPress={decline} variant="danger" />
            </View>
            <View style={styles.actionButton}>
              <PrimaryButton title="Accept" onPress={accept} variant="primary" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  actionButton: { flex: 1 },
});
