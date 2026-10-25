import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeView } from '../components/BarcodeView';
import { Btn, Field, Label, T } from '../components/ui';
import { BarcodeFormat, detectFormat, FORMAT_LIST, FORMATS, isFormat, isValidFor } from '../lib/barcode';
import { NOTE_MAX, useCards } from '../lib/cards';
import { cardColors, colors, fonts } from '../lib/theme';

type Params = { id?: string; code?: string; format?: string };

const NUMERIC_FORMATS: BarcodeFormat[] = ['ean13', 'ean8', 'upc_a', 'upc_e', 'itf14'];

export default function Edit() {
  const params = useLocalSearchParams<Params>();
  const { get, add, update, remove, findDuplicate } = useCards();
  const insets = useSafeAreaInsets();
  const existing = params.id ? get(params.id) : undefined;
  const fromScan = !existing && !!params.code;

  const [name, setName] = useState(existing?.name ?? '');
  const [code, setCode] = useState(existing?.code ?? params.code ?? '');
  // Per l'inserimento manuale il formato si deduce dal numero, salvo scelta esplicita.
  const [choice, setChoice] = useState<BarcodeFormat | 'auto'>(
    existing?.format ?? (isFormat(params.format) ? params.format : 'auto'),
  );
  const [color, setColor] = useState(existing?.color ?? cardColors[0]);
  const [note, setNote] = useState(existing?.note ?? '');

  const trimmedCode = code.trim();
  const format = choice === 'auto' ? detectFormat(trimmedCode) : choice;
  const valid = name.trim().length > 0 && isValidFor(format, trimmedCode);

  const confirmDelete = () => {
    if (!existing) return;
    Alert.alert('elimina', `eliminare "${existing.name}"?`, [
      { text: 'annulla', style: 'cancel' },
      {
        text: 'elimina',
        style: 'destructive',
        onPress: () => {
          remove(existing.id);
          router.dismissTo('/');
        },
      },
    ]);
  };

  const save = () => {
    const trimmedNote = note.trim();
    const draft = {
      name: name.trim(),
      code: trimmedCode,
      format,
      color,
      ...(trimmedNote ? { note: trimmedNote } : {}),
    };
    if (existing) {
      update(existing.id, draft);
      router.back();
      return;
    }
    const doSave = () => {
      const card = add(draft);
      router.replace({ pathname: '/card/[id]', params: { id: card.id } });
    };
    const dup = findDuplicate(draft);
    if (dup) {
      Alert.alert('duplicato', `questo codice è già salvato come "${dup.name}". salvare comunque?`, [
        { text: 'annulla', style: 'cancel' },
        { text: 'salva', onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Stack.Screen options={{ title: existing ? '> modifica' : '> nuova carta' }} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {fromScan && <T style={styles.ok}>✓ letto: {FORMATS[format].label}</T>}

        <Field
          label="nome"
          value={name}
          onChangeText={setName}
          placeholder="es. Esselunga"
          autoFocus={!existing}
          autoCapitalize="words"
          maxLength={40}
        />

        <Field
          label="codice"
          value={code}
          onChangeText={setCode}
          placeholder="numero della carta"
          autoCapitalize="none"
          keyboardType={choice !== 'auto' && NUMERIC_FORMATS.includes(choice) ? 'number-pad' : 'default'}
        />

        <View style={styles.group}>
          <Label>formato</Label>
          <View style={styles.chips}>
            {(['auto', ...FORMAT_LIST] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setChoice(f)}
                style={[styles.chip, f === choice && styles.chipActive]}
              >
                <T style={[styles.chipText, f === choice && { color: colors.bg }]}>
                  {f === 'auto' ? 'AUTO' : FORMATS[f].label}
                </T>
              </Pressable>
            ))}
          </View>
          <T style={styles.hint}>
            {choice === 'auto'
              ? `→ ${FORMATS[format].label}. riconosce EAN-13/EAN-8/UPC-A dal numero, altrimenti usa CODE128, che va bene per qualsiasi codice.`
              : 'se in cassa il codice non viene letto, prova AUTO o CODE128.'}
          </T>
        </View>

        <View style={styles.group}>
          <Label>colore</Label>
          <View style={styles.chips}>
            {cardColors.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[styles.swatch, { backgroundColor: c }, c === color && styles.swatchActive]}
              />
            ))}
          </View>
        </View>

        <Field
          label={`note · ${note.length}/${NOTE_MAX}`}
          value={note}
          onChangeText={setNote}
          placeholder="facoltative, es. carta di casa, punti in scadenza a dicembre"
          multiline
          maxLength={NOTE_MAX}
          style={styles.note}
        />

        {trimmedCode.length > 0 && (
          <View style={styles.group}>
            <Label>anteprima</Label>
            <BarcodeView format={format} code={trimmedCode} />
          </View>
        )}

        {existing && (
          <Btn label="elimina carta" variant="danger" onPress={confirmDelete} style={styles.delete} />
        )}
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Btn label="annulla" onPress={() => router.back()} style={styles.flex} />
        <Btn label="salva" variant="primary" onPress={save} disabled={!valid} style={styles.flex} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 20 },
  ok: { color: colors.accent },
  group: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, fontFamily: fonts.medium },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  note: { minHeight: 72, textAlignVertical: 'top' },
  delete: { marginTop: 24 },
  swatch: { width: 36, height: 36, borderRadius: 4, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: colors.text, transform: [{ scale: 1.1 }] },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  flex: { flex: 1 },
});
