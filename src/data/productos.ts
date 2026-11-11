export type Estado = 'NORMAL' | 'BAJO' | 'AGOTADO';

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  icono: string;
  stock: number;
  precio: number;
}

export type DatosProducto = Omit<Producto, 'id'>;

// Categorias disponibles al crear o editar un producto (definen el icono).
export const CATEGORIAS = [
  { etiqueta: 'Herramientas', icono: '🔨' },
  { etiqueta: 'Fijaciones', icono: '🔩' },
  { etiqueta: 'Pinturas', icono: '🎨' },
  { etiqueta: 'Electricidad', icono: '⚡' },
];

// Umbral a partir del cual un producto se considera con stock bajo.
const STOCK_BAJO = 10;

export function obtenerEstado(producto: Producto): Estado {
  if (producto.stock === 0) return 'AGOTADO';
  if (producto.stock <= STOCK_BAJO) return 'BAJO';
  return 'NORMAL';
}

export function formatoMoneda(valor: number): string {
  return '$' + valor.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Datos de ejemplo tomados de la pantalla de Inventario.
// Los precios de FIJ-002 y PIN-002 son de ejemplo (no aparecen en la captura).
export const productosIniciales: Producto[] = [
  { id: '1', sku: 'HER-001', nombre: 'Martillo Carpintero 20oz', marca: 'Truper', icono: '🔨', stock: 48, precio: 189.5 },
  { id: '2', sku: 'HER-002', nombre: 'Taladro Percutor 13mm', marca: 'Bosch', icono: '🔨', stock: 7, precio: 1250 },
  { id: '3', sku: 'HER-003', nombre: 'Desarmador Plano 6"', marca: 'Truper', icono: '🔨', stock: 120, precio: 35 },
  { id: '4', sku: 'HER-004', nombre: 'Llave Ajustable 12"', marca: 'Pretul', icono: '🔨', stock: 3, precio: 210 },
  { id: '5', sku: 'FIJ-002', nombre: 'Clavo Acero 2 1/2" (kg)', marca: 'Fastenall', icono: '🔩', stock: 0, precio: 68 },
  { id: '6', sku: 'PIN-002', nombre: 'Sellador Acrílico 19L', marca: 'Comex', icono: '🎨', stock: 5, precio: 1450 },
];
