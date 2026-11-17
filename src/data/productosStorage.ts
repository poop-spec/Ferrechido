import AsyncStorage from '@react-native-async-storage/async-storage';
import { Producto, productosIniciales } from './productos';

const STORAGE_KEY = '@ferrechido/productos-v1';

function isProducto(value: unknown): value is Producto {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const producto = value as Record<string, unknown>;
  const coordenadaValida = (coordenada: unknown) =>
    coordenada === null || (typeof coordenada === 'number' && Number.isFinite(coordenada));

  return (
    typeof producto.id === 'string' &&
    typeof producto.sku === 'string' &&
    typeof producto.nombre === 'string' &&
    typeof producto.marca === 'string' &&
    typeof producto.icono === 'string' &&
    typeof producto.stock === 'number' &&
    Number.isFinite(producto.stock) &&
    typeof producto.precio === 'number' &&
    Number.isFinite(producto.precio) &&
    coordenadaValida(producto.latitud) &&
    coordenadaValida(producto.longitud)
  );
}

export async function leerProductosLocales(): Promise<Producto[]> {
  const contenido = await AsyncStorage.getItem(STORAGE_KEY);
  if (contenido === null) return productosIniciales;

  let productos: unknown;
  try {
    productos = JSON.parse(contenido);
  } catch {
    throw new Error('El inventario guardado está dañado y no se pudo leer.');
  }

  if (!Array.isArray(productos) || !productos.every(isProducto)) {
    throw new Error('El inventario guardado tiene un formato no válido.');
  }

  return productos;
}

export async function guardarProductosLocales(productos: Producto[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}
