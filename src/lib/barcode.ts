import { toSVG } from 'bwip-js/generic';

export type BarcodeFormat =
  | 'ean13'
  | 'ean8'
  | 'upc_a'
  | 'upc_e'
  | 'code128'
  | 'code39'
  | 'code93'
  | 'itf14'
  | 'codabar'
  | 'qr'
  | 'pdf417'
  | 'datamatrix'
  | 'aztec';

type FormatInfo = { label: string; bcid: string; is2d: boolean };

export const FORMATS: Record<BarcodeFormat, FormatInfo> = {
  ean13: { label: 'EAN-13', bcid: 'ean13', is2d: false },
  ean8: { label: 'EAN-8', bcid: 'ean8', is2d: false },
  upc_a: { label: 'UPC-A', bcid: 'upca', is2d: false },
  upc_e: { label: 'UPC-E', bcid: 'upce', is2d: false },
  code128: { label: 'CODE128', bcid: 'code128', is2d: false },
  code39: { label: 'CODE39', bcid: 'code39', is2d: false },
  code93: { label: 'CODE93', bcid: 'code93', is2d: false },
  itf14: { label: 'ITF', bcid: 'interleaved2of5', is2d: false },
  codabar: { label: 'CODABAR', bcid: 'rationalizedCodabar', is2d: false },
  qr: { label: 'QR', bcid: 'qrcode', is2d: true },
  pdf417: { label: 'PDF417', bcid: 'pdf417', is2d: true },
  datamatrix: { label: 'DATAMATRIX', bcid: 'datamatrix', is2d: true },
  aztec: { label: 'AZTEC', bcid: 'azteccode', is2d: true },
};

export const FORMAT_LIST = Object.keys(FORMATS) as BarcodeFormat[];

export function isFormat(value: unknown): value is BarcodeFormat {
  return typeof value === 'string' && value in FORMATS;
}

/**
 * Converte il `type` restituito dallo scanner nel nostro formato.
 * Lo scanner può restituire varianti (es. "EAN_13", "org.gs1.EAN-13").
 */
export function normalizeScannedType(type: string): BarcodeFormat {
  const t = type.toLowerCase().replace(/[^a-z0-9]/g, '');
  const table: [string, BarcodeFormat][] = [
    ['ean13', 'ean13'],
    ['ean8', 'ean8'],
    ['upca', 'upc_a'],
    ['upce', 'upc_e'],
    ['code128', 'code128'],
    ['code39', 'code39'],
    ['code93', 'code93'],
    ['itf', 'itf14'],
    ['interleaved2of5', 'itf14'],
    ['codabar', 'codabar'],
    ['qr', 'qr'],
    ['pdf417', 'pdf417'],
    ['datamatrix', 'datamatrix'],
    ['aztec', 'aztec'],
  ];
  return table.find(([key]) => t.includes(key))?.[1] ?? 'code128';
}

/** Cifra di controllo GS1 (EAN-13, EAN-8, UPC-A): pesi 3,1,3,1… partendo da destra. */
function hasValidGtinCheck(digits: string): boolean {
  const body = digits.slice(0, -1);
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    sum += Number(body[body.length - 1 - i]) * (i % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === Number(digits[digits.length - 1]);
}

/**
 * Deduce il formato dal contenuto, per l'inserimento manuale.
 * Nel dubbio CODE128: codifica qualsiasi testo ed è letto da tutti i lettori in cassa.
 */
export function detectFormat(code: string): BarcodeFormat {
  if (/^\d+$/.test(code) && hasValidGtinCheck(code)) {
    if (code.length === 13) return 'ean13';
    if (code.length === 8) return 'ean8';
    if (code.length === 12) return 'upc_a';
  }
  return 'code128';
}

export type RenderResult = { svg: string; error?: undefined } | { svg?: undefined; error: string };

/** Genera l'SVG del codice; restituisce un messaggio leggibile se i dati non sono validi per il formato. */
export function renderBarcode(format: BarcodeFormat, code: string): RenderResult {
  const info = FORMATS[format];
  try {
    const svg = toSVG({
      bcid: info.bcid,
      text: code,
      scale: 3,
      // bwip-js rifiuta `height: undefined`: per i 2D la chiave non deve proprio esserci.
      ...(info.is2d ? {} : { height: 18 }),
      paddingwidth: 0,
      paddingheight: 0,
      barcolor: '000000',
      backgroundcolor: 'ffffff',
    });
    return { svg };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // I messaggi di BWIPP hanno la forma "bwipp.codiceErrore#123: descrizione"
    return { error: msg.replace(/^.*?:\s*/, '') };
  }
}

export function isValidFor(format: BarcodeFormat, code: string): boolean {
  return code.length > 0 && renderBarcode(format, code).svg !== undefined;
}
