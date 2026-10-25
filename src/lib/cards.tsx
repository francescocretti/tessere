import { File, Paths } from 'expo-file-system';
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { BarcodeFormat, isFormat } from './barcode';
import { cardColors } from './theme';

export type Card = {
  id: string;
  name: string;
  code: string;
  format: BarcodeFormat;
  color: string;
  note?: string;
  createdAt: number;
  updatedAt: number;
};

export type CardDraft = Pick<Card, 'name' | 'code' | 'format' | 'color' | 'note'>;

export const NOTE_MAX = 200;

const storeFile = new File(Paths.document, 'tessere.json');

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Valida un oggetto qualsiasi (da file o QR) e lo trasforma in bozza di carta. */
export function toDraft(raw: unknown): CardDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  const code = typeof o.code === 'string' ? o.code.trim() : '';
  if (!name || !code || !isFormat(o.format)) return null;
  const color =
    typeof o.color === 'string' && /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : cardColors[0];
  const note = typeof o.note === 'string' ? o.note.trim().slice(0, NOTE_MAX) : '';
  return { name, code, format: o.format, color, ...(note ? { note } : {}) };
}

function load(): Card[] {
  try {
    if (!storeFile.exists) return [];
    const data = JSON.parse(storeFile.textSync());
    if (!Array.isArray(data?.cards)) return [];
    return data.cards.flatMap((c: Record<string, unknown>) => {
      const draft = toDraft(c);
      if (!draft || typeof c.id !== 'string') return [];
      const createdAt = typeof c.createdAt === 'number' ? c.createdAt : Date.now();
      const updatedAt = typeof c.updatedAt === 'number' ? c.updatedAt : createdAt;
      return [{ ...draft, id: c.id, createdAt, updatedAt }];
    });
  } catch (e) {
    console.warn('Lettura tessere fallita', e);
    return [];
  }
}

function persist(cards: Card[]) {
  if (!storeFile.exists) storeFile.create();
  storeFile.writeSync(JSON.stringify({ version: 1, cards }));
}

export function sortCards(cards: Card[]) {
  return [...cards].sort((a, b) => a.name.localeCompare(b.name, 'it', { sensitivity: 'base' }));
}

const sameCard = (a: CardDraft, b: CardDraft) => a.code === b.code && a.format === b.format;

type CardsApi = {
  cards: Card[];
  get: (id: string) => Card | undefined;
  add: (draft: CardDraft) => Card;
  update: (id: string, draft: CardDraft) => void;
  remove: (id: string) => void;
  /** Aggiunge le bozze non già presenti (stesso codice e formato). Restituisce quante ne ha aggiunte. */
  importMany: (drafts: CardDraft[]) => { added: number; skipped: number };
  findDuplicate: (draft: CardDraft) => Card | undefined;
};

const CardsContext = createContext<CardsApi | null>(null);

export function CardsProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<Card[]>(load);

  const commit = useCallback((next: Card[]) => {
    persist(next);
    setCards(next);
  }, []);

  const api = useMemo<CardsApi>(() => {
    const findDuplicate = (draft: CardDraft) => cards.find((c) => sameCard(c, draft));
    return {
      cards,
      findDuplicate,
      get: (id) => cards.find((c) => c.id === id),
      add: (draft) => {
        const now = Date.now();
        const card: Card = { ...draft, id: newId(), createdAt: now, updatedAt: now };
        commit([...cards, card]);
        return card;
      },
      update: (id, draft) => {
        commit(
          cards.map((c) => {
            if (c.id !== id) return c;
            // `note` assente nella bozza = nota cancellata
            const { note: _old, ...rest } = c;
            return { ...rest, ...draft, updatedAt: Date.now() };
          }),
        );
      },
      remove: (id) => commit(cards.filter((c) => c.id !== id)),
      importMany: (drafts) => {
        const next = [...cards];
        let added = 0;
        for (const d of drafts) {
          if (next.some((c) => sameCard(c, d))) continue;
          const now = Date.now();
          next.push({ ...d, id: newId(), createdAt: now, updatedAt: now });
          added++;
        }
        if (added) commit(next);
        return { added, skipped: drafts.length - added };
      },
    };
  }, [cards, commit]);

  return <CardsContext.Provider value={api}>{children}</CardsContext.Provider>;
}

export function useCards() {
  const ctx = useContext(CardsContext);
  if (!ctx) throw new Error('useCards fuori da CardsProvider');
  return ctx;
}
