import { Image, StyleSheet, View } from 'react-native';

import { API_BASE_URL } from '../../api/config';
import { colors } from '../../theme/tokens';
import Text from './Text';

export interface AvatarProps {
  avatarUrl: string | null;
  displayName: string;
  size?: number;
  /** Draws a gold ring around the avatar — used to visually distinguish verified users. */
  verified?: boolean;
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

/**
 * Design-system Avatar primitive (token-wired). Same props/behavior as the
 * existing app-wide `components/Avatar.tsx` plus an additive `verified` ring,
 * so it is a drop-in replacement wherever it's adopted.
 */
export default function Avatar({ avatarUrl, displayName, size = 40, verified = false }: AvatarProps) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };
  const ringStyle = verified
    ? { borderWidth: 2, borderColor: colors.gold.default }
    : { borderWidth: 1, borderColor: colors.border.default };

  if (avatarUrl) {
    return <Image source={{ uri: `${API_BASE_URL}${avatarUrl}` }} style={[styles.image, dimensionStyle, ringStyle]} />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle, ringStyle]}>
      <Text variant="tag" color={colors.gold.default} style={{ fontSize: size * 0.4 }}>
        {initials(displayName)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: colors.surface.card },
  fallback: {
    backgroundColor: colors.surface.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
