import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInputProps, View } from 'react-native';

import { colors, spacing } from '../theme/theme';
import TextField from './TextField';

/** Password input with a show/hide toggle, so users can check what they typed before submitting. */
export default function PasswordField(props: Omit<TextInputProps, 'secureTextEntry'>) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextField {...props} secureTextEntry={!visible} style={styles.input} />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        style={styles.toggle}
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        accessibilityRole="button"
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  input: { paddingRight: 44 },
  toggle: {
    position: 'absolute',
    right: 14,
    top: 0,
    // TextField has its own marginBottom — stop the icon's box there too, so
    // it centers on the input itself rather than the input-plus-margin gap.
    bottom: spacing.md,
    justifyContent: 'center',
  },
});
