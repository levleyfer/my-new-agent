import { Image, StyleSheet, Text, View } from 'react-native';

import { API_BASE_URL } from '../api/config';
import { colors } from '../theme/theme';

interface Props {
  avatarUrl: string | null;
  displayName: string;
  size?: number;
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || '?';
}

export default function Avatar({ avatarUrl, displayName, size = 40 }: Props) {
  const dimensionStyle = { width: size, height: size, borderRadius: size / 2 };

  if (avatarUrl) {
    return <Image source={{ uri: `${API_BASE_URL}${avatarUrl}` }} style={[styles.image, dimensionStyle]} />;
  }

  return (
    <View style={[styles.fallback, dimensionStyle]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{initials(displayName)}</Text>
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
});
