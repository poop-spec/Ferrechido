import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, StyleSheet, View } from 'react-native';
import {
  Appbar,
  Badge,
  Button,
  Chip,
  Dialog,
  FAB,
  Portal,
  Searchbar,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';
import ProductoCard from '../components/ProductoCard';
import ProductoForm from '../components/ProductoForm';
import {
  DatosProducto,
  Estado,
  Producto,
  formatoMoneda,
  obtenerEstado,
} from '../data/productos';
import {
  actualizarProducto,
  actualizarStock,
  cargarProductos,
  crearProducto,
  eliminarProducto,
} from '../api/productsApi';

type Filtro = 'TODOS' | Estado;

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: 'TODOS', etiqueta: 'TODOS' },
  { valor: 'AGOTADO', etiqueta: 'AGOTADO' },
  { valor: 'BAJO', etiqueta: 'BAJO STOCK' },
];

type Props = {
  accessToken: string;
  onLogout?: () => void;
};

export default function InventarioScreen({ accessToken, onLogout }: Props) {
  const theme = useTheme();

  // Datos
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargado, setCargado] = useState(false);

  // Búsqueda y filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('TODOS');
  const [soloAlertas, setSoloAlertas] = useState(false);

  // Ventanas
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<Producto | null>(null);
  const [porEliminar, setPorEliminar] = useState<Producto | null>(null);
  const [mensaje, setMensaje] = useState('');

  // READ: inventory is loaded from the authenticated Azure API.
  useEffect(() => {
    let activo = true;
    cargarProductos(accessToken)
      .then((lista) => {
        if (activo) setProductos(lista);
      })
      .catch((error: unknown) => {
        if (activo) setMensaje(error instanceof Error ? error.message : 'No se pudo cargar el inventario.');
      })
      .finally(() => {
        if (activo) setCargado(true);
      });
    return () => {
      activo = false;
    };
  }, [accessToken]);

  const seleccionado = productos.find((p) => p.id === seleccionadoId) ?? null;
  const totalAlertas = productos.filter((p) => obtenerEstado(p) !== 'NORMAL').length;

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const estado = obtenerEstado(p);
      const coincideTexto = p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const pasaFiltro = filtro === 'TODOS' || estado === filtro;
      const pasaAlertas = !soloAlertas || estado !== 'NORMAL';
      return coincideTexto && pasaFiltro && pasaAlertas;
    });
  }, [productos, busqueda, filtro, soloAlertas]);

  // CREATE
  const abrirNuevo = () => {
    setEditando(null);
    setFormVisible(true);
  };

  // UPDATE (abrir formulario con los datos del producto)
  const abrirEditar = (producto: Producto) => {
    setSeleccionadoId(null);
    setEditando(producto);
    setFormVisible(true);
  };

  // CREATE / UPDATE (guardar desde el formulario)
  const guardarFormulario = async (datos: DatosProducto) => {
    try {
      if (editando) {
        const actualizado = await actualizarProducto(accessToken, editando.id, datos);
        setProductos((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
        setMensaje('Producto actualizado');
      } else {
        const nuevo = await crearProducto(accessToken, datos);
        setProductos((actuales) => [nuevo, ...actuales]);
        setMensaje('Producto agregado');
      }
      setFormVisible(false);
      setEditando(null);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    }
  };

  // UPDATE (reabastecer): suma 10 unidades y el estado se recalcula solo.
  const reabastecer = async (producto: Producto) => {
    try {
      const actualizado = await actualizarStock(accessToken, producto.id, producto.stock + 10);
      setProductos((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setMensaje('Stock actualizado (+10)');
      setSeleccionadoId(null);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo actualizar el stock.');
    }
  };

  // DELETE (pide confirmación antes de borrar)
  const pedirEliminar = (producto: Producto) => {
    setSeleccionadoId(null);
    setPorEliminar(producto);
  };

  const confirmarEliminar = async () => {
    if (!porEliminar) return;
    try {
      await eliminarProducto(accessToken, porEliminar.id);
      setProductos((actuales) => actuales.filter((p) => p.id !== porEliminar.id));
      setMensaje('Producto eliminado');
      setPorEliminar(null);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
    }
  };

  return (
    <View style={[styles.pantalla, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="INVENTARIO" titleStyle={styles.titulo} />
        <View>
          <Appbar.Action icon="alert-outline" onPress={() => setSoloAlertas(true)} />
          <Badge style={styles.badge}>{totalAlertas}</Badge>
        </View>
        {onLogout && <Appbar.Action icon="logout" onPress={onLogout} />}
      </Appbar.Header>

      <Searchbar
        placeholder="Buscar producto o SKU..."
        value={busqueda}
        onChangeText={setBusqueda}
        style={styles.buscador}
      />

      <View style={styles.filtros}>
        {FILTROS.map((f) => (
          <Chip
            key={f.valor}
            selected={filtro === f.valor}
            onPress={() => setFiltro(f.valor)}
            style={styles.chip}
          >
            {f.etiqueta}
          </Chip>
        ))}
      </View>

      <View style={styles.filaSwitch}>
        <Text variant="bodyMedium">Mostrar solo alertas</Text>
        <Switch value={soloAlertas} onValueChange={setSoloAlertas} />
      </View>

      <Text variant="bodySmall" style={styles.contador}>
        {filtrados.length} productos
      </Text>

      <FlatList
        data={filtrados}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProductoCard producto={item} onPress={(p) => setSeleccionadoId(p.id)} />
        )}
        ListEmptyComponent={
          <Text variant="bodyMedium" style={styles.vacio}>
            {cargado ? 'No hay productos que mostrar' : 'Cargando...'}
          </Text>
        }
        contentContainerStyle={styles.lista}
      />

      <FAB icon="plus" label="Nuevo" style={styles.fab} onPress={abrirNuevo} />

      <Snackbar visible={mensaje !== ''} onDismiss={() => setMensaje('')} duration={3000}>
        {mensaje}
      </Snackbar>

      {/* Formulario para crear o editar */}
      <ProductoForm
        visible={formVisible}
        producto={editando}
        productos={productos}
        onGuardar={guardarFormulario}
        onCancelar={() => {
          setFormVisible(false);
          setEditando(null);
        }}
      />

      <Portal>
        {/* Detalle del producto */}
        <Dialog visible={seleccionado !== null} onDismiss={() => setSeleccionadoId(null)}>
          <Dialog.Title>{seleccionado?.nombre}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">SKU: {seleccionado?.sku}</Text>
            <Text variant="bodyMedium">Marca: {seleccionado?.marca}</Text>
            <Text variant="bodyMedium">Stock actual: {seleccionado?.stock} uds.</Text>
            <Text variant="bodyMedium">
              Precio: {seleccionado ? formatoMoneda(seleccionado.precio) : ''}
            </Text>
            <Text variant="bodyMedium">
              Ubicación:{' '}
              {seleccionado?.latitud != null && seleccionado.longitud != null
                ? `${seleccionado.latitud.toFixed(6)}, ${seleccionado.longitud.toFixed(6)}`
                : 'No disponible'}
            </Text>
            {seleccionado?.latitud != null && seleccionado.longitud != null && (
              <Button
                mode="text"
                icon="map-marker"
                onPress={() => {
                  const url = `https://maps.google.com/?q=${seleccionado.latitud},${seleccionado.longitud}`;
                  void Linking.openURL(url).catch(() => {
                    setMensaje('No se pudo abrir la ubicación en el mapa.');
                  });
                }}
              >
                Ver en mapa
              </Button>
            )}
            <View style={styles.accionesDetalle}>
              <Button
                mode="outlined"
                icon="pencil"
                style={styles.botonDetalle}
                onPress={() => seleccionado && abrirEditar(seleccionado)}
              >
                Editar
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                textColor={theme.colors.error}
                style={styles.botonDetalle}
                onPress={() => seleccionado && pedirEliminar(seleccionado)}
              >
                Eliminar
              </Button>
            </View>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => seleccionado && void reabastecer(seleccionado)}
            >
              Reabastecer +10
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSeleccionadoId(null)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Confirmación para eliminar */}
        <Dialog visible={porEliminar !== null} onDismiss={() => setPorEliminar(null)}>
          <Dialog.Title>Eliminar producto</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              ¿Seguro que quieres eliminar "{porEliminar?.nombre}"? Esta acción no se puede deshacer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPorEliminar(null)}>Cancelar</Button>
            <Button mode="contained" buttonColor={theme.colors.error} onPress={confirmarEliminar}>
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  titulo: { fontWeight: '800', letterSpacing: 2 },
  badge: { position: 'absolute', top: 4, right: 2 },
  buscador: { marginHorizontal: 16, marginBottom: 12 },
  filtros: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  chip: { marginBottom: 4 },
  filaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  contador: { paddingHorizontal: 16, paddingVertical: 8, opacity: 0.8 },
  lista: { paddingBottom: 96 },
  vacio: { textAlign: 'center', marginTop: 32, opacity: 0.7 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  accionesDetalle: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  botonDetalle: { flex: 1 },
});
