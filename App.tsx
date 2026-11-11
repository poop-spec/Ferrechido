import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import InventarioScreen from './src/screens/InventarioScreen';
import LoginScreen from './src/screens/LoginScreen';
import { ferrechidoTheme } from './src/theme';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={ferrechidoTheme}>
        {accessToken ? (
          <InventarioScreen accessToken={accessToken} onLogout={() => setAccessToken(null)} />
        ) : (
          <LoginScreen onLogin={setAccessToken} />
        )}
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
