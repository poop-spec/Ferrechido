import sql from 'mssql';
import { DatosProducto, Producto } from './types.js';
import { getPool } from './database.js';

type ProductRow = {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  icono: string;
  stock: number;
  precio: number;
};

function toProducto(row: ProductRow): Producto {
  return { ...row, precio: Number(row.precio) };
}

const selectFields = `
  CONVERT(varchar(36), id) AS id,
  sku, nombre, marca, icono, stock, CAST(precio AS float) AS precio
`;
const outputFields = `
  CONVERT(varchar(36), inserted.id) AS id,
  inserted.sku AS sku, inserted.nombre AS nombre, inserted.marca AS marca,
  inserted.icono AS icono, inserted.stock AS stock,
  CAST(inserted.precio AS float) AS precio
`;

export async function listarProductos(): Promise<Producto[]> {
  const pool = await getPool();
  const result = await pool.request().query<ProductRow>(
    `SELECT ${selectFields} FROM dbo.Products ORDER BY nombre`
  );
  return result.recordset.map(toProducto);
}

export async function crearProducto(datos: DatosProducto): Promise<Producto> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('sku', sql.NVarChar(40), datos.sku)
    .input('nombre', sql.NVarChar(160), datos.nombre)
    .input('marca', sql.NVarChar(120), datos.marca)
    .input('icono', sql.NVarChar(16), datos.icono)
    .input('stock', sql.Int, datos.stock)
    .input('precio', sql.Decimal(18, 2), datos.precio)
    .query<ProductRow>(`
      INSERT INTO dbo.Products (sku, nombre, marca, icono, stock, precio)
      OUTPUT ${outputFields}
      VALUES (@sku, @nombre, @marca, @icono, @stock, @precio);
    `);
  return toProducto(result.recordset[0]);
}

export async function actualizarProducto(
  id: string,
  datos: DatosProducto
): Promise<Producto | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .input('sku', sql.NVarChar(40), datos.sku)
    .input('nombre', sql.NVarChar(160), datos.nombre)
    .input('marca', sql.NVarChar(120), datos.marca)
    .input('icono', sql.NVarChar(16), datos.icono)
    .input('stock', sql.Int, datos.stock)
    .input('precio', sql.Decimal(18, 2), datos.precio)
    .query<ProductRow>(`
      UPDATE dbo.Products
      SET sku = @sku, nombre = @nombre, marca = @marca,
          icono = @icono, stock = @stock, precio = @precio
      OUTPUT ${outputFields}
      WHERE id = @id;
    `);
  return result.recordset[0] ? toProducto(result.recordset[0]) : null;
}

export async function actualizarStock(id: string, stock: number): Promise<Producto | null> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .input('stock', sql.Int, stock)
    .query<ProductRow>(`
      UPDATE dbo.Products
      SET stock = @stock
      OUTPUT ${outputFields}
      WHERE id = @id;
    `);
  return result.recordset[0] ? toProducto(result.recordset[0]) : null;
}

export async function borrarProducto(id: string): Promise<boolean> {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('id', sql.UniqueIdentifier, id)
    .query('DELETE FROM dbo.Products WHERE id = @id;');
  return (result.rowsAffected[0] ?? 0) > 0;
}
