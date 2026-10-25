import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { Card, CardDraft, toDraft } from './cards';

/** Prefisso dei QR di condivisione, per distinguerli dai codici delle carte. */
const QR_PREFIX = 'TESSERE1:';

/** Le note restano private: possono contenere dati personali (PIN, titolare…). */
export function cardToQrPayload(card: CardDraft): string {
  const { name, code, format, color } = card;
  return QR_PREFIX + JSON.stringify({ name, code, format, color });
}

/** Restituisce la carta se `data` è un QR di condivisione di Tessere, altrimenti null. */
export function parseQrPayload(data: string): CardDraft | null {
  if (!data.startsWith(QR_PREFIX)) return null;
  try {
    return toDraft(JSON.parse(data.slice(QR_PREFIX.length)));
  } catch {
    return null;
  }
}

export async function exportJson(cards: Card[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `tessere-${stamp}.json`);
  if (file.exists) file.delete();
  file.create();
  const payload = {
    app: 'tessere',
    version: 1,
    exportedAt: new Date().toISOString(),
    cards: cards.map(({ name, code, format, color, note }) => ({ name, code, format, color, note })),
  };
  file.writeSync(JSON.stringify(payload, null, 2));
  if (!(await Sharing.isAvailableAsync())) throw new Error('Condivisione non disponibile');
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'Esporta tessere',
    mimeType: 'application/json',
  });
}

/** Apre il selettore file e restituisce le carte valide trovate, o null se annullato. */
export async function pickJson(): Promise<{ drafts: CardDraft[]; invalid: number } | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'application/octet-stream'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const text = await new File(result.assets[0].uri).text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Il file non è un JSON valido');
  }
  const list = Array.isArray(data) ? data : (data as { cards?: unknown })?.cards;
  if (!Array.isArray(list)) throw new Error('Nessuna lista di carte nel file');
  const drafts = list.map(toDraft).filter((d): d is CardDraft => d !== null);
  return { drafts, invalid: list.length - drafts.length };
}
