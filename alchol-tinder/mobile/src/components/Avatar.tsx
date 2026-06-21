import { Image, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '../api/config';
import { colors } from '../theme/theme';

interface Props {
  avatarUrl: string | null;
  displayName: string;
  size?: number;
  /** Unread message count for this person's chat — shown as a small numeric badge on the avatar. Omit or 0 to hide. */
  unreadCount?: number;
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

export default function Avatar({ avatarUrl, displayName, size = 40, unreadCount = 0 }: Props) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  const badge = unreadCount > 0 && (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
    </View>
  );

  if (avatarUrl) {
    return (
      <View>
        <Image source={{ uri: `${API_BASE_URL}${avatarUrl}` }} style={[styles.image, dimensionStyle]} />
        {badge}
      </View>
    );
  }

  return (
    <View>
      <View style={[styles.fallback, dimensionStyle]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{initials(displayName)}</Text>
      </View>
      {badge}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surface },
  fallback: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: { color: colors.primary, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  badgeText: { color: colors.white, fontSize: 10.5, fontWeight: '700' },
});
