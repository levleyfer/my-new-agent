import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useIncomingCall } from '../context/IncomingCallContext';
import { navigationRef } from '../navigation/navigationRef';
import { colors, radii, spacing } from '../theme/theme';

const AUTO_DISMISS_MS = 4000;

interface ToastContent {
  matchId: string;
  senderName: string;
  body: string;
}

function isAlreadyViewingChat(matchId: string): boolean {
  if (!navigationRef.isReady()) return false;
  const route = navigationRef.getCurrentRoute();
  return route?.name === 'Chat' && (route.params as { matchId?: string } | undefined)?.matchId === matchId;
}

/** A Messenger-style "new message" banner — non-blocking (unlike the
 * incoming-call modal, chat isn't urgent enough to interrupt whatever the
 * user is doing), tappable to jump straight into the conversation, and
 * suppressed when that chat is already open on screen.
 */
export default function NewMessageToast() {
  const { lastMessage } = useIncomingCall();
  const [content, setContent] = useState<ToastContent | null>(null);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!lastMessage || isAlreadyViewingChat(lastMessage.matchId)) return;

    setContent({
      matchId: lastMessage.matchId,
      senderName: lastMessage.senderName,
      body: lastMessage.message.body,
    });

    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setContent(null), AUTO_DISMISS_MS);

    return () => clearTimeout(dismissTimer.current);
  }, [lastMessage]);

  if (!content) return null;

  const handlePress = () => {
    clearTimeout(dismissTimer.current);
    setContent(null);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Chat', { matchId: content.matchId });
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable style={({ pressed }) => [styles.toast, pressed && styles.toastPressed]} onPress={handlePress}>
        <View style={styles.iconWrap}>
          <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.sender}>{content.senderName}</Text>
          <Text style={styles.body} numberOfLines={1}>
            {content.body}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  toastPressed: { opacity: 0.85 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  sender: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 13, marginTop: 1 },
});
