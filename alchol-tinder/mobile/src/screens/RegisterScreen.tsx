import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import PrimaryButton from '../components/PrimaryButton';
import TextField from '../components/TextField';
import { ApiError } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme/theme';
import { isOfAge, isValidDateString, MIN_AGE } from '../utils/age';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!email || !password || !displayName || !birthDate) {
      setError('All fields are required.');
      return;
    }
    if (!isValidDateString(birthDate)) {
      setError('Birth date must be in YYYY-MM-DD format.');
      return;
    }
    if (!isOfAge(birthDate)) {
      // Client-side check for fast feedback — the backend enforces this too
      // and is the actual source of truth for the age gate.
      setError(`You must be at least ${MIN_AGE} to use this app.`);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email,
        password,
        display_name: displayName,
        birth_date: birthDate,
      });
      // On success the AuthContext token updates and the root navigator
      // switches to the authenticated stack automatically.
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.emoji}>🍷</Text>
        <Text style={typography.title}>Create your profile</Text>
        <Text style={[typography.subtitle, styles.subtitle]}>You must be 18+ to join.</Text>

        <TextField
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
        <TextField placeholder="Display name" value={displayName} onChangeText={setDisplayName} />
        <TextField placeholder="Birth date (YYYY-MM-DD)" value={birthDate} onChangeText={setBirthDate} />

        {error && <Text style={styles.error}>{error}</Text>}

        <PrimaryButton title="Sign up" onPress={handleSubmit} loading={submitting} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  emoji: { fontSize: 40, marginBottom: spacing.md },
  subtitle: { marginBottom: spacing.xl },
  error: { color: colors.danger, marginBottom: spacing.md },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  linkText: { color: colors.primary, fontSize: 14 },
});
