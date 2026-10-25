import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { BarcodeFormat, FORMATS, renderBarcode } from '../lib/barcode';
import { colors, fonts } from '../lib/theme';
import { T } from './ui';

type Props = {
  format: BarcodeFormat;
  code: string;
  /** Mostra il numero sotto al codice. */
  showText?: boolean;
};

/** Codice a barre su fondo bianco, ridimensionato alla larghezza disponibile. */
export function BarcodeView({ format, code, showText = true }: Props) {
  const result = useMemo(() => renderBarcode(format, code), [format, code]);
  const is2d = FORMATS[format].is2d;

  if (result.error !== undefined) {
    return (
      <View style={[styles.box, styles.errorBox]}>
        <T style={styles.error}>! codice non valido per {FORMATS[format].label}</T>
        <T style={styles.errorDetail}>{result.error}</T>
      </View>
    );
  }

  // L'SVG di bwip-js ha un viewBox "0 0 w h": lo usiamo per mantenere le proporzioni.
  const [, , w, h] = result.svg.match(/viewBox="([^"]+)"/)?.[1].split(' ').map(Number) ?? [];
  const aspectRatio = w && h ? w / h : 1;

  return (
    <View style={styles.box}>
      <View style={[styles.svgWrap, is2d && styles.svgWrap2d, { aspectRatio }]}>
        <SvgXml xml={result.svg} width="100%" height="100%" />
      </View>
      {showText && (
        <T style={styles.code} selectable>
          {code}
        </T>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  svgWrap: { width: '100%' },
  svgWrap2d: { width: '75%' },
  code: { color: '#000000', fontFamily: fonts.medium, fontSize: 18, letterSpacing: 2 },
  errorBox: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.danger },
  error: { color: colors.danger },
  errorDetail: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
