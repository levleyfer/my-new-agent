import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { JAAS_APP_ID } from '../api/jaasConfig';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useIncomingCall } from '../context/IncomingCallContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'VirtualCheers'>;

// JaaS (Jitsi as a Service, jaas.8x8.vc) — not the free public meet.jit.si
// server. That server requires anonymous users to log in via Google/
// Facebook/Microsoft to become "moderator" before a room will actually
// start; JaaS rooms are gated by our own signed JWT instead (see
// backend/src/services/jaas.py), so there's no waiting-for-moderator wall.
const JITSI_DOMAIN = '8x8.vc';
const JITSI_SCRIPT_SRC = `https://${JITSI_DOMAIN}/${JAAS_APP_ID}/external_api.js`;

interface JitsiMeetExternalAPI {
  addEventListener(event: string, handler: () => void): void;
  executeCommand(command: string): void;
  dispose(): void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiMeetExternalAPI;
  }
}

function loadJitsiScript(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${JITSI_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('script_error')));
      return;
    }
    const script = document.createElement('script');
    script.src = JITSI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('script_error'));
    document.body.appendChild(script);
  });
}

/**
 * Real "virtual cheers" video call — web only for now. Embeds JaaS (Jitsi as
 * a Service) directly in the browser using a backend-signed JWT per
 * participant; the browser still connects straight to 8x8's infrastructure,
 * not through our own backend — the backend's only job is signing the token.
 *
 * Native (iOS/Android) still renders the placeholder in VirtualCheersScreen.tsx
 * — an embeddable native SDK would need its own native-module integration
 * (custom dev client, not Expo Go), same constraint as any WebRTC SDK.
 */
// 'loading' covers script-fetch time only — once the Jitsi iframe exists, its
// own UI (pre-join device check, then the call itself) takes over and our
// overlay must get out of the way rather than sit on top of it.
type Status = 'loading' | 'ready' | 'error';

export default function VirtualCheersScreen({ route, navigation }: Props) {
  const { matchId, roomName, token } = route.params;
  const { profile } = useAuth();
  const { declinedMatchId, acknowledgeDecline } = useIncomingCall();
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);
  // Jitsi injects its iframe directly into this node's DOM — it must never
  // have React-rendered children, or reconciliation fights with Jitsi's own
  // DOM mutations (e.g. on unmount/removeChild).
  const mountRef = useRef<View>(null);
  const apiRef = useRef<JitsiMeetExternalAPI | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadJitsiScript()
      .then(() => {
        if (cancelled || !window.JitsiMeetExternalAPI || !mountRef.current) return;

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: `${JAAS_APP_ID}/${roomName}`,
          jwt: token,
          parentNode: mountRef.current as unknown as HTMLElement,
          width: '100%',
          height: '100%',
          userInfo: { displayName: profile?.display_name ?? 'Guest' },
          // Keep Jitsi's own pre-join screen (default: enabled) — it's where
          // Jitsi surfaces camera/mic device errors and lets the user join
          // audio-only or retry, instead of silently hanging on our spinner
          // if local media (camera already in use, no device, etc.) fails.
          configOverwrite: { disableDeepLinking: true },
        });
        apiRef.current = api;
        setStatus('ready');
        api.addEventListener('videoConferenceLeft', () => navigation.popToTop());
        api.addEventListener('readyToClose', () => navigation.popToTop());
        // This is a 1-on-1 room — if the other person leaves, the call is
        // over for us too. Without this, hanging up on one side leaves the
        // other person stuck looking at an empty room until they notice and
        // hang up manually themselves.
        api.addEventListener('participantLeft', () => navigation.popToTop());
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setError('Could not load the video call. Check your connection and try again.');
        }
      });

    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [roomName, token, profile?.display_name, navigation]);

  useEffect(() => {
    if (declinedMatchId !== matchId) return;
    setDeclined(true);
    acknowledgeDecline();
    // The callee never joined the room, so there's no Jitsi participant
    // event to catch this the way an in-progress hangup is handled — show
    // the banner briefly, then leave on the caller's behalf so they're not
    // left sitting alone in an empty room indefinitely.
    apiRef.current?.dispose();
    apiRef.current = null;
    const timer = setTimeout(() => navigation.popToTop(), 2000);
    return () => clearTimeout(timer);
  }, [declinedMatchId, matchId, acknowledgeDecline, navigation]);

  return (
    <ScreenContainer style={styles.container}>
      {declined && <Text style={styles.declinedBanner}>They declined the call.</Text>}
      <View style={styles.videoArea}>
        <View ref={mountRef} style={StyleSheet.absoluteFill} />
        {status !== 'ready' && (
          <View style={[StyleSheet.absoluteFill, styles.centerOverlay]}>
            {status === 'loading' && <ActivityIndicator color={colors.primary} />}
            <Text style={styles.statusText}>{status === 'error' ? error : 'Loading…'}</Text>
          </View>
        )}
      </View>

      <PrimaryButton
        title="End call"
        onPress={() => {
          apiRef.current?.executeCommand('hangup');
          navigation.popToTop();
        }}
        variant="danger"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, justifyContent: 'center' },
  videoArea: {
    height: 480,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  centerOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  statusText: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', paddingHorizontal: spacing.lg },
  declinedBanner: {
    color: colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
