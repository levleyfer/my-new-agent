import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import TextField from '../components/TextField';
import { ApiError } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer style={styles.container}>
        <Text style={styles.emoji}>🥂</Text>
        <Text style={typography.title}>Welcome back</Text>
        <Text style={[typography.subtitle, styles.subtitle]}>Good to see you again.</Text>

        <TextField
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton title="Log in" onPress={handleSubmit} loading={submitting} />

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={styles.linkText}>No account? Sign up</Text>
        </TouchableOpacity>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { justifyContent: 'center', padding: spacing.xl },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  subtitle: { marginBottom: spacing.xl },
  error: { color: colors.danger, marginBottom: spacing.md },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14 },
});
