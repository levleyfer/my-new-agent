import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getMatch, listMessages, sendMessage } from '../api/client';
import { ApiError, ChatMessage, Match } from '../api/types';
import Avatar from '../components/Avatar';
import OnlineBadge from '../components/OnlineBadge';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { useIncomingCall } from '../context/IncomingCallContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { matchId } = route.params;
  const { token, profile } = useAuth();
  const { lastMessage } = useIncomingCall();
  const [match, setMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const [matchResult, messagesResult] = await Promise.all([
        getMatch(token, matchId),
        listMessages(token, matchId),
      ]);
      setMatch(matchResult);
      setMessages(messagesResult);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this chat.');
    }
  }, [token, matchId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    if (match) navigation.setOptions({ title: match.other_user.display_name });
  }, [match, navigation]);

  useEffect(() => {
    if (lastMessage?.matchId !== matchId) return;
    setMessages((prev) =>
      prev.some((m) => m.id === lastMessage.message.id) ? prev : [...prev, lastMessage.message],
    );
  }, [lastMessage, matchId]);

  const handleSend = async () => {
    const text = body.trim();
    if (!token || !text || sending) return;
    setError(null);
    setSending(true);
    try {
      const message = await sendMessage(token, matchId, text);
      setMessages((prev) => [...prev, message]);
      setBody('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {match && (
          <View style={styles.statusRow}>
            <Avatar avatarUrl={match.other_user.avatar_url} displayName={match.other_user.display_name} size={28} />
            <OnlineBadge isOnline={match.other_user.is_online} />
          </View>
        )}
        {error && <Text style={styles.error}>{error}</Text>}
        {loading || !match ? (
          <ActivityIndicator color={colors.primary} style={styles.center} />
        ) : (
          <FlatList
            data={[...messages].reverse()}
            keyExtractor={(item) => item.id}
            inverted
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>
                  Say hi to {match.other_user.display_name} — coordinate logistics, then meet up safely.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMine = item.sender_id === profile?.id;
              return (
                <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.body}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={handleSend}
            maxLength={2000}
          />
          <Pressable
            style={[styles.sendButton, (!body.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!body.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Ionicons name="send" size={18} color={colors.background} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  error: { color: colors.danger, textAlign: 'center', padding: spacing.sm },
  list: { padding: spacing.lg, flexGrow: 1, justifyContent: 'flex-end' },
  empty: { alignItems: 'center', marginTop: spacing.xxl, paddingHorizontal: spacing.xl },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', marginVertical: spacing.xs },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: radii.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  bubbleTheirs: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleText: { color: colors.textPrimary, fontSize: 15 },
  bubbleTextMine: { color: colors.background },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    color: colors.textPrimary,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.5 },
});
