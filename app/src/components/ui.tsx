import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

// Sur le web, Alert.alert n'affiche rien et window.confirm peut être bloqué (pages intégrées) :
// on affiche nos propres boîtes de dialogue via <DialogHost />. Sur mobile, les natives.
type Dialog = { title: string; message: string; okLabel?: string; onOk?: () => void; destructive?: boolean };
let showDialog: ((d: Dialog) => void) | null = null;

export function notify(title: string, message = '') {
  if (Platform.OS === 'web' && showDialog) return showDialog({ title, message });
  Alert.alert(title, message || undefined);
}

export function confirm(title: string, message: string, okLabel: string, onOk: () => void, destructive = false) {
  if (Platform.OS === 'web' && showDialog) return showDialog({ title, message, okLabel, onOk, destructive });
  Alert.alert(title, message, [
    { text: 'Annuler', style: 'cancel' },
    { text: okLabel, style: destructive ? 'destructive' : 'default', onPress: onOk },
  ]);
}

export function DialogHost() {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  useEffect(() => {
    showDialog = setDialog;
    return () => {
      showDialog = null;
    };
  }, []);
  if (!dialog) return null;
  const close = () => setDialog(null);
  return (
    <Modal transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { width: '100%', maxWidth: 380 }]}>
          <Text style={styles.h2}>{dialog.title}</Text>
          {dialog.message ? <Text style={styles.text}>{dialog.message}</Text> : null}
          <View style={{ gap: 8, marginTop: 6 }}>
            {dialog.onOk && (
              <Button
                title={dialog.okLabel ?? 'OK'}
                variant={dialog.destructive ? 'danger' : 'primary'}
                onPress={() => {
                  close();
                  dialog.onOk?.();
                }}
              />
            )}
            <Button title={dialog.onOk ? 'Annuler' : 'OK'} variant={dialog.onOk ? 'secondary' : 'primary'} onPress={close} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export const colors = {
  bg: '#F5F6F8',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  warn: '#B45309',
  warnBg: '#FEF3C7',
  success: '#15803D',
  danger: '#B91C1C',
};

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.primaryText : colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            { color: primary ? colors.primaryText : variant === 'danger' ? colors.danger : colors.primary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: { backgroundColor: colors.card, borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: colors.border },
  h2: { fontSize: 17, fontWeight: '700', color: colors.text },
  text: { fontSize: 15, color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.primary },
  buttonSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  buttonText: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
});
