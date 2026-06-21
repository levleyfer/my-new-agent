import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { navigationRef } from '../navigation/navigationRef';

/**
 * Headless component (renders nothing) that makes tapping a chat push
 * notification deep-link into that exact chat — both for a warm tap (app
 * was backgrounded) and a cold-start tap (app was fully killed, the OS
 * launches it because of the tap).
 *
 * Reuses the existing unread system rather than tracking anything of its
 * own: navigating to 'Chat' is what makes ChatScreen mount and call
 * markMatchRead (see ChatScreen.tsx useEffect), which is what actually
 * clears the unread set, the Matches-tab red dot, and (via the badge-sync
 * effect elsewhere) the app icon badge. This component's only job is "get
 * the user to the right screen."
 */
export default function NotificationResponseHandler() {
  // Tracks whether the cold-start response (if any) has already been
  // consumed, so a re-render doesn't navigate twice for the same tap.
  const consumedColdStart = useRef(false);

  const navigateToChat = (chatId: string) => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Chat', { matchId: chatId });
    }
  };

  useEffect(() => {
    // Cold start: the app process didn't exist until the user tapped the
    // notification. getLastNotificationResponseAsync returns that original
    // tap once navigation is ready to receive it.
    (async () => {
      if (consumedColdStart.current) return;
      const response = await Notifications.getLastNotificationResponseAsync();
      const chatId = response?.notification.request.content.data?.chatId as string | undefined;
      if (chatId) {
        consumedColdStart.current = true;
        navigateToChat(chatId);
      }
    })();

    // Warm tap: app was already running (foreground or backgrounded) when
    // the user tapped the notification's banner/lock-screen entry.
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const chatId = response.notification.request.content.data?.chatId as string | undefined;
      if (chatId) navigateToChat(chatId);
    });

    return () => subscription.remove();
  }, []);

  return null;
}
