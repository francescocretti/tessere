import { BarcodeScanningResult, CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, T } from '../components/ui';
import { FORMAT_LIST, normalizeScannedType } from '../lib/barcode';
import { useCards } from '../lib/cards';
import { parseQrPayload } from '../lib/transfer';
import { colors } from '../lib/theme';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  const { add, findDuplicate } = useCards();
  // onBarcodeScanned scatta più volte per lo stesso codice: blocchiamo dopo la prima lettura.
  const locked = useRef(false);

  /** Gestisce un codice letto, dalla fotocamera o da un'immagine. */
  const handleCode = (data: string, type: string | number) => {
    locked.current = true;

    const shared = parseQrPayload(data);
    if (shared) {
      const dup = findDuplicate(shared);
      if (dup) {
        Alert.alert('già presente', `"${dup.name}" è già nelle tue tessere.`, [
          { text: 'ok', onPress: () => router.replace({ pathname: '/card/[id]', params: { id: dup.id } }) },
        ]);
        return;
      }
      Alert.alert('carta condivisa', `importare "${shared.name}"?`, [
        { text: 'annulla', style: 'cancel', onPress: () => (locked.current = false) },
        {
          text: 'importa',
          onPress: () => {
            const card = add(shared);
            router.replace({ pathname: '/card/[id]', params: { id: card.id } });
          },
        },
      ]);
      return;
    }

    router.replace({ pathname: '/edit', params: { code: data, format: normalizeScannedType(type) } });
  };

  const onCameraScanned = ({ data, type }: BarcodeScanningResult) => {
    if (locked.current || !data) return;
    handleCode(data, type);
  };

  /** Legge il codice da uno screenshot o da una foto. Con `crop` l'utente può ritagliare prima. */
  const scanImage = async (crop = false) => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: crop,
      quality: 1,
    });
    if (picked.canceled || locked.current) return;

    setBusy(true);
    try {
      const results = await scanFromURLAsync(picked.assets[0].uri, FORMAT_LIST);
      const hit = results.find((r) => r.data);
      if (hit) {
        handleCode(hit.data, hit.type);
      } else if (crop) {
        Alert.alert('nessun codice trovato', "prova con un'altra immagine, più nitida.");
      } else {
        Alert.alert('nessun codice trovato', "prova a ritagliare l'immagine attorno al codice.", [
          { text: 'annulla', style: 'cancel' },
          { text: 'ritaglia', onPress: () => scanImage(true) },
        ]);
      }
    } catch (e) {
      console.warn('Scansione da immagine fallita', e);
      const detail = e instanceof Error ? e.message : String(e);
      Alert.alert('errore', `impossibile leggere l'immagine.\n\n${detail}`);
    } finally {
      setBusy(false);
    }
  };

  if (!permission) return <View style={styles.screen} />;

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.center]}>
        <T style={styles.msg}>{"serve l'accesso alla fotocamera per leggere i codici."}</T>
        {permission.canAskAgain ? (
          <Btn label="concedi accesso" variant="primary" onPress={requestPermission} />
        ) : (
          <T style={styles.hint}>abilitalo dalle impostazioni di sistema.</T>
        )}
        <T style={styles.hint}>oppure</T>
        <Btn label="da immagine" onPress={() => scanImage()} disabled={busy} />
        <Btn label="annulla" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: FORMAT_LIST }}
        onBarcodeScanned={onCameraScanned}
      />
      <View style={[styles.overlay, { paddingTop: insets.top + 16 }]} pointerEvents="box-none">
        <T style={styles.title}>{busy ? '> analizzo immagine...' : '> inquadra il codice_'}</T>
        <View style={styles.frame} />
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.row}>
            <Btn
              label={torch ? 'torcia: on' : 'torcia: off'}
              onPress={() => setTorch((t) => !t)}
              style={styles.flex}
            />
            <Btn label="da immagine" onPress={() => scanImage()} disabled={busy} style={styles.flex} />
          </View>
          <Btn label="annulla" onPress={() => router.back()} style={styles.translucent} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', padding: 24, gap: 16, backgroundColor: colors.bg },
  msg: { textAlign: 'center' },
  hint: { color: colors.muted, textAlign: 'center' },
  overlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center' },
  title: {
    color: colors.accent,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  frame: {
    width: '80%',
    aspectRatio: 1.6,
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 8,
  },
  bottom: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  translucent: { backgroundColor: 'rgba(0,0,0,0.4)' },
});
