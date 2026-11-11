import { MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// Tema global: oscuro, esquinas rectas y acento ámbar, como en Ferrechido.
export const ferrechidoTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 0,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#F5B52E',
    onPrimary: '#000000',
    background: '#0D0D12',
    surface: '#15151C',
    surfaceVariant: '#1C1C24',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B5B5BF',
    outline: '#FFFFFF',
    error: '#F0616D',
  },
};

// Colores de las etiquetas de estado de stock.
export const COLORES_ESTADO = {
  NORMAL: { fondo: '#12372F', texto: '#2ED3A0' },
  BAJO: { fondo: '#3A2E10', texto: '#F5B52E' },
  AGOTADO: { fondo: '#3C1A22', texto: '#F0616D' },
} as const;
