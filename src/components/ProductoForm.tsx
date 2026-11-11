import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Modal, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { CATEGORIAS, DatosProducto, Producto } from '../data/productos';

type Props = {
  visible: boolean;
  producto: Producto | null; // null = crear, con valor = editar
  productos: Producto[]; // para validar que el SKU no se repita
  onGuardar: (datos: DatosProducto) => void | Promise<void>;
  onCancelar: () => void;
};

type Campo = 'nombre' | 'sku' | 'marca' | 'stock' | 'precio';
type Errores = Partial<Record<Campo, string>>;

export default function ProductoForm({ visible, producto, productos, onGuardar, onCancelar }: Props) {
  const theme = useTheme();

  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [marca, setMarca] = useState('');
  const [stock, setStock] = useState('');
  const [precio, setPrecio] = useState('');
  const [icono, setIcono] = useState(CATEGORIAS[0].icono);
  const [errores, setErrores] = useState<Errores>({});

  // Cada vez que se abre el formulario se cargan los datos del producto (o se limpia).
  useEffect(() => {
    if (!visible) return;
    setNombre(producto?.nombre ?? '');
    setSku(producto?.sku ?? '');
    setMarca(producto?.marca ?? '');
    setStock(producto ? String(producto.stock) : '');
    setPrecio(producto ? String(producto.precio) : '');
    setIcono(producto?.icono ?? CATEGORIAS[0].icono);
    setErrores({});
  }, [visible, producto]);

  const guardar = () => {
    const e: Errores = {};
    const skuLimpio = sku.trim().toUpperCase();
    const precioNum = Number(precio.replace(',', '.'));

    if (nombre.trim() === '') e.nombre = 'Escribe el nombre';
    if (skuLimpio === '') {
      e.sku = 'Escribe el SKU';
    } else if (productos.some((p) => p.sku.toUpperCase() === skuLimpio && p.id !== producto?.id)) {
      e.sku = 'Ya existe un producto con ese SKU';
    }
    if (marca.trim() === '') e.marca = 'Escribe la marca';
    if (!/^\d+$/.test(stock.trim())) e.stock = 'Escribe un número entero (0 o más)';
    if (precio.trim() === '' || Number.isNaN(precioNum) || precioNum <= 0) {
      e.precio = 'Escribe un precio mayor a 0';
    }

    setErrores(e);
    if (Object.keys(e).length > 0) return;

    onGuardar({
      nombre: nombre.trim(),
      sku: skuLimpio,
      marca: marca.trim(),
      icono,
      stock: Number(stock.trim()),
      precio: precioNum,
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancelar}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <Text variant="titleLarge" style={styles.titulo}>
            {producto ? 'Editar producto' : 'Nuevo producto'}
          </Text>

          <TextInput mode="outlined" label="Nombre" value={nombre} onChangeText={setNombre} error={!!errores.nombre} />
          <HelperText type="error" visible={!!errores.nombre}>{errores.nombre}</HelperText>

          <TextInput
            mode="outlined"
            label="SKU (ej. HER-005)"
            value={sku}
            onChangeText={setSku}
            autoCapitalize="characters"
            error={!!errores.sku}
          />
          <HelperText type="error" visible={!!errores.sku}>{errores.sku}</HelperText>

          <TextInput mode="outlined" label="Marca" value={marca} onChangeText={setMarca} error={!!errores.marca} />
          <HelperText type="error" visible={!!errores.marca}>{errores.marca}</HelperText>

          <View style={styles.fila}>
            <View style={styles.mitad}>
              <TextInput
                mode="outlined"
                label="Stock"
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
                error={!!errores.stock}
              />
              <HelperText type="error" visible={!!errores.stock}>{errores.stock}</HelperText>
            </View>
            <View style={styles.mitad}>
              <TextInput
                mode="outlined"
                label="Precio"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
                error={!!errores.precio}
              />
              <HelperText type="error" visible={!!errores.precio}>{errores.precio}</HelperText>
            </View>
          </View>

          <Text variant="labelLarge" style={styles.etiqueta}>Categoría</Text>
          <View style={styles.categorias}>
            {CATEGORIAS.map((c) => (
              <Chip key={c.etiqueta} selected={icono === c.icono} onPress={() => setIcono(c.icono)}>
                {c.icono} {c.etiqueta}
              </Chip>
            ))}
          </View>

          <View style={styles.acciones}>
            <Button onPress={onCancelar}>Cancelar</Button>
            <Button mode="contained" onPress={guardar}>
              {producto ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 16, padding: 20, borderWidth: 1, maxHeight: '90%' },
  titulo: { fontWeight: '700', marginBottom: 12 },
  fila: { flexDirection: 'row', gap: 12 },
  mitad: { flex: 1 },
  etiqueta: { marginTop: 4, marginBottom: 8 },
  categorias: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
});
