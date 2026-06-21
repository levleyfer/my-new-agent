import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme/theme';

export type TabKey = 'nearby' | 'matches' | 'profile';

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'nearby', label: 'Nearby', icon: 'wine' },
  { key: 'matches', label: 'Matches', icon: 'chatbubbles' },
  { key: 'profile', label: 'Profile', icon: 'person-circle' },
];

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

/**
 * Lightweight presentational tab bar (Nearby / Matches / Profile).
 *
 * Note: this app's navigation is a single native-stack (no
 * @react-navigation/bottom-tabs dependency installed), so this renders the
 * three-tab look from the spec while delegating the actual navigation to
 * whatever the host screen passes into `onChange` (typically
 * navigation.navigate(...) on the existing stack). Swapping this for a real
 * bottom-tab navigator later is a drop-in change since the visual contract
 * (active tab + gold highlight) stays the same.
 */
export default function BottomTabBar({ active, onChange }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable key={tab.key} style={styles.tab} onPress={() => onChange(tab.key)}>
            <Ionicons name={isActive ? tab.icon : `${tab.icon}-outline` as keyof typeof Ionicons.glyphMap} size={22} color={isActive ? colors.primary : colors.textMuted} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundAlt,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  label: { fontSize: 11.5, fontWeight: '600', color: colors.textMuted },
  labelActive: { color: colors.primary },
});
