import { useEffect } from 'react';

import { useIncomingCall } from '../context/IncomingCallContext';
import { syncBadgeCount } from '../notifications/setup';

/**
 * Headless component that keeps the native app-icon badge in sync with the
 * total unread message count (unreadCounts — see IncomingCallContext.tsx).
 * markMatchRead (called from ChatScreen on mount) removes that chat's entry,
 * which re-runs this effect and pushes the lower total down to the OS —
 * that's the "clear as chats are opened" behavior the task asks for, with no
 * separate state.
 */
export default function BadgeSync() {
  const { unreadCounts } = useIncomingCall();

  useEffect(() => {
    const total = [...unreadCounts.values()].reduce((sum, count) => sum + count, 0);
    syncBadgeCount(total);
  }, [unreadCounts]);

  return null;
}
