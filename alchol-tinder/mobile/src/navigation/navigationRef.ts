import { createNavigationContainerRef } from '@react-navigation/native';

import { AppStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<AppStackParamList>();

export function isViewingChat(matchId: string): boolean {
  if (!navigationRef.isReady()) return false;
  const route = navigationRef.getCurrentRoute();
  return route?.name === 'Chat' && (route.params as { matchId?: string } | undefined)?.matchId === matchId;
}
