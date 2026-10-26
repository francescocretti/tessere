/**
 * Catalogo offline di catene con tessera fedeltà: serve solo a suggerire nome e colore
 * mentre si scrive il nome della carta. I colori approssimano quello principale del marchio;
 * per aggiungere una catena basta una riga qui.
 */
export type Chain = {
  name: string;
  color: string;
  /** Altri nomi con cui la si cerca (nome della tessera, insegne dello stesso gruppo…). */
  aliases?: string[];
};

export const CHAINS: Chain[] = [
  { name: 'Aldi', color: '#00a0e1' },
  { name: 'Auchan', color: '#e2001a' },
  { name: 'Benetton', color: '#00873e' },
  { name: 'Carrefour', color: '#1e5bc6', aliases: ['carrefour market', 'carrefour express'] },
  { name: 'Conad', color: '#e30613', aliases: ['conad superstore', 'spazio conad'] },
  { name: 'Coop', color: '#e2001a', aliases: ['ipercoop', 'unicoop', 'novacoop'] },
  { name: 'Decathlon', color: '#0082c3' },
  { name: 'Despar', color: '#00843d', aliases: ['spar', 'interspar', 'eurospar'] },
  { name: 'Douglas', color: '#9bdcd2' },
  { name: 'Esselunga', color: '#0062ae', aliases: ['fidaty'] },
  { name: 'Eurospin', color: '#004a99' },
  { name: 'Feltrinelli', color: '#e30613', aliases: ['la feltrinelli'] },
  { name: 'H&M', color: '#e50010', aliases: ['h&m member'] },
  { name: 'IKEA', color: '#0058a3', aliases: ['ikea family'] },
  { name: 'Italo', color: '#b41e2d', aliases: ['italo più', 'italo treno'] },
  { name: 'Leroy Merlin', color: '#78be20' },
  { name: 'Lidl', color: '#0050aa', aliases: ['lidl plus'] },
  { name: 'MediaWorld', color: '#df0000', aliases: ['media world'] },
  { name: 'NaturaSì', color: '#5a9e2f', aliases: ['natura si'] },
  { name: 'OBI', color: '#ff7d00' },
  { name: 'Penny', color: '#cd1316', aliases: ['penny market'] },
  { name: 'Primark', color: '#00a4e4' },
  { name: 'Sephora', color: '#ffffff' },
  { name: 'Trenitalia', color: '#c8102e', aliases: ['cartafreccia', 'frecciarossa'] },
];

/** Minuscolo, senza accenti né punteggiatura: "NaturaSì" → "naturasi". */
function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9& ]/g, '')
    .trim();
}

/**
 * Catene il cui nome o alias contiene una parola che inizia con il testo digitato.
 * Prima quelle il cui nome inizia con il testo, poi le altre.
 */
export function suggestChains(query: string, limit = 4): Chain[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const rank = (c: Chain) => {
    if (normalize(c.name).startsWith(q)) return 0;
    // Confronta sia il nome/alias intero (per testi con spazi) sia le singole parole.
    const names = [c.name, ...(c.aliases ?? [])].map(normalize);
    const matches = names.some((n) => n.startsWith(q) || n.split(' ').some((w) => w.startsWith(q)));
    return matches ? 1 : -1;
  };
  return CHAINS.map((c) => ({ c, r: rank(c) }))
    .filter(({ r }) => r >= 0)
    .sort((a, b) => a.r - b.r)
    .slice(0, limit)
    .map(({ c }) => c);
}

/** La catena con esattamente questo nome, se presente nel catalogo. */
export function findChain(name: string): Chain | undefined {
  const n = normalize(name);
  return n ? CHAINS.find((c) => normalize(c.name) === n) : undefined;
}
