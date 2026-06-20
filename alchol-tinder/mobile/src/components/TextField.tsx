import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { colors, radii, spacing } from '../theme/theme';

export default function TextField(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
