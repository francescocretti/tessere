import * as Brightness from 'expo-brightness';
import { useFocusEffect } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useCallback } from 'react';

/**
 * Finché la schermata è a fuoco: luminosità al massimo e schermo sempre acceso,
 * così il lettore in cassa legge il codice senza problemi.
 */
export function useMaxBrightness() {
  useKeepAwake();
  useFocusEffect(
    useCallback(() => {
      Brightness.setBrightnessAsync(1).catch(() => {});
      return () => {
        Brightness.restoreSystemBrightnessAsync().catch(() => {});
      };
    }, []),
  );
}
