import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken, unregisterPushToken } from '../api/client';
import { isViewingChat } from '../navigation/navigationRef';

/**
 * Push notification setup for the existing chat-unread system (see
 * IncomingCallContext.tsx). This file owns everything Expo-Notifications-
 * specific; it deliberately does not duplicate unread/badge state — it only
 * reads chatId off a notification payload and calls back into the existing
 * `markMatchRead` / navigation, exactly the way NewMessageToast already does
 * for the in-app banner.
 *
 * IMPORTANT (read before changing): remote push notifications are NOT
 * deliverable to Expo Go on Android as of SDK 53+ — only local notifications
 * still work there. iOS Expo Go can still receive pushes. See AGENTS.md /
 * the project notification report for the full explanation; this module
 * still registers tokens and renders correctly on both, it just won't
 * receive a remote push on Android Expo Go (a custom dev client / EAS build
 * is required there). None of this gates the code path — it works as soon
 * as the app runs in a build that supports it.
 */

// One-time handler: decides whether a notification that arrives while the
// app is in the FOREGROUND should actually be shown to the user. We suppress
// it only when the user is already looking at the exact chat it's about —
// otherwise (different chat, Discover screen, etc.) showing it is correct,
// matching how NewMessageToast's isViewingChat check works for the in-app banner.
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const chatId = notification.request.content.data?.chatId as string | undefined;
    const shouldShow = !chatId || !isViewingChat(chatId);
    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: true,
      shouldShowBanner: shouldShow,
      shouldShowList: shouldShow,
    };
  },
});

/**
 * Requests notification permission (if not already granted/denied) and, if
 * granted, registers an Expo push token with the backend for the current
 * user + device. Safe to call every time the user logs in — registering an
 * already-known token is a harmless upsert (see backend push_tokens router).
 *
 * Resolves to nothing actionable if permission is denied or this is running
 * somewhere push tokens don't make sense (web, simulator/emulator): the app
 * must keep working with no push, per the task's "handle denial gracefully"
 * requirement. Never throws.
 */
export async function registerForPushNotificationsAsync(authToken: string): Promise<void> {
  if (Platform.OS === 'web') return; // expo-notifications push tokens aren't applicable on web

  // Push tokens require a physical device — both iOS and Android simulators/
  // emulators have no APNs/FCM connection, so getExpoPushTokenAsync would
  // either throw or return a token nothing can deliver to.
  if (!Device.isDevice) return;

  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return; // user declined — app continues with no push, by design

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Messages',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );

    await registerPushToken(authToken, pushToken);
  } catch {
    // Any failure here (permission API unavailable, network error registering
    // with the backend, etc.) must not block login or break the rest of the
    // app — push is an enhancement, not a requirement.
  }
}

/**
 * Removes this device's push token from the backend on logout, so a signed-
 * out device stops receiving pushes for an account it's no longer using.
 * Best-effort: failures are swallowed since there's nothing the user can do
 * about a logout-time network blip, and the token will simply get pruned
 * later if it ever bounces (see backend services/push.py).
 */
export async function unregisterCurrentPushTokenAsync(authToken: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;
  try {
    const { data: pushToken } = await Notifications.getExpoPushTokenAsync();
    await unregisterPushToken(authToken, pushToken);
  } catch {
    // best-effort, see above
  }
}

/** Mirrors the OS app-icon badge count to the given total unread count. */
export async function syncBadgeCount(unreadCount: number): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.setBadgeCountAsync(unreadCount);
  } catch {
    // Badge APIs can be unavailable in some environments (e.g. certain
    // Android OEM launchers) — never let this crash the app.
  }
}
