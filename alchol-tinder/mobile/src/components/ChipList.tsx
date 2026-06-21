import { StyleSheet, View } from 'react-native';

import Chip from './Chip';
import { spacing } from '../theme/theme';

const MAX_VISIBLE_CHIPS = 5;

interface Props {
  /** Tags shared with the current user — rendered first, styled gold. */
  sharedTags: string[];
  /** Tags not shared with the current user — rendered after shared, styled muted. */
  otherTags: string[];
}

/**
 * Renders up to MAX_VISIBLE_CHIPS tag chips, prioritizing shared tags over
 * other tags. If there are more tags than fit, a final "+N more" chip is
 * shown instead of overflowing the row.
 *
 * Logistics tags (available now/tonight, nearby, etc.) must NOT be passed in
 * here — that state is already communicated by the availability toggle and
 * the distance line, per the product's safety/UX rules.
 */
export default function ChipList({ sharedTags, otherTags }: Props) {
  const ordered = [
    ...sharedTags.map((label) => ({ label, variant: 'shared' as const })),
    ...otherTags.map((label) => ({ label, variant: 'muted' as const })),
  ];

  const visible = ordered.slice(0, MAX_VISIBLE_CHIPS);
  const remaining = ordered.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((tag, index) => (
        <Chip key={`${tag.variant}-${tag.label}-${index}`} label={tag.label} variant={tag.variant} />
      ))}
      {remaining > 0 && <Chip label={`+${remaining} more`} variant="muted" />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
