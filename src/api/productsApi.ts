import { DatosProducto, Producto } from '../data/productos';

const apiUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? '';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  accessToken: string,
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<T> {
  if (!apiUrl) {
    throw new ApiError('Configura EXPO_PUBLIC_API_URL en .env.', 0);
  }

  const response = await fetch(`${apiUrl}/api/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  if (!response.ok) {
    let message = `La API respondió con el estado ${response.status}.`;
    try {
      const payload: unknown = await response.json();
      if (typeof payload === 'object' && payload !== null && 'error' in payload &&
          typeof payload.error === 'string') {
        message = payload.error;
      }
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function cargarProductos(accessToken: string): Promise<Producto[]> {
  return request(accessToken, 'products', 'GET');
}

export function crearProducto(accessToken: string, datos: DatosProducto): Promise<Producto> {
  return request(accessToken, 'products', 'POST', datos);
}

export function actualizarProducto(
  accessToken: string,
  id: string,
  datos: DatosProducto
): Promise<Producto> {
  return request(accessToken, `products/${encodeURIComponent(id)}`, 'PUT', datos);
}

export function actualizarStock(accessToken: string, id: string, stock: number): Promise<Producto> {
  return request(accessToken, `products/${encodeURIComponent(id)}`, 'PATCH', { stock });
}

export function eliminarProducto(accessToken: string, id: string): Promise<void> {
  return request(accessToken, `products/${encodeURIComponent(id)}`, 'DELETE');
}
