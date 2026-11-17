import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import InventarioScreen from './src/screens/InventarioScreen';
import { ferrechidoTheme } from './src/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={ferrechidoTheme}>
        <InventarioScreen />
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
