import '@/polyfills';
import 'react-native-reanimated';

import { PrivyProvider, type PrivyConfig } from '@privy-io/expo';
import { PrivyElements } from '@privy-io/expo/ui';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useColorScheme } from '@/hooks/use-color-scheme';

const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;

if (!privyAppId) {
  throw new Error('EXPO_PUBLIC_PRIVY_APP_ID is required. Set it in your env file.');
}

const privyConfig: PrivyConfig = {
  embedded: {
    ethereum: {
      createOnLogin: 'off',
    },
    solana: {
      createOnLogin: 'all-users',
    },
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <PrivyProvider appId={privyAppId} clientId={process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID} config={privyConfig}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      <PrivyElements
        config={{
          appearance: {
            colorScheme: colorScheme === 'dark' ? 'dark' : 'light',
          },
        }}
      />
    </PrivyProvider>
  );
}
