import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../theme/theme';
import { MIN_AGE } from '../utils/age';

export interface DateOfBirthPickerProps {
  /** 'YYYY-MM-DD', or '' if nothing picked yet. */
  value: string;
  onChange: (value: string) => void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function parseValue(value: string): { day: number | null; month: number | null; year: number | null } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { day: null, month: null, year: null };
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function formatValue(day: number, month: number, year: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

type FieldKind = 'day' | 'month' | 'year';

/**
 * Three tappable fields (Day / Month / Year), each opening a scrollable list
 * to pick from — replaces free-text birth date entry so users can't submit a
 * malformed or invalid date (e.g. "Feb 30th").
 */
export default function DateOfBirthPicker({ value, onChange }: DateOfBirthPickerProps) {
  const [openField, setOpenField] = useState<FieldKind | null>(null);
  const { day, month, year } = parseValue(value);

  const currentYear = new Date().getFullYear();
  const latestYear = currentYear - MIN_AGE;
  const earliestYear = currentYear - 100;
  const years = Array.from({ length: latestYear - earliestYear + 1 }, (_, i) => latestYear - i);
  const maxDay = month && year ? daysInMonth(month, year) : 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const months = MONTH_NAMES.map((label, i) => ({ label, value: i + 1 }));

  const select = (field: FieldKind, newValue: number) => {
    const nextDay = field === 'day' ? newValue : day;
    const nextMonth = field === 'month' ? newValue : month;
    const nextYear = field === 'year' ? newValue : year;
    setOpenField(null);
    if (nextDay && nextMonth && nextYear) {
      // Clamp day if the newly chosen month/year makes the previous day invalid
      // (e.g. day 31 selected, then month changes to February).
      const clampedDay = Math.min(nextDay, daysInMonth(nextMonth, nextYear));
      onChange(formatValue(clampedDay, nextMonth, nextYear));
    }
  };

  const renderOptions = () => {
    if (openField === 'day') {
      return days.map((d) => ({ key: String(d), label: String(d), onPress: () => select('day', d) }));
    }
    if (openField === 'month') {
      return months.map((m) => ({ key: String(m.value), label: m.label, onPress: () => select('month', m.value) }));
    }
    if (openField === 'year') {
      return years.map((y) => ({ key: String(y), label: String(y), onPress: () => select('year', y) }));
    }
    return [];
  };

  return (
    <>
      <View style={styles.row}>
        <PickerField label="Day" displayValue={day ? String(day) : undefined} onPress={() => setOpenField('day')} />
        <PickerField
          label="Month"
          displayValue={month ? MONTH_NAMES[month - 1] : undefined}
          onPress={() => setOpenField('month')}
        />
        <PickerField
          label="Year"
          displayValue={year ? String(year) : undefined}
          onPress={() => setOpenField('year')}
          flex={1.3}
        />
      </View>

      <Modal visible={openField !== null} transparent animationType="fade" onRequestClose={() => setOpenField(null)}>
        <Pressable style={styles.overlay} onPress={() => setOpenField(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>
              {openField === 'day' ? 'Day' : openField === 'month' ? 'Month' : 'Year'}
            </Text>
            <FlatList
              data={renderOptions()}
              keyExtractor={(item) => item.key}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable style={styles.option} onPress={item.onPress}>
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function PickerField({
  label,
  displayValue,
  onPress,
  flex = 1,
}: {
  label: string;
  displayValue?: string;
  onPress: () => void;
  flex?: number;
}) {
  return (
    <Pressable style={[styles.field, { flex }]} onPress={onPress}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={displayValue ? styles.fieldValue : styles.fieldPlaceholder}>{displayValue ?? '—'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  field: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  fieldLabel: { fontSize: 11, color: colors.textMuted, marginBottom: 2 },
  fieldValue: { fontSize: 16, color: colors.textPrimary, fontWeight: '600' },
  fieldPlaceholder: { fontSize: 16, color: colors.textMuted },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheet: {
    width: 240,
    maxHeight: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  list: { maxHeight: 300 },
  option: { paddingVertical: spacing.sm, alignItems: 'center' },
  optionText: { fontSize: 16, color: colors.textPrimary },
});
