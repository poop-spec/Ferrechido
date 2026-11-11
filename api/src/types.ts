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
