import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { verifyAccessToken } from '../auth.js';
import { isSkuConflict } from '../database.js';
import {
  actualizarProducto as actualizarProductoDb,
  actualizarStock as actualizarStockDb,
  borrarProducto,
  crearProducto as crearProductoDb,
  listarProductos,
} from '../products.js';
import { DatosProducto } from '../types.js';

function json(status: number, body: unknown): HttpResponseInit {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: body,
  };
}

async function authorize(request: HttpRequest, context: InvocationContext) {
  try {
    const payload = await verifyAccessToken(request);
    if (!payload) return json(401, { error: 'Se requiere una sesión válida de Microsoft.' });
    return null;
  } catch (error) {
    context.error('Access token verification is unavailable.', error);
    return json(503, { error: 'No se pudo validar la sesión. Intenta de nuevo más tarde.' });
  }
}

function isDatosProducto(value: unknown): value is DatosProducto {
  if (typeof value !== 'object' || value === null) return false;
  const datos = value as Record<string, unknown>;
  return (
    typeof datos.sku === 'string' &&
    datos.sku.trim().length > 0 &&
    datos.sku.length <= 40 &&
    typeof datos.nombre === 'string' &&
    datos.nombre.trim().length > 0 &&
    datos.nombre.length <= 160 &&
    typeof datos.marca === 'string' &&
    datos.marca.trim().length > 0 &&
    datos.marca.length <= 120 &&
    typeof datos.icono === 'string' &&
    datos.icono.length > 0 &&
    datos.icono.length <= 16 &&
    Number.isInteger(datos.stock) &&
    Number(datos.stock) >= 0 &&
    typeof datos.precio === 'number' &&
    Number.isFinite(datos.precio) &&
    datos.precio > 0 &&
    datos.precio <= 9999999999999999
  );
}

async function readJson(request: HttpRequest): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function logDatabaseError(context: InvocationContext, error: unknown) {
  context.error('Product database operation failed.', error);
  if (isSkuConflict(error)) return json(409, { error: 'Ya existe un producto con ese SKU.' });
  return json(500, { error: 'No se pudo completar la operación del inventario.' });
}

app.http('listProducts', {
  route: 'products',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const unauthorized = await authorize(request, context);
    if (unauthorized) return unauthorized;
    try {
      return json(200, await listarProductos());
    } catch (error) {
      return logDatabaseError(context, error);
    }
  },
});

app.http('createProduct', {
  route: 'products',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const unauthorized = await authorize(request, context);
    if (unauthorized) return unauthorized;
    const body = await readJson(request);
    if (!isDatosProducto(body)) return json(400, { error: 'Los datos del producto no son válidos.' });
    try {
      return json(201, await crearProductoDb(body));
    } catch (error) {
      return logDatabaseError(context, error);
    }
  },
});

app.http('updateProduct', {
  route: 'products/{id}',
  methods: ['PUT'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const unauthorized = await authorize(request, context);
    if (unauthorized) return unauthorized;
    const id = request.params.id;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return json(400, { error: 'El identificador del producto no es válido.' });
    }
    const body = await readJson(request);
    if (!isDatosProducto(body)) return json(400, { error: 'Los datos del producto no son válidos.' });
    try {
      const producto = await actualizarProductoDb(id, body);
      return producto ? json(200, producto) : json(404, { error: 'No se encontró el producto.' });
    } catch (error) {
      return logDatabaseError(context, error);
    }
  },
});

app.http('restockProduct', {
  route: 'products/{id}',
  methods: ['PATCH'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const unauthorized = await authorize(request, context);
    if (unauthorized) return unauthorized;
    const id = request.params.id;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return json(400, { error: 'El identificador del producto no es válido.' });
    }
    const body = await readJson(request);
    if (
      typeof body !== 'object' ||
      body === null ||
      !('stock' in body) ||
      !Number.isInteger(body.stock) ||
      Number(body.stock) < 0
    ) {
      return json(400, { error: 'La cantidad de existencias no es válida.' });
    }
    try {
      const producto = await actualizarStockDb(id, Number(body.stock));
      return producto ? json(200, producto) : json(404, { error: 'No se encontró el producto.' });
    } catch (error) {
      return logDatabaseError(context, error);
    }
  },
});

app.http('deleteProduct', {
  route: 'products/{id}',
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const unauthorized = await authorize(request, context);
    if (unauthorized) return unauthorized;
    const id = request.params.id;
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return json(400, { error: 'El identificador del producto no es válido.' });
    }
    try {
      const deleted = await borrarProducto(id);
      return deleted ? { status: 204 } : json(404, { error: 'No se encontró el producto.' });
    } catch (error) {
      return logDatabaseError(context, error);
    }
  },
});
