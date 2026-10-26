// Config plugin: firma la build di release con il keystore personale indicato in ~/.gradle/gradle.properties
// (TESSERE_KEYSTORE_FILE, TESSERE_KEYSTORE_PASSWORD, TESSERE_KEY_ALIAS, TESSERE_KEY_PASSWORD).
// Senza quelle proprietà usa il keystore di debug, così il progetto compila anche per chi lo clona.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// withReleaseSigning';

const SIGNING_CONFIG = `
        ${MARKER}
        if (findProperty('TESSERE_KEYSTORE_FILE')) {
            release {
                storeFile file(findProperty('TESSERE_KEYSTORE_FILE'))
                storePassword findProperty('TESSERE_KEYSTORE_PASSWORD')
                keyAlias findProperty('TESSERE_KEY_ALIAS')
                keyPassword findProperty('TESSERE_KEY_PASSWORD')
            }
        } else {
            logger.warn('TESSERE_KEYSTORE_FILE non impostata: la release viene firmata con il keystore di debug')
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    // Prima il buildType (finché l'unico "release {" è quello in buildTypes), poi la signingConfig.
    const buildType = /(\brelease \{[^{}]*?)signingConfig signingConfigs\.debug/;
    const signingConfigs = /(signingConfigs \{\s*debug \{[^{}]*\})/;
    if (!buildType.test(gradle) || !signingConfigs.test(gradle)) {
      // Meglio fallire che produrre in silenzio un APK firmato con la chiave sbagliata.
      throw new Error('withReleaseSigning: struttura di app/build.gradle non riconosciuta');
    }
    gradle = gradle.replace(
      buildType,
      "$1signingConfig signingConfigs.findByName('release') ?: signingConfigs.debug",
    );
    gradle = gradle.replace(signingConfigs, `$1${SIGNING_CONFIG}`);

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
