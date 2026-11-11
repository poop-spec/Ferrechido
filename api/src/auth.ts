import { HttpRequest } from '@azure/functions';
import { createRemoteJWKSet, errors, jwtVerify, JWTPayload } from 'jose';
import { requiredSetting } from './config.js';

let remoteKeys: ReturnType<typeof createRemoteJWKSet> | undefined;
let remoteKeysUri: string | undefined;

function getRemoteKeys() {
  const uri = requiredSetting('AUTH_JWKS_URI');
  if (uri !== remoteKeysUri) {
    remoteKeys = createRemoteJWKSet(new URL(uri));
    remoteKeysUri = uri;
  }
  return remoteKeys!;
}

export async function verifyAccessToken(request: HttpRequest): Promise<JWTPayload | null> {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;

  try {
    const { payload } = await jwtVerify(match[1], getRemoteKeys(), {
      issuer: requiredSetting('AUTH_ISSUER'),
      audience: requiredSetting('AUTH_AUDIENCE'),
    });
    const grantedScopes = typeof payload.scp === 'string' ? payload.scp.split(/\s+/) : [];
    if (!grantedScopes.includes(requiredSetting('AUTH_REQUIRED_SCOPE'))) return null;
    return payload;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}
