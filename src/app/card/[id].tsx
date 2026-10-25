import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarcodeView } from '../../components/BarcodeView';
import { Btn, T } from '../../components/ui';
import { FORMATS } from '../../lib/barcode';
import { useCards } from '../../lib/cards';
import { colors, fonts } from '../../lib/theme';
import { useMaxBrightness } from '../../lib/useMaxBrightness';

export default function CardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { get } = useCards();
  const card = get(id);
  const insets = useSafeAreaInsets();
  useMaxBrightness();

  if (!card) {
    return (
      <View style={[styles.screen, styles.content]}>
        <T style={styles.muted}>carta non trovata.</T>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: '' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={[styles.swatch, { backgroundColor: card.color }]} />
          <T style={styles.name} numberOfLines={2}>
            {card.name}
          </T>
        </View>
        <BarcodeView format={card.format} code={card.code} />
        {!!card.note && (
          <T style={styles.note} selectable>
            {card.note}
          </T>
        )}
        <T style={styles.muted}>
          {FORMATS[card.format].label.toLowerCase()} · luminosità al massimo
        </T>
      </ScrollView>
      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Btn
          label="modifica"
          onPress={() => router.push({ pathname: '/edit', params: { id: card.id } })}
          style={styles.flex}
        />
        <Btn
          label="condividi"
          onPress={() => router.push({ pathname: '/share/[id]', params: { id: card.id } })}
          style={styles.flex}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 20, flexGrow: 1, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 6, height: 32, borderRadius: 3 },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 26 },
  muted: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  note: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: 12,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
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
