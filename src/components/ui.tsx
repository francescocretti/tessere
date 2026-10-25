import { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextProps, View, ViewStyle } from 'react-native';

import { colors, fonts } from '../lib/theme';

export function T({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.text, style]} />;
}

type BtnProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'default' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
};

/** Pulsante in stile terminale: `[ etichetta ]`. */
export function Btn({ label, onPress, variant = 'default', disabled, style }: BtnProps) {
  const color =
    variant === 'primary' ? colors.accent : variant === 'danger' ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: variant === 'default' ? colors.border : color },
        pressed && { backgroundColor: colors.surface },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <T style={[styles.btnLabel, { color }]}>[ {label} ]</T>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <T style={styles.label}>{label}</T>
      <TextInput
        placeholderTextColor={colors.muted}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        autoCorrect={false}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Label({ children }: { children: string }) {
  return <T style={styles.label}>{children}</T>;
}

const styles = StyleSheet.create({
  text: { color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  btn: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  btnLabel: { fontFamily: fonts.medium },
  field: { gap: 6 },
  label: { color: colors.muted, fontSize: 12, textTransform: 'lowercase' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: 16,
    backgroundColor: colors.surface,
  },
});
