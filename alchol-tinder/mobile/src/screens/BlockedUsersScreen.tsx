import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { listBlockedUsers, unblockUser } from '../api/client';
import { ApiError, UserProfile } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { colors, radii, spacing } from '../theme/theme';

export default function BlockedUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      setUsers(await listBlockedUsers(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load blocked users.');
    }
  }, [token]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const handleUnblock = async (userId: string) => {
    if (!token) return;
    setUnblockingId(userId);
    try {
      await unblockUser(token, userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not unblock this user.');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <ScreenContainer>
      {error && <Text style={styles.error}>{error}</Text>}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.center} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.name}>{item.display_name}</Text>
              <PrimaryButton
                title="Unblock"
                variant="ghost"
                loading={unblockingId === item.id}
                onPress={() => handleUnblock(item.id)}
              />
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1 },
  error: { color: colors.danger, marginHorizontal: spacing.xl, marginTop: spacing.md },
  list: { padding: spacing.xl, flexGrow: 1 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
});
