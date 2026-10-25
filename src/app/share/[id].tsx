import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { BarcodeView } from '../../components/BarcodeView';
import { T } from '../../components/ui';
import { useCards } from '../../lib/cards';
import { colors, fonts } from '../../lib/theme';
import { cardToQrPayload } from '../../lib/transfer';
import { useMaxBrightness } from '../../lib/useMaxBrightness';

export default function Share() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = useCards().get(id);
  useMaxBrightness();

  if (!card) return <T style={styles.muted}>carta non trovata.</T>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <T style={styles.name}>{card.name}</T>
      <BarcodeView format="qr" code={cardToQrPayload(card)} showText={false} />
      <T style={styles.muted}>
        dal telefono di un amico: Tessere {'>'} + scansiona, e inquadra questo QR.
      </T>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 20, flexGrow: 1, justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: 22, textAlign: 'center' },
  muted: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
