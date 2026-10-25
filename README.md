# tessere

Portafoglio di carte fedeltà per Android. Scansioni il codice della carta una volta, poi in cassa mostri lo schermo.
Tutto resta sul telefono: nessun account, nessun server.

## Funzioni

- **Scansione** dalla fotocamera (EAN-13/8, UPC-A/E, Code128/39/93, ITF, Codabar, QR, PDF417, DataMatrix, Aztec)
- **Inserimento manuale** per le carte con solo il numero stampato (anteprima e validazione del codice in tempo reale)
- **Lista** in ordine alfabetico con ricerca per nome o numero
- **Visualizzazione**: luminosità al massimo e schermo sempre acceso finché la carta è aperta
- **Condivisione via QR**: _carta → condividi_ mostra un QR. Un amico lo inquadra con _+ scansiona_ e la carta viene importata
- **Backup JSON**: _backup → esporta/importa_. All'import, le carte già presenti (stesso codice e formato) vengono saltate

## Sviluppo

```bash
npm install
npx expo run:android    # build di sviluppo su dispositivo/emulatore collegato
npx tsc --noEmit && npx expo lint
```

La cartella `android/` è generata da `expo prebuild` e non va modificata a mano: la configurazione nativa sta in `app.json`.

## APK

```bash
npm run apk
# → android/app/build/outputs/apk/release/app-release.apk
```

L'APK di release è firmato con il keystore di debug del template Expo. Va bene per la distribuzione tra amici:
la firma resta la stessa da una build all'altra, quindi gli aggiornamenti si installano sopra la versione precedente.
A ogni nuova versione incrementa `version` e `android.versionCode` in `app.json`.

L'APK è compilato solo per `arm64-v8a` e **senza minificazione R8** (`expo-build-properties` in `app.json`). Non riattivarla:
ML Kit, la libreria di scansione, crea i suoi componenti per riflessione e R8 ne rimuove i costruttori. La camera si apre ma
non legge nessun codice, e nei log compare `Failed to initialize BarcodeAnalyzer`.

`.npmrc` contiene `legacy-peer-deps=true` per evitare un conflitto con `react-dom`, una peer dependency opzionale di expo-router usata solo per il web.

## Struttura

```
src/app/            schermate (expo-router)
  index.tsx         lista + ricerca
  scan.tsx          fotocamera
  edit.tsx          nuova carta / modifica
  card/[id].tsx     carta da mostrare in cassa
  share/[id].tsx    QR di condivisione
  backup.tsx        export / import JSON
src/lib/            dati (cards), codici (barcode, bwip-js), transfer, tema
src/components/     BarcodeView, componenti UI
```

I dati sono in `tessere.json`, nella cartella documenti dell'app.
