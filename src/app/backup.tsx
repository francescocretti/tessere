import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { Btn, T } from '../components/ui';
import { useCards } from '../lib/cards';
import { colors } from '../lib/theme';
import { exportJson, pickJson } from '../lib/transfer';

export default function Backup() {
  const { cards, importMany } = useCards();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      Alert.alert('errore', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onImport = () =>
    run(async () => {
      const picked = await pickJson();
      if (!picked) return;
      const { added, skipped } = importMany(picked.drafts);
      const lines = [`${added} importate`, `${skipped} già presenti`];
      if (picked.invalid) lines.push(`${picked.invalid} non valide`);
      Alert.alert('import completato', lines.join('\n'));
    });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <T style={styles.heading}># esporta</T>
        <T style={styles.muted}>
          salva tutte le {cards.length} carte in un file JSON da tenere come backup o mandare a un
          amico.
        </T>
        <Btn label="esporta JSON" variant="primary" disabled={busy || !cards.length} onPress={() => run(() => exportJson(cards))} />
      </View>

      <View style={styles.section}>
        <T style={styles.heading}># importa</T>
        <T style={styles.muted}>
          aggiunge le carte da un file JSON. quelle con lo stesso codice vengono saltate.
        </T>
        <Btn label="importa JSON" disabled={busy} onPress={onImport} />
      </View>

      <T style={styles.footer}>tessere v{Constants.expoConfig?.version ?? '?'}</T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 32 },
  section: { gap: 12 },
  heading: { color: colors.accent },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  footer: { color: colors.border, fontSize: 12, textAlign: 'center' },
});
