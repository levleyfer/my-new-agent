import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { colors } from '../theme/theme';

export default function ScreenContainer({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
