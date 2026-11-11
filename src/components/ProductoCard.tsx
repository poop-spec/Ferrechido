import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Chip, Text, useTheme } from 'react-native-paper';
import { COLORES_ESTADO } from '../theme';
import { Producto, formatoMoneda, obtenerEstado } from '../data/productos';

type Props = {
  producto: Producto;
  onPress: (producto: Producto) => void;
};

export default function ProductoCard({ producto, onPress }: Props) {
  const theme = useTheme();
  const estado = obtenerEstado(producto);
  const color = COLORES_ESTADO[estado];

  return (
    <Card
      mode="outlined"
      style={[styles.card, { borderColor: theme.colors.outline }]}
      onPress={() => onPress(producto)}
    >
      <Card.Content style={styles.contenido}>
        <View style={[styles.icono, { borderColor: theme.colors.outline }]}>
          <Text style={styles.emoji}>{producto.icono}</Text>
        </View>

        <View style={styles.info}>
          <Text variant="titleMedium" style={styles.nombre}>
            {producto.nombre}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {producto.sku} - {producto.marca}
          </Text>
          <View style={styles.fila}>
            <Chip
              compact
              style={{ backgroundColor: color.fondo }}
              textStyle={{ color: color.texto, fontWeight: '700' }}
            >
              {estado}
            </Chip>
            <Text variant="bodySmall" style={styles.unidades}>
              {producto.stock} uds.
            </Text>
          </View>
        </View>

        <View style={styles.precioBox}>
          <Text variant="titleMedium">{formatoMoneda(producto.precio)}</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            c/u
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 10, backgroundColor: 'transparent' },
  contenido: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: { width: 44, height: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  nombre: { fontWeight: '700' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  unidades: { opacity: 0.9 },
  precioBox: { alignItems: 'flex-end' },
});
