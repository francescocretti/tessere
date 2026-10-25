import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Field, T } from '../components/ui';
import { FORMATS } from '../lib/barcode';
import { sortCards, useCards } from '../lib/cards';
import { colors, fonts } from '../lib/theme';

export default function Home() {
  const { cards } = useCards();
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = sortCards(cards);
    return q
      ? sorted.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.code.toLowerCase().includes(q) ||
            !!c.note?.toLowerCase().includes(q),
        )
      : sorted;
  }, [cards, query]);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/backup')} hitSlop={12}>
              <T style={styles.headerAction}>backup</T>
            </Pressable>
          ),
        }}
      />

      {cards.length > 0 && (
        <View style={styles.search}>
          <Field
            label={`cerca · ${visible.length}/${cards.length}`}
            value={query}
            onChangeText={setQuery}
            placeholder="grep..."
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
      )}

      <FlatList
        data={visible}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            {cards.length === 0 ? (
              <>
                <T style={styles.emptyTitle}>$ ls tessere/</T>
                <T style={styles.muted}>nessuna carta. scansionane una per iniziare_</T>
              </>
            ) : (
              <T style={styles.muted}>nessun risultato per {`"${query}"`}</T>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/card/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}
          >
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <View style={styles.rowText}>
              <T style={styles.name} numberOfLines={1}>
                {item.name}
              </T>
              <T style={styles.muted} numberOfLines={1}>
                {FORMATS[item.format].label.toLowerCase()} · {item.code}
              </T>
            </View>
            <T style={styles.chevron}>›</T>
          </Pressable>
        )}
      />

      <View style={[styles.actions, { paddingBottom: insets.bottom + 12 }]}>
        <Btn label="+ scansiona" variant="primary" onPress={() => router.push('/scan')} style={{ flex: 1 }} />
        <Btn label="+ manuale" onPress={() => router.push('/edit')} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerAction: { color: colors.muted, fontSize: 14 },
  search: { paddingHorizontal: 16, paddingBottom: 8 },
  list: { paddingVertical: 8, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  swatch: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  rowText: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.medium, fontSize: 16 },
  muted: { color: colors.muted, fontSize: 12 },
  chevron: { color: colors.muted, fontSize: 22 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, padding: 32 },
  emptyTitle: { color: colors.accent },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
