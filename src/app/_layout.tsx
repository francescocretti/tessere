import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-mono';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { CardsProvider } from '../lib/cards';
import { colors, fonts } from '../lib/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ IBMPlexMono_400Regular, IBMPlexMono_500Medium, IBMPlexMono_700Bold });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <CardsProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.medium, fontSize: 17 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" options={{ title: '~/tessere' }} />
        <Stack.Screen name="scan" options={{ title: '> scansiona', headerShown: false }} />
        <Stack.Screen name="edit" options={{ title: '> carta' }} />
        <Stack.Screen name="card/[id]" options={{ title: '' }} />
        <Stack.Screen name="share/[id]" options={{ title: '> condividi' }} />
        <Stack.Screen name="backup" options={{ title: '> backup' }} />
      </Stack>
    </CardsProvider>
  );
}
