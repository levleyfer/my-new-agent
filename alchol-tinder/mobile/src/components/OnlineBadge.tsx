import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/theme';

export default function OnlineBadge({ isOnline }: { isOnline: boolean }) {
  const color = isOnline ? colors.success : colors.danger;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{isOnline ? 'Online' : 'Offline'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 12, fontWeight: '600' },
});
