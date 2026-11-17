export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  icono: string;
  stock: number;
  precio: number;
  latitud: number | null;
  longitud: number | null;
}

export type DatosProducto = Omit<Producto, 'id' | 'latitud' | 'longitud'> & {
  latitud?: number | null;
  longitud?: number | null;
};
