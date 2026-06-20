import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReportReason } from '../api/types';
import { colors, radii, spacing, typography } from '../theme/theme';
import PrimaryButton from './PrimaryButton';
import TextField from './TextField';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_behavior', label: 'Inappropriate behavior' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
];

interface Props {
  visible: boolean;
  displayName: string;
  onClose: () => void;
  onBlock: () => void;
  onReport: (reason: ReportReason, details?: string) => void;
}

type Stage = 'menu' | 'reportReason' | 'reportDetails' | 'done';

export default function SafetyMenu({ visible, displayName, onClose, onBlock, onReport }: Props) {
  const [stage, setStage] = useState<Stage>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');

  const reset = () => {
    setStage('menu');
    setReason(null);
    setDetails('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmitReport = () => {
    if (!reason) return;
    onReport(reason, details || undefined);
    setStage('done');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {stage === 'menu' && (
            <>
              <Text style={typography.label}>{displayName}</Text>
              <Pressable style={styles.option} onPress={() => setStage('reportReason')}>
                <Text style={styles.optionText}>Report</Text>
              </Pressable>
              <Pressable
                style={styles.option}
                onPress={() => {
                  onBlock();
                  handleClose();
                }}
              >
                <Text style={[styles.optionText, styles.danger]}>Block</Text>
              </Pressable>
              <Pressable style={styles.option} onPress={handleClose}>
                <Text style={styles.optionText}>Cancel</Text>
              </Pressable>
            </>
          )}

          {stage === 'reportReason' && (
            <>
              <Text style={typography.label}>Why are you reporting {displayName}?</Text>
              {REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  style={styles.option}
                  onPress={() => {
                    setReason(r.value);
                    setStage('reportDetails');
                  }}
                >
                  <Text style={styles.optionText}>{r.label}</Text>
                </Pressable>
              ))}
              <Pressable style={styles.option} onPress={handleClose}>
                <Text style={styles.optionText}>Cancel</Text>
              </Pressable>
            </>
          )}

          {stage === 'reportDetails' && (
            <>
              <Text style={typography.label}>Anything else we should know? (optional)</Text>
              <TextField
                placeholder="Add details..."
                value={details}
                onChangeText={setDetails}
                multiline
                style={styles.detailsInput}
              />
              <PrimaryButton title="Submit report" onPress={handleSubmitReport} />
              <Pressable style={styles.option} onPress={handleClose}>
                <Text style={styles.optionText}>Cancel</Text>
              </Pressable>
            </>
          )}

          {stage === 'done' && (
            <>
              <Text style={typography.label}>Report submitted</Text>
              <Text style={[typography.caption, styles.thanksText]}>
                Thanks for letting us know — our team will review it.
              </Text>
              <PrimaryButton title="Close" onPress={handleClose} />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  option: { paddingVertical: spacing.md },
  optionText: { fontSize: 15, color: colors.textPrimary },
  danger: { color: colors.danger },
  detailsInput: { minHeight: 80, textAlignVertical: 'top' },
  thanksText: { marginBottom: spacing.md },
});
