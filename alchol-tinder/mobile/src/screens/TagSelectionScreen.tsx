import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { listTags, updateMyTags } from '../api/client';
import { ApiError, Tag } from '../api/types';
import PrimaryButton from '../components/PrimaryButton';
import ScreenContainer from '../components/ScreenContainer';
import { useAuth } from '../context/AuthContext';
import { AppStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TagSelection'>;

const CATEGORY_LABELS: Record<Tag['category'], string> = {
  taste: 'Taste / Drink',
  vibe: 'Vibe',
  logistics: 'Logistics',
};

// These two logistics tags are safety primitives (see CLAUDE.md), not just
// preferences — they get their own elevated UI instead of sitting in the
// generic chip grid.
const SAFETY_TAG_NAMES = new Set(['prefer public place', 'virtual cheers first']);

const SAFETY_TAG_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; description: string }> = {
  'prefer public place': {
    icon: 'storefront-outline',
    description: 'Matches will see you’d rather meet somewhere public first.',
  },
  'virtual cheers first': {
    icon: 'videocam-outline',
    description: 'A quick video hello before meeting up, to confirm it’s really them.',
  },
};

export default function TagSelectionScreen({ navigation }: Props) {
  const { token, profile, refreshProfile } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTags()
      .then(setTags)
      .catch(() => setError('Could not load tags.'))
      .finally(() => setLoading(false));
    if (profile) {
      setSelected(new Set(profile.tags.map((t) => t.id)));
    }
  }, [profile]);

  const safetyTags = useMemo(() => tags.filter((t) => SAFETY_TAG_NAMES.has(t.name)), [tags]);

  const grouped = useMemo(() => {
    const byCategory = new Map<Tag['category'], Tag[]>();
    for (const tag of tags) {
      if (SAFETY_TAG_NAMES.has(tag.name)) continue;
      const list = byCategory.get(tag.category) ?? [];
      list.push(tag);
      byCategory.set(tag.category, list);
    }
    return byCategory;
  }, [tags]);

  const toggle = (tagId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      await updateMyTags(token, Array.from(selected));
      await refreshProfile();
      // Reached during onboarding (no back stack) vs. editing from Profile
      // (pushed on top of it) need different "done" behavior.
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.replace('Discover');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save tags.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={typography.title}>What are you into tonight?</Text>
        <Text style={[typography.subtitle, styles.subtitle]}>
          Pick what fits your vibe and taste — matching is never about how much you drink.
        </Text>

        <View style={styles.safetyBox}>
          <View style={styles.safetyHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={styles.safetyTitle}>Meet safely</Text>
          </View>
          {safetyTags.map((tag) => {
            const meta = SAFETY_TAG_META[tag.name];
            const isSelected = selected.has(tag.id);
            return (
              <View key={tag.id} style={styles.safetyRow}>
                <Ionicons
                  name={meta?.icon ?? 'shield-checkmark-outline'}
                  size={22}
                  color={isSelected ? colors.primary : colors.textMuted}
                  style={styles.safetyIcon}
                />
                <View style={styles.safetyTextCol}>
                  <Text style={styles.safetyLabel}>{tag.name}</Text>
                  {meta?.description && <Text style={styles.safetyDescription}>{meta.description}</Text>}
                </View>
                <Switch
                  value={isSelected}
                  onValueChange={() => toggle(tag.id)}
                  trackColor={{ false: colors.surface, true: colors.primaryMuted }}
                  thumbColor={isSelected ? colors.primary : colors.textMuted}
                />
              </View>
            );
          })}
        </View>

        {Array.from(grouped.entries()).map(([category, categoryTags]) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{CATEGORY_LABELS[category]}</Text>
            <View style={styles.chipRow}>
              {categoryTags.map((tag) => {
                const isSelected = selected.has(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggle(tag.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {tag.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title="Continue" onPress={handleSave} loading={saving} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: spacing.xl, paddingBottom: 110 },
  subtitle: { marginBottom: spacing.xl },
  safetyBox: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.accentMuted,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  safetyTitle: { ...typography.label },
  safetyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  safetyIcon: { width: 22 },
  safetyTextCol: { flex: 1 },
  safetyLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  safetyDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.label, marginBottom: spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.textSecondary },
  chipTextSelected: { color: colors.background, fontWeight: '600' },
  error: { color: colors.danger, marginTop: spacing.sm },
  footer: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.xl,
    right: spacing.xl,
  },
});
